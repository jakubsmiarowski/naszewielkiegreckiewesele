import { useEffect, useId, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "@/components/ui/use-toast";
import { buildLocalDateTime, parseLocalDateTime } from "@/lib/date-time";

export interface RSVPFormData {
	guestAttendances: Record<string, "yes" | "no">;
	plusOneAttendance?: "yes" | "no";
	plusOneName?: string;
	transport: "own" | "bus";
	carpoolDriverOptIn?: "yes" | "no";
	arrivalDateTime: string;
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
}

interface RsvpFormProps {
	onSubmit?: (data: RSVPFormData) => void;
	defaultValues?: Partial<RSVPFormData>;
	hasPlusOne?: boolean;
	disabled?: boolean;
	invitationGuests: RsvpGuestOption[];
	carpoolSuggestions?: RsvpCarpoolSuggestion[];
	onGoToCarpool?: (options?: { openCreateModal?: boolean }) => void;
}

export function RsvpForm({
	onSubmit,
	defaultValues,
	hasPlusOne,
	disabled,
	invitationGuests,
	carpoolSuggestions = [],
	onGoToCarpool,
}: RsvpFormProps) {
	const formIdPrefix = useId();
	const guestAttendancesId = `${formIdPrefix}-guest-attendances`;
	const plusOneNameId = `${formIdPrefix}-plus-one-name`;
	const arrivalDateId = `${formIdPrefix}-arrival-date`;
	const arrivalTimeId = `${formIdPrefix}-arrival-time`;
	const messageId = `${formIdPrefix}-message`;

	const {
		register,
		handleSubmit,
		setValue,
		watch,
		setError,
		clearErrors,
		formState: { errors },
	} = useForm<RSVPFormData>({
		defaultValues: {
			guestAttendances: {},
			transport: "own",
			carpoolDriverOptIn: "no",
			arrivalDateTime: "",
			message: "",
			...defaultValues,
		},
	});

	const guestAttendances = watch("guestAttendances") ?? {};
	const plusOneAttendance = watch("plusOneAttendance");
	const transport = watch("transport");
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
	const [arrivalDate, setArrivalDate] = useState<Date | undefined>(
		initialArrival.date,
	);
	const [arrivalTime, setArrivalTime] = useState<string>(initialArrival.time);
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
	const allGuestsAttending =
		hasAllGuestDecisions &&
		availableGuests.every((guest) => guestAttendances[guest.id] === "yes");
	const noGuestAttending =
		hasAllGuestDecisions &&
		availableGuests.every((guest) => guestAttendances[guest.id] === "no");
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
		if (!hasAnyAttending) {
			setValue("carpoolDriverOptIn", "no", { shouldValidate: true });
			setValue("arrivalDateTime", "", { shouldValidate: true });
			setArrivalDate(undefined);
			setArrivalTime("");
			setValue("plusOneAttendance", undefined, { shouldValidate: true });
			setValue("plusOneName", undefined, { shouldValidate: true });
		}
	}, [hasAnyAttending, setValue]);

	useEffect(() => {
		if (!hasAnyAttending || transport !== "own") {
			setValue("carpoolDriverOptIn", "no", { shouldValidate: true });
		}
	}, [hasAnyAttending, transport, setValue]);

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
				message: "Brak osób na zaproszeniu.",
			});
			return;
		}

		if (!hasAllGuestDecisions) {
			setError("guestAttendances", {
				type: "manual",
				message: `Uzupełnij obecność dla wszystkich osób (${guestsWithDecisionsCount}/${availableGuests.length}).`,
			});
			return;
		}

		const normalizedGuestAttendances: Record<string, "yes" | "no"> = {};
		for (const guest of availableGuests) {
			const attendance = data.guestAttendances?.[guest.id];
			if (attendance !== "yes" && attendance !== "no") {
				setError("guestAttendances", {
					type: "manual",
					message: "Wybierz odpowiedź dla każdej osoby.",
				});
				return;
			}
			normalizedGuestAttendances[guest.id] = attendance;
		}

		clearErrors("guestAttendances");
		const payload: RSVPFormData = {
			...data,
			guestAttendances: normalizedGuestAttendances,
		};

		if (onSubmit) {
			onSubmit(payload);
		} else {
			console.log("RSVP Data:", payload);
			toast({
				variant: "success",
				title: "RSVP zapisane",
				description: "Dziękujemy za potwierdzenie obecności.",
			});
		}
	};

	register("guestAttendances");

	return (
		<div className="flex flex-col gap-6 rounded-2xl bg-white shadow-xl border border-gray-100 overflow-hidden">
			<div className="bg-white pt-8 px-6 md:px-12 text-center">
				<h3 className="text-3xl font-bold text-gray-900 mb-3">Formularz</h3>
				<p className="text-gray-500 max-w-lg mx-auto leading-relaxed">
					Daj nam znać, czy możemy się z Tobą zobaczyć w Grecji.
				</p>
				<div className="w-24 h-1 bg-[var(--color-primary)]/20 mx-auto mt-6 rounded-full" />
			</div>

			<form
				onSubmit={handleSubmit(handleFormSubmit)}
				className="flex flex-col gap-8 px-6 md:px-12 pb-12 pt-4"
			>
				<div className="flex flex-col gap-3">
					<h4 className="text-gray-900 text-sm font-semibold uppercase tracking-wide">
						Kto będzie z nami?
					</h4>
					<p className="text-sm text-gray-600">
						Decyzja dla gości: {guestsWithDecisionsCount}/
						{availableGuests.length}
					</p>
					<input
						id={guestAttendancesId}
						type="hidden"
						value="registered"
						readOnly
					/>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<button
							type="button"
							disabled={disabled || availableGuests.length === 0}
							onClick={() => setAllGuestAttendances("yes")}
							className={`relative flex items-center justify-center gap-3 p-4 rounded-xl border-2 bg-white transition-all ${allGuestsAttending ? "border-green-500 bg-green-50 text-green-700" : "border-gray-100 hover:border-green-400/60 text-gray-700"}`}
						>
							<span
								className={`text-xl ${allGuestsAttending ? "text-green-600" : "text-gray-400"}`}
							>
								✓
							</span>
							<span className="font-medium">Wszyscy jadą</span>
						</button>
						<button
							type="button"
							disabled={disabled || availableGuests.length === 0}
							onClick={() => setAllGuestAttendances("no")}
							className={`relative flex items-center justify-center gap-3 p-4 rounded-xl border-2 bg-white transition-all ${noGuestAttending ? "border-red-500 bg-red-50 text-red-700" : "border-gray-100 hover:border-red-400/60 text-gray-700"}`}
						>
							<span
								className={`text-xl ${noGuestAttending ? "text-red-500" : "text-gray-400"}`}
							>
								✗
							</span>
							<span className="font-medium">Nikt nie jedzie</span>
						</button>
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
										<button
											type="button"
											disabled={disabled}
											className={`flex items-start justify-between gap-3 p-3 rounded-xl border-2 transition-all text-left ${isYes ? "border-green-500 bg-green-50" : isNo ? "border-red-500 bg-red-50" : "border-gray-200 bg-gray-50 hover:border-[var(--color-primary)]/60"}`}
										>
											<div className="flex flex-col">
												<span className="font-medium text-gray-900">
													{guest.fullName}
												</span>
												<span className="text-xs text-gray-500 mt-1">
													{isYes
														? "Będzie"
														: isNo
															? "Nie będzie"
															: "Wybierz odpowiedź"}
												</span>
											</div>
											<span
												className={`text-xs font-semibold px-2 py-1 rounded-full ${isYes ? "bg-green-100 text-green-700" : isNo ? "bg-red-100 text-red-700" : "bg-gray-200 text-gray-600"}`}
											>
												{isYes ? "TAK" : isNo ? "NIE" : "BRAK"}
											</span>
										</button>
									</PopoverTrigger>
									<PopoverContent className="w-56 p-3" align="start">
										<p className="text-xs uppercase tracking-wider text-gray-500 mb-2">
											{guest.fullName}
										</p>
										<div className="flex flex-col gap-2">
											<button
												type="button"
												onClick={() => {
													setGuestAttendance(guest.id, "yes");
													setOpenGuestPopoverId(null);
												}}
												className="w-full rounded-lg border border-green-500 bg-green-50 px-3 py-2 text-left text-sm font-medium text-green-700 hover:bg-green-100 transition"
											>
												Tak, będzie
											</button>
											<button
												type="button"
												onClick={() => {
													setGuestAttendance(guest.id, "no");
													setOpenGuestPopoverId(null);
												}}
												className="w-full rounded-lg border border-red-500 bg-red-50 px-3 py-2 text-left text-sm font-medium text-red-700 hover:bg-red-100 transition"
											>
												Nie, nie będzie
											</button>
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
									Osoba towarzysząca
								</h4>
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
									<label
										className={`relative flex items-center justify-center gap-3 p-4 rounded-xl border-2 cursor-pointer bg-white transition-all ${plusOneAttendance === "yes" ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5" : "border-gray-100 hover:border-[var(--color-primary)]/50"}`}
									>
										<input
											{...register("plusOneAttendance")}
											type="radio"
											value="yes"
											className="sr-only"
										/>
										<span
											className={`text-xl ${plusOneAttendance === "yes" ? "text-[var(--color-primary)]" : "text-gray-400"}`}
										>
											✓
										</span>
										<span
											className={`font-medium ${plusOneAttendance === "yes" ? "text-[var(--color-primary)]" : "text-gray-700"}`}
										>
											Tak, będzie
										</span>
									</label>
									<label
										className={`relative flex items-center justify-center gap-3 p-4 rounded-xl border-2 cursor-pointer bg-white transition-all ${plusOneAttendance === "no" ? "border-red-500 bg-red-50" : "border-gray-100 hover:border-red-400/50"}`}
									>
										<input
											{...register("plusOneAttendance")}
											type="radio"
											value="no"
											className="sr-only"
										/>
										<span
											className={`text-xl ${plusOneAttendance === "no" ? "text-red-500" : "text-gray-400"}`}
										>
											✗
										</span>
										<span
											className={`font-medium ${plusOneAttendance === "no" ? "text-red-600" : "text-gray-700"}`}
										>
											Nie, nie może
										</span>
									</label>
								</div>
								{plusOneAttendance === "yes" && (
									<div className="flex flex-col gap-2">
										<label
											className="text-gray-900 text-sm font-semibold uppercase tracking-wide"
											htmlFor={plusOneNameId}
										>
											Imię i nazwisko osoby towarzyszącej
										</label>
										<input
											{...register("plusOneName", {
												validate: (value) => {
													if (!hasAnyAttending || plusOneAttendance !== "yes") {
														return true;
													}
													return value?.trim()
														? true
														: "Podaj imię i nazwisko +1";
												},
											})}
											id={plusOneNameId}
											className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3.5 px-4 text-gray-900 placeholder-gray-400 focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all outline-none"
											placeholder="Imię i nazwisko"
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

						<div className="h-px bg-gray-100 w-full my-2" />

						<div className="flex flex-col gap-3">
							<h4 className="text-gray-900 text-sm font-semibold uppercase tracking-wide">
								Data i godzina przylotu
							</h4>
							<input
								{...register("arrivalDateTime", {
									validate: (value) => {
										if (!hasAnyAttending) return true;
										return value ? true : "Podaj datę i godzinę przylotu";
									},
								})}
								type="hidden"
							/>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div className="flex flex-col gap-2">
									<label
										className="text-gray-900 text-xs font-semibold uppercase tracking-wide"
										htmlFor={arrivalDateId}
									>
										Data
									</label>
									<DatePicker
										id={arrivalDateId}
										value={arrivalDate}
										onChange={setArrivalDate}
										placeholder="Wybierz datę"
										className="h-12 rounded-xl border-gray-200 bg-gray-50 px-4"
										disabled={disabled}
									/>
								</div>
								<div className="flex flex-col gap-2">
									<label
										className="text-gray-900 text-xs font-semibold uppercase tracking-wide"
										htmlFor={arrivalTimeId}
									>
										Godzina
									</label>
									<Input
										type="time"
										id={arrivalTimeId}
										value={arrivalTime}
										onChange={(event) => setArrivalTime(event.target.value)}
										step={60}
										className="h-12 rounded-xl border-gray-200 bg-gray-50 px-4"
										disabled={disabled}
									/>
								</div>
							</div>
							{errors.arrivalDateTime && (
								<span className="text-red-500 text-sm">
									{errors.arrivalDateTime.message}
								</span>
							)}
						</div>

						<div className="grid grid-cols-1 gap-8 w-full">
							<div className="flex flex-col gap-3 w-full">
								<h4 className="text-gray-900 text-sm font-semibold uppercase tracking-wide">
									Transport
								</h4>
								<div className="flex flex-col md:flex-row gap-2 justify-between w-full">
									<label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50 cursor-pointer w-full">
										<input
											{...register("transport")}
											type="radio"
											value="own"
											className="mt-1 border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
										/>
										<div className="flex flex-col">
											<span className="font-medium text-gray-900">
												Wypożyczamy auto
											</span>
											<span className="text-xs text-gray-500">
												Spotkamy się na miejscu
											</span>
										</div>
									</label>
									<label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50 cursor-pointer w-full">
										<input
											{...register("transport")}
											type="radio"
											value="bus"
											className="mt-1 border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
										/>
										<div className="flex flex-col">
											<span className="font-medium text-gray-900">
												Przyjedź po nas
											</span>
											<span className="text-xs text-gray-500">
												Z głównego hotelu o 14:00
											</span>
										</div>
									</label>
								</div>
							</div>

							{transport === "bus" && carpoolSuggestions.length > 0 && (
								<div className="flex flex-col gap-3 w-full rounded-xl border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/5 p-4">
									<h4 className="text-gray-900 text-sm font-semibold uppercase tracking-wide">
										Car Pool - dostępne miejsca
									</h4>
									<p className="text-sm text-gray-700">
										Ktoś z gości ma wolne miejsce w aucie. Możesz wysłać
										zgłoszenie w zakładce Car Pool.
									</p>
									<ul className="space-y-2">
										{carpoolSuggestions.map((offer) => (
											<li
												key={offer._id}
												className="rounded-lg border border-gray-200 bg-white px-3 py-2"
											>
												<p className="font-medium text-gray-900">
													{offer.driverDisplayName}:{" "}
													{formatRoute(offer.pickupPoint, offer.dropoffPoint)}
												</p>
												<p className="text-xs text-gray-500">
													Odjazd: {formatDateTime(offer.departureDateTime)} |
													Wolne miejsca: {offer.seatsAvailable}
												</p>
												<p className="text-xs text-gray-500">
													Przylot kierowcy:{" "}
													{formatDateTime(offer.driverArrivalDateTime)}
												</p>
											</li>
										))}
									</ul>
									{onGoToCarpool && (
										<button
											type="button"
											onClick={() => onGoToCarpool()}
											className="self-start px-4 py-2 rounded-full text-sm font-semibold border border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 transition"
										>
											Przejdź do Car Pool
										</button>
									)}
								</div>
							)}

							{transport === "own" && (
								<div className="flex flex-col gap-3 w-full">
									<h4 className="text-gray-900 text-sm font-semibold uppercase tracking-wide">
										Car Pool
									</h4>
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
										<label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50 cursor-pointer w-full">
											<input
												{...register("carpoolDriverOptIn", {
													validate: (value) => {
														if (!hasAnyAttending || transport !== "own") {
															return true;
														}
														if (value !== "yes" && value !== "no") {
															return "Wybierz opcję car pool";
														}
														return true;
													},
												})}
												type="radio"
												value="yes"
												className="mt-1 border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
											/>
											<div className="flex flex-col">
												<span className="font-medium text-gray-900">
													Mam wolne miejsca
												</span>
												<span className="text-xs text-gray-500">
													Mogę zabrać innych gości swoim autem
												</span>
											</div>
										</label>
										<label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50 cursor-pointer w-full">
											<input
												{...register("carpoolDriverOptIn")}
												type="radio"
												value="no"
												className="mt-1 border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
											/>
											<div className="flex flex-col">
												<span className="font-medium text-gray-900">
													Nie biorę udziału
												</span>
												<span className="text-xs text-gray-500">
													Wybiorę dojazd bez udostępniania miejsc
												</span>
											</div>
										</label>
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
						Wiadomość dla Pary Młodej
					</label>
					<textarea
						{...register("message")}
						className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 p-4 text-gray-900 placeholder-gray-400 focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all outline-none"
						id={messageId}
						placeholder="Masz pytania lub chcesz nam coś przekazać?"
						rows={3}
					/>
				</div>

				<div className="pt-4">
					<button
						type="submit"
						disabled={disabled}
						className="group relative flex w-full items-center justify-center overflow-hidden rounded-xl bg-[var(--color-primary)] py-4 px-6 text-base font-bold text-white shadow-lg shadow-blue-500/30 transition-all hover:bg-blue-600 hover:shadow-blue-600/40 active:scale-[0.98]"
					>
						<span className="relative z-10 flex items-center gap-2">
							Potwierdź obecność
							<span className="transition-transform group-hover:translate-x-1">
								→
							</span>
						</span>
					</button>
					<p className="mt-4 text-center text-xs text-gray-400">
						Klikając przycisk, wyrażasz zgodę na przetwarzanie danych w celach
						organizacji wydarzenia.
					</p>
				</div>
			</form>
		</div>
	);
}

function formatDateTime(value?: string) {
	if (!value) return "-";
	const [datePart, timePart] = value.split("T");
	if (!datePart) return value;
	const [year, month, day] = datePart.split("-").map(Number);
	if (!year || !month || !day) return value;
	const formattedDate = new Intl.DateTimeFormat("pl-PL", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	}).format(new Date(year, month - 1, day));
	return timePart ? `${formattedDate} ${timePart}` : formattedDate;
}

function formatRoute(pickupPoint?: string, dropoffPoint?: string) {
	const pickup = pickupPoint?.trim();
	const dropoff = dropoffPoint?.trim();
	if (pickup && dropoff) return `${pickup} -> ${dropoff}`;
	if (pickup) return `Start: ${pickup}`;
	if (dropoff) return `Cel: ${dropoff}`;
	return "Trasa do ustalenia";
}
