import { useEffect, useId, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { buildLocalDateTime, parseLocalDateTime } from "@/lib/date-time";
import { useLocale } from "@/lib/locale";
import {
	calculateRequestedCarpoolSeats,
	formatSeatCount,
} from "@/lib/rsvp-carpool";

export interface RSVPFormData {
	guestAttendances: Record<string, "yes" | "no">;
	plusOneAttendance?: "yes" | "no";
	plusOneName?: string;
	childrenCount: number;
	childrenSleepOption?: "extraBed" | "crib";
	accommodationType?: "hostProvided" | "selfArranged";
	needsExtraNightsHelp: boolean;
	extraNightsFromDate?: string;
	extraNightsToDate?: string;
	selectedCarpoolOfferId?: string;
	transport: "own" | "bus";
	carpoolDriverOptIn?: "yes" | "no";
	arrivalDateTime: string;
	departureDateTime: string;
	message: string;
}

export interface RsvpGuestOption {
	id: string;
	fullName: string;
}

export interface RsvpCarpoolSuggestion {
	_id: string;
	driverDisplayName: string;
	driverArrivalDateTime?: string;
	pickupPoint?: string;
	dropoffPoint?: string;
	departureDateTime: string;
	seatsAvailable: number;
	myRequestId?: string;
	myRequestStatus?: string;
}

interface RsvpFormProps {
	onSubmit?: (data: RSVPFormData) => void;
	defaultValues?: Partial<RSVPFormData>;
	hasPlusOne?: boolean;
	disabled?: boolean;
	invitationGuests: RsvpGuestOption[];
	carpoolSuggestions?: RsvpCarpoolSuggestion[];
}

export function RsvpForm({
	onSubmit,
	defaultValues,
	hasPlusOne,
	disabled,
	invitationGuests,
	carpoolSuggestions = [],
}: RsvpFormProps) {
	const { locale } = useLocale();
	const isEnglish = locale === "en";
	const formIdPrefix = useId();
	const guestAttendancesId = `${formIdPrefix}-guest-attendances`;
	const plusOneNameId = `${formIdPrefix}-plus-one-name`;
	const childrenCountId = `${formIdPrefix}-children-count`;
	const arrivalDateId = `${formIdPrefix}-arrival-date`;
	const departureDateId = `${formIdPrefix}-departure-date`;
	const extraNightsHelpId = `${formIdPrefix}-extra-nights-help`;
	const extraNightsFromDateId = `${formIdPrefix}-extra-nights-from-date`;
	const extraNightsToDateId = `${formIdPrefix}-extra-nights-to-date`;
	const messageId = `${formIdPrefix}-message`;

	const {
		register,
		control,
		handleSubmit,
		setValue,
		watch,
		getValues,
		setError,
		clearErrors,
		formState: { errors },
	} = useForm<RSVPFormData>({
		defaultValues: {
			guestAttendances: {},
			transport: "own",
			carpoolDriverOptIn: "no",
			childrenCount: 0,
			needsExtraNightsHelp: false,
			extraNightsFromDate: "",
			extraNightsToDate: "",
			arrivalDateTime: "",
			departureDateTime: "",
			message: "",
			...defaultValues,
		},
	});

	const guestAttendances = watch("guestAttendances") ?? {};
	const plusOneAttendance = watch("plusOneAttendance");
	const childrenCount = watch("childrenCount");
	const childrenSleepOption = watch("childrenSleepOption");
	const accommodationType = watch("accommodationType");
	const needsExtraNightsHelp = watch("needsExtraNightsHelp");
	const selectedCarpoolOfferId = watch("selectedCarpoolOfferId");
	const transport = watch("transport");
	const normalizedChildrenCount = normalizeChildrenCount(childrenCount);
	const availableGuests = useMemo(
		() =>
			invitationGuests
				.map((guest) => ({
					id: guest.id.trim(),
					fullName: guest.fullName.trim(),
				}))
				.filter((guest) => guest.id.length > 0 && guest.fullName.length > 0),
		[invitationGuests],
	);
	const guestSet = useMemo(
		() => new Set(availableGuests.map((guest) => guest.id)),
		[availableGuests],
	);
	const initialArrival = useMemo(
		() => parseLocalDateTime(defaultValues?.arrivalDateTime),
		[defaultValues?.arrivalDateTime],
	);
	const initialDeparture = useMemo(
		() => parseLocalDateTime(defaultValues?.departureDateTime),
		[defaultValues?.departureDateTime],
	);
	const initialExtraNightsFromDate = useMemo(() => {
		const parsed = parseLocalDateTime(defaultValues?.extraNightsFromDate);
		if (parsed.date) return parsed.date;
		return initialArrival.date;
	}, [defaultValues?.extraNightsFromDate, initialArrival.date]);
	const initialExtraNightsToDate = useMemo(() => {
		const parsed = parseLocalDateTime(defaultValues?.extraNightsToDate);
		if (parsed.date) return parsed.date;
		return initialArrival.date;
	}, [defaultValues?.extraNightsToDate, initialArrival.date]);
	const [arrivalDate, setArrivalDate] = useState<Date | undefined>(
		initialArrival.date,
	);
	const [arrivalTime, setArrivalTime] = useState<string>(initialArrival.time);
	const [departureDate, setDepartureDate] = useState<Date | undefined>(
		initialDeparture.date,
	);
	const [departureTime, setDepartureTime] = useState<string>(
		initialDeparture.time,
	);
	const [extraNightsFromDate, setExtraNightsFromDate] = useState<
		Date | undefined
	>(initialExtraNightsFromDate);
	const [extraNightsToDate, setExtraNightsToDate] = useState<Date | undefined>(
		initialExtraNightsToDate,
	);
	const [openGuestPopoverId, setOpenGuestPopoverId] = useState<string | null>(
		null,
	);

	const guestsWithDecisionsCount = useMemo(
		() =>
			availableGuests.filter((guest) => {
				const decision = guestAttendances[guest.id];
				return decision === "yes" || decision === "no";
			}).length,
		[availableGuests, guestAttendances],
	);
	const hasAllGuestDecisions =
		availableGuests.length > 0 &&
		guestsWithDecisionsCount === availableGuests.length;
	const hasAnyAttending = availableGuests.some(
		(guest) => guestAttendances[guest.id] === "yes",
	);
	const canUseExtraNightsHelp =
		hasAnyAttending && accommodationType === "hostProvided";
	const allGuestsAttending =
		hasAllGuestDecisions &&
		availableGuests.every((guest) => guestAttendances[guest.id] === "yes");
	const noGuestAttending =
		hasAllGuestDecisions &&
		availableGuests.every((guest) => guestAttendances[guest.id] === "no");
	const requestedCarpoolSeats = useMemo(
		() =>
			calculateRequestedCarpoolSeats({
				guestAttendances,
				hasPlusOne: Boolean(hasPlusOne),
				plusOneAttendance,
				childrenCount: normalizedChildrenCount,
			}),
		[guestAttendances, hasPlusOne, plusOneAttendance, normalizedChildrenCount],
	);
	const hasOfferMatchingRequestedSeats = useMemo(
		() =>
			carpoolSuggestions.some(
				(offer) => offer.seatsAvailable >= requestedCarpoolSeats,
			),
		[carpoolSuggestions, requestedCarpoolSeats],
	);
	const guestAttendancesErrorMessage =
		typeof errors.guestAttendances?.message === "string"
			? errors.guestAttendances.message
			: undefined;

	useEffect(() => {
		if (!hasPlusOne) {
			setValue("plusOneAttendance", undefined);
			setValue("plusOneName", undefined);
		}
	}, [hasPlusOne, setValue]);

	useEffect(() => {
		const nextValue = buildLocalDateTime(arrivalDate, arrivalTime);
		setValue("arrivalDateTime", nextValue, { shouldValidate: true });
	}, [arrivalDate, arrivalTime, setValue]);

	useEffect(() => {
		const nextValue = buildLocalDateTime(departureDate, departureTime);
		setValue("departureDateTime", nextValue, { shouldValidate: true });
	}, [departureDate, departureTime, setValue]);

	useEffect(() => {
		setValue("extraNightsFromDate", formatDateOnlyValue(extraNightsFromDate), {
			shouldValidate: true,
		});
	}, [extraNightsFromDate, setValue]);

	useEffect(() => {
		setValue("extraNightsToDate", formatDateOnlyValue(extraNightsToDate), {
			shouldValidate: true,
		});
	}, [extraNightsToDate, setValue]);

	useEffect(() => {
		if (!hasAnyAttending) {
			setValue("carpoolDriverOptIn", "no", { shouldValidate: true });
			setValue("arrivalDateTime", "", { shouldValidate: true });
			setValue("departureDateTime", "", { shouldValidate: true });
			setValue("needsExtraNightsHelp", false, { shouldValidate: true });
			setValue("extraNightsFromDate", "", { shouldValidate: true });
			setValue("extraNightsToDate", "", { shouldValidate: true });
			setArrivalDate(undefined);
			setArrivalTime("");
			setDepartureDate(undefined);
			setDepartureTime("");
			setExtraNightsFromDate(undefined);
			setExtraNightsToDate(undefined);
			setValue("plusOneAttendance", undefined, { shouldValidate: true });
			setValue("plusOneName", undefined, { shouldValidate: true });
			setValue("childrenCount", 0, { shouldValidate: true });
			setValue("childrenSleepOption", undefined, { shouldValidate: true });
			setValue("accommodationType", undefined, { shouldValidate: true });
			setValue("selectedCarpoolOfferId", undefined, { shouldValidate: true });
		}
	}, [hasAnyAttending, setValue]);

	useEffect(() => {
		if (!hasAnyAttending || transport !== "own") {
			setValue("carpoolDriverOptIn", "no", { shouldValidate: true });
		}
	}, [hasAnyAttending, transport, setValue]);

	useEffect(() => {
		if (!hasAnyAttending || transport !== "bus") {
			setValue("selectedCarpoolOfferId", undefined, { shouldValidate: true });
		}
	}, [hasAnyAttending, setValue, transport]);

	useEffect(() => {
		if (!selectedCarpoolOfferId) return;
		const selectedOfferExists = carpoolSuggestions.some(
			(offer) => offer._id === selectedCarpoolOfferId,
		);
		if (!selectedOfferExists) {
			setValue("selectedCarpoolOfferId", undefined, { shouldValidate: true });
		}
	}, [carpoolSuggestions, selectedCarpoolOfferId, setValue]);

	useEffect(() => {
		if (transport !== "bus" || !selectedCarpoolOfferId) return;
		const selectedOffer = carpoolSuggestions.find(
			(offer) => offer._id === selectedCarpoolOfferId,
		);
		if (
			!selectedOffer ||
			selectedOffer.seatsAvailable < requestedCarpoolSeats
		) {
			setValue("selectedCarpoolOfferId", undefined, { shouldValidate: true });
		}
	}, [
		carpoolSuggestions,
		requestedCarpoolSeats,
		selectedCarpoolOfferId,
		setValue,
		transport,
	]);

	useEffect(() => {
		if (normalizedChildrenCount === 0 && childrenSleepOption !== undefined) {
			setValue("childrenSleepOption", undefined, { shouldValidate: true });
		}
	}, [childrenSleepOption, normalizedChildrenCount, setValue]);

	useEffect(() => {
		if (accommodationType === "hostProvided") return;
		setValue("needsExtraNightsHelp", false, { shouldValidate: true });
		setValue("extraNightsFromDate", "", { shouldValidate: true });
		setValue("extraNightsToDate", "", { shouldValidate: true });
		setExtraNightsFromDate(undefined);
		setExtraNightsToDate(undefined);
		clearErrors(["extraNightsFromDate", "extraNightsToDate"]);
	}, [accommodationType, setValue, clearErrors]);

	useEffect(() => {
		if (!needsExtraNightsHelp) {
			setExtraNightsFromDate(undefined);
			setExtraNightsToDate(undefined);
			setValue("extraNightsFromDate", "", { shouldValidate: true });
			setValue("extraNightsToDate", "", { shouldValidate: true });
			clearErrors(["extraNightsFromDate", "extraNightsToDate"]);
			return;
		}
		if (!extraNightsFromDate && arrivalDate) {
			setExtraNightsFromDate(arrivalDate);
		}
		if (!extraNightsToDate && arrivalDate) {
			setExtraNightsToDate(arrivalDate);
		}
	}, [
		needsExtraNightsHelp,
		arrivalDate,
		extraNightsFromDate,
		extraNightsToDate,
		setValue,
		clearErrors,
	]);

	const setGuestAttendance = (guestId: string, attendance: "yes" | "no") => {
		if (!guestSet.has(guestId)) return;
		setValue(
			"guestAttendances",
			{
				...guestAttendances,
				[guestId]: attendance,
			},
			{ shouldDirty: true, shouldTouch: true, shouldValidate: true },
		);
		clearErrors("guestAttendances");
	};

	const setAllGuestAttendances = (attendance: "yes" | "no") => {
		const nextGuestAttendances: Record<string, "yes" | "no"> = {};
		for (const guest of availableGuests) {
			nextGuestAttendances[guest.id] = attendance;
		}
		setValue("guestAttendances", nextGuestAttendances, {
			shouldDirty: true,
			shouldTouch: true,
			shouldValidate: true,
		});
		clearErrors("guestAttendances");
	};

	const handleFormSubmit = (data: RSVPFormData) => {
		if (availableGuests.length === 0) {
			setError("guestAttendances", {
				type: "manual",
				message: isEnglish
					? "No guests found in this invitation."
					: "Brak osób na zaproszeniu.",
			});
			return;
		}

		if (!hasAllGuestDecisions) {
			setError("guestAttendances", {
				type: "manual",
				message: isEnglish
					? `Complete attendance for all guests (${guestsWithDecisionsCount}/${availableGuests.length}).`
					: `Uzupełnij obecność dla wszystkich osób (${guestsWithDecisionsCount}/${availableGuests.length}).`,
			});
			return;
		}

		const normalizedGuestAttendances: Record<string, "yes" | "no"> = {};
		for (const guest of availableGuests) {
			const attendance = data.guestAttendances?.[guest.id];
			if (attendance !== "yes" && attendance !== "no") {
				setError("guestAttendances", {
					type: "manual",
					message: isEnglish
						? "Choose an answer for each guest."
						: "Wybierz odpowiedź dla każdej osoby.",
				});
				return;
			}
			normalizedGuestAttendances[guest.id] = attendance;
		}

		clearErrors("guestAttendances");
		const payload: RSVPFormData = {
			...data,
			guestAttendances: normalizedGuestAttendances,
			childrenCount: hasAnyAttending
				? normalizeChildrenCount(data.childrenCount)
				: 0,
			childrenSleepOption:
				hasAnyAttending && normalizeChildrenCount(data.childrenCount) > 0
					? data.childrenSleepOption
					: undefined,
			accommodationType: hasAnyAttending ? data.accommodationType : undefined,
			needsExtraNightsHelp: canUseExtraNightsHelp
				? data.needsExtraNightsHelp
				: false,
			extraNightsFromDate:
				canUseExtraNightsHelp && data.needsExtraNightsHelp
					? data.extraNightsFromDate
					: undefined,
			extraNightsToDate:
				canUseExtraNightsHelp && data.needsExtraNightsHelp
					? data.extraNightsToDate
					: undefined,
			departureDateTime: hasAnyAttending ? data.departureDateTime : "",
			selectedCarpoolOfferId:
				hasAnyAttending && data.transport === "bus"
					? data.selectedCarpoolOfferId
					: undefined,
		};

		if (onSubmit) {
			onSubmit(payload);
		} else {
			console.log("RSVP Data:", payload);
			toast({
				variant: "success",
				title: isEnglish ? "RSVP saved" : "RSVP zapisane",
				description: isEnglish
					? "Thank you for confirming your attendance."
					: "Dziękujemy za potwierdzenie obecności.",
			});
		}
	};

	register("guestAttendances");
	register("selectedCarpoolOfferId");

	return (
		<div className="flex flex-col gap-6 rounded-2xl bg-white shadow-xl border border-gray-100 overflow-hidden">
			<div className="bg-white pt-8 px-6 md:px-12 text-center">
				<h3 className="text-3xl font-bold text-gray-900 mb-3">
					{isEnglish ? "Form" : "Formularz"}
				</h3>
				<p className="text-gray-500 max-w-lg mx-auto leading-relaxed">
					{isEnglish
						? "Let us know your attendance details."
						: "Daj nam znać o swojej obecności."}
				</p>
				<div className="w-24 h-1 bg-[var(--color-primary)]/20 mx-auto mt-6 rounded-full" />
			</div>

			<form
				onSubmit={handleSubmit(handleFormSubmit)}
				className="flex flex-col gap-8 px-6 md:px-12 pb-12 pt-4"
			>
				<div className="flex flex-col gap-3">
					<h4 className="text-gray-900 text-sm font-semibold uppercase tracking-wide">
						{isEnglish ? "Attendance" : "Obecność"}
					</h4>
					<p className="text-sm text-gray-600">
						{isEnglish ? "Guest decisions" : "Decyzja dla gości"}:{" "}
						{guestsWithDecisionsCount}/{availableGuests.length}
					</p>
					<input
						id={guestAttendancesId}
						type="hidden"
						value="registered"
						readOnly
					/>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<Button
							type="button"
							variant="outline"
							disabled={disabled || availableGuests.length === 0}
							onClick={() => setAllGuestAttendances("yes")}
							className={`relative h-auto flex-row items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all ${allGuestsAttending ? "border-green-500 bg-green-50 text-green-700 hover:bg-green-50 hover:text-green-700" : "border-gray-100 bg-white text-gray-700 hover:bg-white hover:border-green-400/60"}`}
						>
							<span
								className={`text-xl ${allGuestsAttending ? "text-green-600" : "text-gray-400"}`}
							>
								✓
							</span>
							<span className="font-medium">
								{isEnglish ? "Everyone is attending" : "Wszyscy jadą"}
							</span>
						</Button>
						<Button
							type="button"
							variant="outline"
							disabled={disabled || availableGuests.length === 0}
							onClick={() => setAllGuestAttendances("no")}
							className={`relative h-auto flex-row items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all ${noGuestAttending ? "border-red-500 bg-red-50 text-red-700 hover:bg-red-50 hover:text-red-700" : "border-gray-100 bg-white text-gray-700 hover:bg-white hover:border-red-400/60"}`}
						>
							<span
								className={`text-xl ${noGuestAttending ? "text-red-500" : "text-gray-400"}`}
							>
								✗
							</span>
							<span className="font-medium">
								{isEnglish ? "No one is attending" : "Nikt nie jedzie"}
							</span>
						</Button>
					</div>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
						{availableGuests.map((guest) => {
							const attendance = guestAttendances[guest.id];
							const isYes = attendance === "yes";
							const isNo = attendance === "no";
							return (
								<Popover
									key={guest.id}
									open={openGuestPopoverId === guest.id}
									onOpenChange={(open) =>
										setOpenGuestPopoverId(open ? guest.id : null)
									}
								>
									<PopoverTrigger asChild>
										<Button
											type="button"
											variant="outline"
											disabled={disabled}
											className={`flex h-auto w-full items-start justify-between gap-3 p-3 rounded-xl border-2 transition-all hover:bg-gray-50/50 ${isYes ? "border-green-500 bg-green-50 hover:bg-green-50 text-foreground" : isNo ? "border-red-500 bg-red-50 hover:bg-red-50 text-foreground" : "border-gray-200 bg-gray-50 hover:border-[var(--color-primary)]/60 text-foreground"}`}
										>
											<div className="flex flex-col items-start whitespace-normal text-left">
												<span className="font-medium text-gray-900">
													{guest.fullName}
												</span>
												<span className="text-xs text-gray-500 mt-1 font-normal">
													{isYes
														? isEnglish
															? "Will attend"
															: "Będzie"
														: isNo
															? isEnglish
																? "Will not attend"
																: "Nie będzie"
															: isEnglish
																? "Select an answer"
																: "Wybierz odpowiedź"}
												</span>
											</div>
											{/* <span
												className={`text-xs font-semibold px-2 py-1 rounded-full ${isYes ? "bg-green-100 text-green-700" : isNo ? "bg-red-100 text-red-700" : "bg-gray-200 text-gray-600"}`}
											>
												{isYes ? "TAK" : isNo ? "NIE" : "BRAK"}
											</span> */}
										</Button>
									</PopoverTrigger>
									<PopoverContent className="w-56 p-3" align="start">
										{/* <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">
											{guest.fullName}
										</p> */}
										<div className="flex flex-col gap-2">
											<Button
												type="button"
												variant="ghost"
												onClick={() => {
													setGuestAttendance(guest.id, "yes");
													setOpenGuestPopoverId(null);
												}}
												className="w-full justify-start rounded-lg border border-green-500 bg-green-50 px-3 py-2 text-sm font-medium text-green-700 hover:bg-green-100 hover:text-green-800 transition"
											>
												{isEnglish ? "Yes, will attend" : "Tak, będzie"}
											</Button>
											<Button
												type="button"
												variant="ghost"
												onClick={() => {
													setGuestAttendance(guest.id, "no");
													setOpenGuestPopoverId(null);
												}}
												className="w-full justify-start rounded-lg border border-red-500 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100 hover:text-red-800 transition"
											>
												{isEnglish ? "No, will not attend" : "Nie, nie będzie"}
											</Button>
										</div>
									</PopoverContent>
								</Popover>
							);
						})}
					</div>
					{guestAttendancesErrorMessage && (
						<span className="text-red-500 text-sm">
							{guestAttendancesErrorMessage}
						</span>
					)}
				</div>

				{hasAnyAttending && (
					<>
						{hasPlusOne && (
							<div className="flex flex-col gap-3">
								<h4 className="text-gray-900 text-sm font-semibold uppercase tracking-wide">
									{isEnglish ? "Plus one" : "Osoba towarzysząca"}
								</h4>
								<Controller
									control={control}
									name="plusOneAttendance"
									render={({ field }) => (
										<RadioGroup
											onValueChange={field.onChange}
											defaultValue={field.value}
											className="grid grid-cols-1 sm:grid-cols-2 gap-4"
										>
											<label
												className={`relative flex items-center justify-center gap-3 p-4 rounded-xl border-2 cursor-pointer bg-white transition-all ${
													field.value === "yes"
														? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
														: "border-gray-100 hover:border-[var(--color-primary)]/50"
												}`}
											>
												<RadioGroupItem
													value="yes"
													id="plusOneAttendance-yes"
													className="sr-only"
												/>
												<span
													className={`text-xl ${
														field.value === "yes"
															? "text-[var(--color-primary)]"
															: "text-gray-400"
													}`}
												>
													✓
												</span>
												<span
													className={`font-medium ${
														field.value === "yes"
															? "text-[var(--color-primary)]"
															: "text-gray-700"
													}`}
												>
													{isEnglish ? "Yes, will attend" : "Tak, będzie"}
												</span>
											</label>
											<label
												className={`relative flex items-center justify-center gap-3 p-4 rounded-xl border-2 cursor-pointer bg-white transition-all ${
													field.value === "no"
														? "border-red-500 bg-red-50"
														: "border-gray-100 hover:border-red-400/50"
												}`}
											>
												<RadioGroupItem
													value="no"
													id="plusOneAttendance-no"
													className="sr-only"
												/>
												<span
													className={`text-xl ${
														field.value === "no"
															? "text-red-500"
															: "text-gray-400"
													}`}
												>
													✗
												</span>
												<span
													className={`font-medium ${
														field.value === "no"
															? "text-red-600"
															: "text-gray-700"
													}`}
												>
													{isEnglish ? "No, cannot attend" : "Nie, nie może"}
												</span>
											</label>
										</RadioGroup>
									)}
								/>
								{plusOneAttendance === "yes" && (
									<div className="flex flex-col gap-2">
										<label
											className="text-gray-900 text-sm font-semibold uppercase tracking-wide"
											htmlFor={plusOneNameId}
										>
											{isEnglish
												? "Plus one full name"
												: "Imię i nazwisko osoby towarzyszącej"}
										</label>
										<Input
											{...register("plusOneName", {
												validate: (value) => {
													if (!hasAnyAttending || plusOneAttendance !== "yes") {
														return true;
													}
													return value?.trim()
														? true
														: isEnglish
															? "Enter plus one full name"
															: "Podaj imię i nazwisko +1";
												},
											})}
											id={plusOneNameId}
											className="h-auto w-full rounded-xl border border-gray-200 bg-gray-50 py-3.5 px-4 text-gray-900 placeholder:text-gray-400 focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all outline-none"
											placeholder={isEnglish ? "Full name" : "Imię i nazwisko"}
											type="text"
										/>
										{errors.plusOneName && (
											<span className="text-red-500 text-sm">
												{errors.plusOneName.message}
											</span>
										)}
									</div>
								)}
							</div>
						)}

						<div className="flex flex-col gap-3">
							<h4 className="text-gray-900 text-sm font-semibold uppercase tracking-wide">
								{isEnglish ? "Children" : "Dzieci"}
							</h4>
							<div className="flex flex-col gap-2">
								<label
									className="text-gray-900 text-xs font-semibold uppercase tracking-wide"
									htmlFor={childrenCountId}
								>
									{isEnglish
										? "How many children are attending with you?"
										: "Ile dzieci będzie z Wami?"}
								</label>
								<Input
									{...register("childrenCount", {
										setValueAs: (value) => parseChildrenCount(value),
										validate: (value) => {
											if (!hasAnyAttending) return true;
											const parsed = parseChildrenCount(value);
											if (
												!Number.isInteger(parsed) ||
												parsed < 0 ||
												parsed > 3
											) {
												return isEnglish
													? "Enter a number of children from 0 to 3"
													: "Podaj liczbę dzieci od 0 do 3";
											}
											return true;
										},
									})}
									id={childrenCountId}
									type="number"
									min={0}
									max={3}
									step={1}
									disabled={disabled}
									className="h-12 rounded-xl border-gray-200 bg-gray-50 px-4"
								/>
								{errors.childrenCount && (
									<span className="text-red-500 text-sm">
										{errors.childrenCount.message}
									</span>
								)}
							</div>
							{normalizedChildrenCount > 0 && (
								<div className="flex flex-col gap-3">
									<p className="text-gray-900 text-xs font-semibold uppercase tracking-wide">
										{isEnglish
											? "Sleeping arrangement for children"
											: "Miejsce do spania dla dzieci"}
									</p>
									<Controller
										control={control}
										name="childrenSleepOption"
										render={({ field }) => (
											<RadioGroup
												onValueChange={field.onChange}
												defaultValue={field.value}
												className="grid grid-cols-1 sm:grid-cols-2 gap-4"
											>
												<label
													className={`relative flex items-center justify-center gap-3 p-4 rounded-xl border-2 cursor-pointer bg-white transition-all ${
														field.value === "extraBed"
															? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
															: "border-gray-100 hover:border-[var(--color-primary)]/50"
													}`}
												>
													<RadioGroupItem
														value="extraBed"
														id="childrenSleepOption-extraBed"
														className="sr-only"
													/>
													<span
														className={`font-medium ${
															field.value === "extraBed"
																? "text-[var(--color-primary)]"
																: "text-gray-700"
														}`}
													>
														{isEnglish ? "Extra bed" : "Dostawka"}
													</span>
												</label>
												<label
													className={`relative flex items-center justify-center gap-3 p-4 rounded-xl border-2 cursor-pointer bg-white transition-all ${
														field.value === "crib"
															? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
															: "border-gray-100 hover:border-[var(--color-primary)]/50"
													}`}
												>
													<RadioGroupItem
														value="crib"
														id="childrenSleepOption-crib"
														className="sr-only"
													/>
													<span
														className={`font-medium ${
															field.value === "crib"
																? "text-[var(--color-primary)]"
																: "text-gray-700"
														}`}
													>
														{isEnglish ? "Crib" : "Łóżeczko"}
													</span>
												</label>
											</RadioGroup>
										)}
									/>
									{errors.childrenSleepOption && (
										<span className="text-red-500 text-sm">
											{errors.childrenSleepOption.message}
										</span>
									)}
								</div>
							)}
						</div>

						<div className="flex flex-col gap-3">
							<h4 className="text-gray-900 text-sm font-semibold uppercase tracking-wide">
								{isEnglish ? "Arrival and departure" : "Przylot i wylot"}
							</h4>
							<input
								{...register("arrivalDateTime", {
									validate: (value) => {
										if (!hasAnyAttending) return true;
										return value
											? true
											: isEnglish
												? "Enter arrival date and time"
												: "Podaj datę i godzinę przylotu";
									},
								})}
								type="hidden"
							/>
							<input
								{...register("departureDateTime", {
									validate: (value) => {
										if (!hasAnyAttending) return true;
										return value
											? true
											: isEnglish
												? "Enter departure date and time"
												: "Podaj datę i godzinę wylotu";
									},
								})}
								type="hidden"
							/>
							<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
								<div className="flex flex-col gap-2">
									<label
										className="text-gray-900 text-xs font-semibold uppercase tracking-wide"
										htmlFor={arrivalDateId}
									>
										{isEnglish ? "Arrival" : "Przylot"}
									</label>
									<DatePicker
										id={arrivalDateId}
										value={arrivalDate}
										onChange={setArrivalDate}
										withTime
										timeValue={arrivalTime}
										onTimeChange={setArrivalTime}
										placeholder={
											isEnglish
												? "Select date and time"
												: "Wybierz datę i godzinę"
										}
										className="h-12 rounded-xl border-gray-200 bg-gray-50 px-4"
										disabled={disabled}
									/>
									{errors.arrivalDateTime && (
										<span className="text-red-500 text-sm">
											{errors.arrivalDateTime.message}
										</span>
									)}
								</div>
								<div className="flex flex-col gap-2">
									<label
										className="text-gray-900 text-xs font-semibold uppercase tracking-wide"
										htmlFor={departureDateId}
									>
										{isEnglish ? "Departure" : "Wylot"}
									</label>
									<DatePicker
										id={departureDateId}
										value={departureDate}
										onChange={setDepartureDate}
										withTime
										timeValue={departureTime}
										onTimeChange={setDepartureTime}
										placeholder={
											isEnglish
												? "Select date and time"
												: "Wybierz datę i godzinę"
										}
										className="h-12 rounded-xl border-gray-200 bg-gray-50 px-4"
										disabled={disabled}
									/>
									{errors.departureDateTime && (
										<span className="text-red-500 text-sm">
											{errors.departureDateTime.message}
										</span>
									)}
								</div>
							</div>
						</div>

						<div className="flex flex-col gap-3">
							<h4 className="text-gray-900 text-sm font-semibold uppercase tracking-wide">
								{isEnglish ? "Accommodation" : "Nocleg"}
							</h4>
							<p className="text-sm text-gray-600">
								{isEnglish
									? "Do you need us to arrange accommodation, or are you arranging it yourselves? We provide accommodation from 30.09 to 04.10."
									: "Czy organizujemy nocleg, czy planujecie go we własnym zakresie? Od nas macie nocleg 30.09-04.10."}
							</p>
							<Controller
								control={control}
								name="accommodationType"
								render={({ field }) => (
									<RadioGroup
										onValueChange={field.onChange}
										defaultValue={field.value}
										className="grid grid-cols-1 sm:grid-cols-2 gap-4"
									>
										<label
											className={`relative flex items-center justify-center gap-3 p-4 rounded-xl border-2 cursor-pointer bg-white transition-all ${
												field.value === "hostProvided"
													? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
													: "border-gray-100 hover:border-[var(--color-primary)]/50"
											}`}
										>
											<RadioGroupItem
												value="hostProvided"
												id="accommodationType-hostProvided"
												className="sr-only"
											/>
											<span
												className={`font-medium ${
													field.value === "hostProvided"
														? "text-[var(--color-primary)]"
														: "text-gray-700"
												}`}
											>
												{isEnglish ? "Provided by hosts" : "Nocleg od Was"}
											</span>
										</label>
										<label
											className={`relative flex items-center justify-center gap-3 p-4 rounded-xl border-2 cursor-pointer bg-white transition-all ${
												field.value === "selfArranged"
													? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
													: "border-gray-100 hover:border-[var(--color-primary)]/50"
											}`}
										>
											<RadioGroupItem
												value="selfArranged"
												id="accommodationType-selfArranged"
												className="sr-only"
											/>
											<span
												className={`font-medium ${
													field.value === "selfArranged"
														? "text-[var(--color-primary)]"
														: "text-gray-700"
												}`}
											>
												{isEnglish ? "Self-arranged" : "Na własną rękę"}
											</span>
										</label>
									</RadioGroup>
								)}
							/>
							{canUseExtraNightsHelp && (
								<label
									className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3"
									htmlFor={extraNightsHelpId}
								>
									<input
										{...register("needsExtraNightsHelp")}
										id={extraNightsHelpId}
										type="checkbox"
										disabled={disabled}
										className="mt-1 h-4 w-4 rounded border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
									/>
									<span className="flex flex-col gap-1">
										<span className="text-sm font-medium text-gray-900">
											{isEnglish
												? "We need help with accommodation for extra days"
												: "Potrzebujemy pomocy z noclegiem na dodatkowe dni"}
										</span>
										<span className="text-xs text-gray-500">
											{isEnglish
												? "For example, arrival before 30.09 or departure after 04.10. We can make the reservation, and you cover the accommodation cost."
												: "Np. przyjazd przed 30.09 lub wyjazd po 04.10 - zrobimy rezerwację, a Wy opłacicie noclegi."}
										</span>
									</span>
								</label>
							)}
							<input
								{...register("extraNightsFromDate", {
									validate: (value) => {
										if (!canUseExtraNightsHelp || !needsExtraNightsHelp)
											return true;
										if (!value) {
											return isEnglish
												? "Select a From date for extra accommodation"
												: "Wybierz datę Od dla dodatkowego noclegu";
										}
										const to = getValues("extraNightsToDate");
										if (to && value > to) {
											return isEnglish
												? "From date cannot be later than To date"
												: "Data Od nie może być późniejsza niż data Do";
										}
										return true;
									},
								})}
								type="hidden"
							/>
							<input
								{...register("extraNightsToDate", {
									validate: (value) => {
										if (!canUseExtraNightsHelp || !needsExtraNightsHelp)
											return true;
										if (!value) {
											return isEnglish
												? "Select a To date for extra accommodation"
												: "Wybierz datę Do dla dodatkowego noclegu";
										}
										const from = getValues("extraNightsFromDate");
										if (from && value < from) {
											return isEnglish
												? "To date cannot be earlier than From date"
												: "Data Do nie może być wcześniejsza niż data Od";
										}
										return true;
									},
								})}
								type="hidden"
							/>
							{canUseExtraNightsHelp && needsExtraNightsHelp && (
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-lg border border-gray-100 bg-white p-3">
									<div className="flex flex-col gap-2">
										<label
											className="text-gray-900 text-xs font-semibold uppercase tracking-wide"
											htmlFor={extraNightsFromDateId}
										>
											{isEnglish ? "From" : "Od"}
										</label>
										<DatePicker
											id={extraNightsFromDateId}
											value={extraNightsFromDate}
											onChange={setExtraNightsFromDate}
											placeholder={isEnglish ? "Select date" : "Wybierz datę"}
											className="h-12 rounded-xl border-gray-200 bg-gray-50 px-4"
											disabled={disabled}
										/>
										{errors.extraNightsFromDate && (
											<span className="text-red-500 text-sm">
												{errors.extraNightsFromDate.message}
											</span>
										)}
									</div>
									<div className="flex flex-col gap-2">
										<label
											className="text-gray-900 text-xs font-semibold uppercase tracking-wide"
											htmlFor={extraNightsToDateId}
										>
											{isEnglish ? "To" : "Do"}
										</label>
										<DatePicker
											id={extraNightsToDateId}
											value={extraNightsToDate}
											onChange={setExtraNightsToDate}
											placeholder={isEnglish ? "Select date" : "Wybierz datę"}
											className="h-12 rounded-xl border-gray-200 bg-gray-50 px-4"
											disabled={disabled}
										/>
										{errors.extraNightsToDate && (
											<span className="text-red-500 text-sm">
												{errors.extraNightsToDate.message}
											</span>
										)}
									</div>
								</div>
							)}
							{errors.accommodationType && (
								<span className="text-red-500 text-sm">
									{errors.accommodationType.message}
								</span>
							)}
						</div>

						<div className="h-px bg-gray-100 w-full my-2" />

						<div className="grid grid-cols-1 gap-8 w-full">
							<div className="flex flex-col gap-3 w-full">
								<h4 className="text-gray-900 text-sm font-semibold uppercase tracking-wide">
									{isEnglish ? "Transport" : "Transport"}
								</h4>
								<div className="flex flex-col md:flex-row gap-2 justify-between w-full">
									<Controller
										control={control}
										name="transport"
										render={({ field }) => (
											<RadioGroup
												onValueChange={field.onChange}
												defaultValue={field.value}
												className="flex flex-col md:flex-row gap-2 justify-between w-full"
											>
												<label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50 cursor-pointer w-full">
													<RadioGroupItem
														value="own"
														id="transport-own"
														className="mt-1 border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
													/>
													<div className="flex flex-col">
														<span className="font-medium text-gray-900">
															{isEnglish
																? "We are renting a car"
																: "Wypożyczamy auto"}
														</span>
														<span className="text-xs text-gray-500">
															{isEnglish
																? "We will meet on site"
																: "Spotkamy się na miejscu"}
														</span>
													</div>
												</label>
												<label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50 cursor-pointer w-full">
													<RadioGroupItem
														value="bus"
														id="transport-bus"
														className="mt-1 border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
													/>
													<div className="flex flex-col">
														<span className="font-medium text-gray-900">
															{isEnglish
																? "We need transport"
																: "Potrzebujemy transportu"}
														</span>
														<span className="text-xs text-gray-500">
															{isEnglish ? "From the airport" : "Z lotniska"}
														</span>
													</div>
												</label>
											</RadioGroup>
										)}
									/>
								</div>
							</div>

							{transport === "bus" && carpoolSuggestions.length > 0 && (
								<div className="flex flex-col gap-3 w-full rounded-xl border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/5 p-4">
									<h4 className="text-gray-900 text-sm font-semibold uppercase tracking-wide">
										{isEnglish
											? "Car Pool - available seats"
											: "Car Pool - dostępne miejsca"}
									</h4>
									<p className="text-sm text-gray-700">
										{isEnglish ? "Your group needs" : "Twoja grupa potrzebuje"}{" "}
										<span className="font-semibold">
											{formatSeatCount(requestedCarpoolSeats, locale)}
										</span>
										{isEnglish
											? ". Select one offer:"
											: ". Wybierz jedną ofertę:"}
									</p>
									<ul className="space-y-2">
										{carpoolSuggestions.map((offer) => {
											const isSelected = selectedCarpoolOfferId === offer._id;
											const hasInsufficientSeats =
												offer.seatsAvailable < requestedCarpoolSeats;
											const isDisabled =
												disabled ||
												Boolean(offer.myRequestId) ||
												hasInsufficientSeats;
											return (
												<li
													key={offer._id}
													className={`rounded-lg border px-3 py-2 transition ${
														isSelected
															? "border-[var(--color-primary)] bg-[var(--color-primary)]/10"
															: "border-gray-200 bg-white"
													}`}
												>
													<Button
														type="button"
														variant="ghost"
														disabled={isDisabled}
														onClick={() =>
															setValue(
																"selectedCarpoolOfferId",
																isSelected ? undefined : offer._id,
																{
																	shouldDirty: true,
																	shouldTouch: true,
																	shouldValidate: true,
																},
															)
														}
														className="h-auto w-full justify-start whitespace-normal p-0 hover:bg-transparent"
													>
														<p className="font-medium text-gray-900">
															{offer.driverDisplayName}:{" "}
															{formatRoute(
																offer.pickupPoint,
																offer.dropoffPoint,
																locale,
															)}
														</p>
														<p className="text-xs text-gray-500">
															{isEnglish
																? "Driver arrival"
																: "Przylot kierowcy"}
															:{" "}
															{formatDateTime(
																offer.driverArrivalDateTime,
																locale,
															)}{" "}
															|{" "}
															{isEnglish ? "Available seats" : "Wolne miejsca"}:{" "}
															{offer.seatsAvailable}
														</p>
														{hasInsufficientSeats && (
															<p className="text-xs text-amber-700 mt-1">
																{isEnglish
																	? `Not enough seats for your group (${formatSeatCount(requestedCarpoolSeats, locale)}).`
																	: `Za mało miejsc dla Twojej grupy (${formatSeatCount(requestedCarpoolSeats, locale)}).`}
															</p>
														)}
														{offer.myRequestId && (
															<p className="text-xs text-amber-600 mt-1">
																{isEnglish
																	? "You already have a request for this offer"
																	: "Masz już zgłoszenie do tej oferty"}
																{offer.myRequestStatus
																	? ` (${formatCarpoolRequestStatus(offer.myRequestStatus, locale)})`
																	: ""}
																.
															</p>
														)}
													</Button>
												</li>
											);
										})}
									</ul>
									{selectedCarpoolOfferId && (
										<p className="text-xs text-[var(--color-primary)] font-medium">
											{isEnglish
												? 'The request will be sent after clicking "Confirm attendance".'
												: 'Zgłoszenie zostanie wysłane po kliknięciu "Potwierdź obecność".'}
										</p>
									)}
									{!hasOfferMatchingRequestedSeats && (
										<p className="text-xs text-amber-700 font-medium">
											{isEnglish
												? "There are currently no offers with enough seats for your group. Choose your own transport or try again shortly."
												: "Obecnie brak ofert z wystarczającą liczbą miejsc dla Twojej grupy. Wybierz dojazd własny albo spróbuj ponownie za chwilę."}
										</p>
									)}
								</div>
							)}

							{transport === "own" && (
								<div className="flex flex-col gap-3 w-full">
									<h4 className="text-gray-900 text-sm font-semibold uppercase tracking-wide">
										Car Pool
									</h4>
									<div className="flex flex-col gap-3 w-full">
										<Controller
											control={control}
											name="carpoolDriverOptIn"
											render={({ field }) => (
												<RadioGroup
													onValueChange={field.onChange}
													defaultValue={field.value}
													className="grid grid-cols-1 sm:grid-cols-2 gap-4"
												>
													<label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50 cursor-pointer w-full">
														<RadioGroupItem
															value="yes"
															id="carpoolDriverOptIn-yes"
															className="mt-1 border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
														/>
														<div className="flex flex-col">
															<span className="font-medium text-gray-900">
																{isEnglish
																	? "I have available seats"
																	: "Mam wolne miejsca"}
															</span>
															<span className="text-xs text-gray-500">
																{isEnglish
																	? "I can take other guests in my car"
																	: "Mogę zabrać innych gości swoim autem"}
															</span>
														</div>
													</label>
													<label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50 cursor-pointer w-full">
														<RadioGroupItem
															value="no"
															id="carpoolDriverOptIn-no"
															className="mt-1 border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
														/>
														<div className="flex flex-col">
															<span className="font-medium text-gray-900">
																{isEnglish
																	? "I am not participating"
																	: "Nie biorę udziału"}
															</span>
															<span className="text-xs text-gray-500">
																{isEnglish
																	? "I do not have free seats"
																	: "Nie mam wolnych miejsc"}
															</span>
														</div>
													</label>
												</RadioGroup>
											)}
										/>
									</div>
									{errors.carpoolDriverOptIn && (
										<span className="text-red-500 text-sm">
											{errors.carpoolDriverOptIn.message}
										</span>
									)}
								</div>
							)}
						</div>
					</>
				)}

				<div className="flex flex-col gap-2">
					<label
						className="text-gray-900 text-sm font-semibold uppercase tracking-wide"
						htmlFor={messageId}
					>
						{isEnglish ? "Message to the couple" : "Wiadomość dla Pary Młodej"}
					</label>
					<Textarea
						{...register("message")}
						className="min-h-[100px] w-full resize-none rounded-xl border border-gray-200 bg-gray-50 p-4 text-gray-900 placeholder:text-gray-400 focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all outline-none"
						id={messageId}
						placeholder={
							isEnglish
								? "Do you have any questions or anything to share with us?"
								: "Masz pytania lub chcesz nam coś przekazać?"
						}
					/>
				</div>

				<div className="pt-4">
					<Button
						type="submit"
						disabled={disabled}
						className="group relative flex h-auto w-full items-center justify-center overflow-hidden rounded-xl bg-[var(--color-primary)] py-4 px-6 text-base font-bold text-white shadow-lg shadow-blue-500/30 transition-all hover:bg-blue-600 hover:shadow-blue-600/40 active:scale-[0.98]"
					>
						<span className="relative z-10 flex items-center gap-2">
							{isEnglish ? "Confirm attendance" : "Potwierdź obecność"}
							<span className="transition-transform group-hover:translate-x-1">
								→
							</span>
						</span>
					</Button>
					<p className="mt-4 text-center text-xs text-gray-400">
						{isEnglish
							? "By clicking the button, you consent to data processing for event organization."
							: "Klikając przycisk, wyrażasz zgodę na przetwarzanie danych w celach organizacji wydarzenia."}
					</p>
				</div>
			</form>
		</div>
	);
}

function formatDateTime(value: string | undefined, locale: "pl" | "en") {
	if (!value) return "-";
	const [datePart, timePart] = value.split("T");
	if (!datePart) return value;
	const [year, month, day] = datePart.split("-").map(Number);
	if (!year || !month || !day) return value;
	const formattedDate = new Intl.DateTimeFormat(
		locale === "en" ? "en-US" : "pl-PL",
		{
			day: "2-digit",
			month: "2-digit",
		},
	).format(new Date(year, month - 1, day));
	return timePart ? `${formattedDate} ${timePart}` : formattedDate;
}

function formatRoute(
	pickupPoint: string | undefined,
	dropoffPoint: string | undefined,
	locale: "pl" | "en",
) {
	const pickup = pickupPoint?.trim();
	const dropoff = dropoffPoint?.trim();
	if (pickup && dropoff) return `${pickup} -> ${dropoff}`;
	if (pickup) return `${locale === "en" ? "Start" : "Start"}: ${pickup}`;
	if (dropoff) return `${locale === "en" ? "Destination" : "Cel"}: ${dropoff}`;
	return locale === "en" ? "Route to be confirmed" : "Trasa do ustalenia";
}

function formatCarpoolRequestStatus(value: string, locale: "pl" | "en") {
	if (value === "pending") return locale === "en" ? "pending" : "oczekuje";
	if (value === "accepted") {
		return locale === "en" ? "accepted" : "zaakceptowane";
	}
	if (value === "rejected") return locale === "en" ? "rejected" : "odrzucone";
	if (value === "cancelled_by_passenger") {
		return locale === "en"
			? "cancelled by passenger"
			: "anulowane przez pasażera";
	}
	if (value === "cancelled_by_driver") {
		return locale === "en" ? "cancelled by driver" : "anulowane przez kierowcę";
	}
	if (value === "cancelled_system") {
		return locale === "en" ? "cancelled by system" : "anulowane systemowo";
	}
	return value;
}

function parseChildrenCount(value: unknown) {
	if (typeof value === "number") return value;
	if (typeof value === "string") {
		const trimmed = value.trim();
		if (trimmed.length === 0) return 0;
		return Number(trimmed);
	}
	return 0;
}

function normalizeChildrenCount(value: unknown) {
	const parsed = parseChildrenCount(value);
	if (!Number.isFinite(parsed) || Number.isNaN(parsed)) return 0;
	return Math.max(0, Math.min(3, Math.trunc(parsed)));
}

function formatDateOnlyValue(value?: Date) {
	if (!value) return "";
	const year = value.getFullYear();
	const month = String(value.getMonth() + 1).padStart(2, "0");
	const day = String(value.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}
