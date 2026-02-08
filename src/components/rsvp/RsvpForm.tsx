import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { buildLocalDateTime, parseLocalDateTime } from "@/lib/date-time";

export interface RSVPFormData {
	attendance: "yes" | "no";
	answeredForAll: "yes" | "no";
	answeredForName?: string;
	plusOneAttendance?: "yes" | "no";
	plusOneName?: string;
	transport: "own" | "bus";
	arrivalDateTime: string;
	message: string;
}

interface RsvpFormProps {
	onSubmit?: (data: RSVPFormData) => void;
	defaultValues?: Partial<RSVPFormData>;
	hasPlusOne?: boolean;
	disabled?: boolean;
	invitationGuests: string[];
	blockedGuests?: string[];
}

export function RsvpForm({
	onSubmit,
	defaultValues,
	hasPlusOne,
	disabled,
	invitationGuests,
	blockedGuests = [],
}: RsvpFormProps) {
	const {
		register,
		handleSubmit,
		setValue,
		watch,
		formState: { errors },
	} = useForm<RSVPFormData>({
		defaultValues: {
			attendance: "yes",
			answeredForAll: "yes",
			answeredForName: "",
			transport: "own",
			arrivalDateTime: "",
			message: "",
			...defaultValues,
		},
	});

	const attendance = watch("attendance");
	const answeredForAll = watch("answeredForAll");
	const answeredForName = watch("answeredForName");
	const plusOneAttendance = watch("plusOneAttendance");
	const availableGuests = useMemo(
		() =>
			Array.from(
				new Set(invitationGuests.map((guest) => guest.trim()).filter(Boolean)),
			),
		[invitationGuests],
	);
	const blockedGuestSet = useMemo(
		() =>
			new Set(blockedGuests.map((guest) => guest.trim()).filter(Boolean)),
		[blockedGuests],
	);
	const initialArrival = useMemo(
		() => parseLocalDateTime(defaultValues?.arrivalDateTime),
		[defaultValues?.arrivalDateTime],
	);
	const [arrivalDate, setArrivalDate] = useState<Date | undefined>(
		initialArrival.date,
	);
	const [arrivalTime, setArrivalTime] = useState<string>(initialArrival.time);

	useEffect(() => {
		if (!hasPlusOne) {
			setValue("plusOneAttendance", undefined);
			setValue("plusOneName", undefined);
		}
	}, [hasPlusOne, setValue]);

	useEffect(() => {
		if (answeredForAll === "yes") {
			setValue("answeredForName", "", { shouldValidate: true });
		}
	}, [answeredForAll, setValue]);

	useEffect(() => {
		const nextValue = buildLocalDateTime(arrivalDate, arrivalTime);
		setValue("arrivalDateTime", nextValue, { shouldValidate: true });
	}, [arrivalDate, arrivalTime, setValue]);

	const handleFormSubmit = (data: RSVPFormData) => {
		if (onSubmit) {
			onSubmit(data);
		} else {
			console.log("RSVP Data:", data);
			toast({
				variant: "success",
				title: "RSVP zapisane",
				description: "Dziękujemy za potwierdzenie obecności.",
			});
		}
	};

	return (
		<div className="flex flex-col gap-6 rounded-2xl bg-white shadow-xl border border-gray-100 overflow-hidden">
			{/* Form Header */}
			<div className="bg-white pt-8 px-6 md:px-12 text-center">
				<h3 className="text-3xl font-bold text-gray-900 mb-3">Formularz</h3>
				<p className="text-gray-500 max-w-lg mx-auto leading-relaxed">
					Daj nam znać, czy możemy się z Tobą zobaczyć w Grecji.
				</p>
				<div className="w-24 h-1 bg-[var(--color-primary)]/20 mx-auto mt-6 rounded-full" />
			</div>

			{/* Form Content */}
			<form
				onSubmit={handleSubmit(handleFormSubmit)}
				className="flex flex-col gap-8 px-6 md:px-12 pb-12 pt-4"
			>
				{/* Answered for all */}
				<div className="flex flex-col gap-3">
					<h4 className="text-gray-900 text-sm font-semibold uppercase tracking-wide">
						Czy odpowiadasz za wszystkich zaproszonych?
					</h4>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<label
							className={`relative flex items-center justify-center gap-3 p-4 rounded-xl border-2 cursor-pointer bg-white transition-all ${answeredForAll === "yes" ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5" : "border-gray-100 hover:border-[var(--color-primary)]/50"}`}
						>
							<input
								{...register("answeredForAll")}
								type="radio"
								value="yes"
								className="sr-only"
							/>
							<span
								className={`text-xl ${answeredForAll === "yes" ? "text-[var(--color-primary)]" : "text-gray-400"}`}
							>
								✓
							</span>
							<span
								className={`font-medium ${answeredForAll === "yes" ? "text-[var(--color-primary)]" : "text-gray-700"}`}
							>
								Tak, wszyscy
							</span>
						</label>
						<label
							className={`relative flex items-center justify-center gap-3 p-4 rounded-xl border-2 cursor-pointer bg-white transition-all ${answeredForAll === "no" ? "border-red-500 bg-red-50" : "border-gray-100 hover:border-red-400/50"}`}
						>
							<input
								{...register("answeredForAll")}
								type="radio"
								value="no"
								className="sr-only"
							/>
							<span
								className={`text-xl ${answeredForAll === "no" ? "text-red-500" : "text-gray-400"}`}
							>
								✗
							</span>
							<span
								className={`font-medium ${answeredForAll === "no" ? "text-red-600" : "text-gray-700"}`}
							>
								Nie, tylko ja
							</span>
						</label>
					</div>
						{answeredForAll === "no" && (
							<div className="flex flex-col gap-2">
								<label
									className="text-gray-900 text-sm font-semibold uppercase tracking-wide"
									htmlFor="answered-for-name"
								>
									Kogo dotyczy ta odpowiedź?
								</label>
								<input
									{...register("answeredForName", {
										validate: (value) => {
											if (answeredForAll !== "no") {
												return true;
											}
											const normalized = value?.trim() ?? "";
											if (!normalized) {
												return "Wybierz, kogo dotyczy odpowiedź";
											}
											if (!availableGuests.includes(normalized)) {
												return "Wybierz osobę z listy zaproszenia";
											}
											if (blockedGuestSet.has(normalized)) {
												return "Ta osoba już odpowiedziała";
											}
											return true;
										},
									})}
									id="answered-for-name"
									type="hidden"
								/>
								<div className="flex flex-col gap-2">
									{availableGuests.map((guest) => {
										const isBlocked = blockedGuestSet.has(guest);
										const isSelected = answeredForName === guest;
										return (
											<button
												key={guest}
												type="button"
												disabled={isBlocked}
												onClick={() =>
													setValue(
														"answeredForName",
														isSelected ? "" : guest,
														{
															shouldDirty: true,
															shouldTouch: true,
															shouldValidate: true,
														},
													)
												}
												className={`flex items-start gap-3 p-3 rounded-lg border transition-all text-left ${
													isBlocked
														? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
														: isSelected
															? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
															: "border-gray-200 bg-gray-50 hover:border-[var(--color-primary)]/60"
												}`}
											>
												<input
													type="checkbox"
													checked={isSelected}
													readOnly
													disabled={isBlocked}
													className="mt-1 border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
												/>
												<div className="flex flex-col">
													<span className="font-medium text-gray-900">{guest}</span>
													{isBlocked && (
														<span className="text-xs text-gray-500">
															Ta osoba już odpowiedziała
														</span>
													)}
												</div>
											</button>
										);
									})}
									{availableGuests.length === 0 && (
										<span className="text-sm text-amber-600">
											Brak osób na zaproszeniu.
										</span>
									)}
								</div>
								{errors.answeredForName && (
									<span className="text-red-500 text-sm">
										{errors.answeredForName.message}
									</span>
							)}
						</div>
					)}
				</div>

				{/* Attendance Radio */}
				<div className="flex flex-col gap-3">
					<h4 className="text-gray-900 text-sm font-semibold uppercase tracking-wide">
						Czy będziesz z nami?
					</h4>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<label
							className={`relative flex items-center justify-center gap-3 p-4 rounded-xl border-2 cursor-pointer bg-white transition-all ${attendance === "yes" ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5" : "border-gray-100 hover:border-[var(--color-primary)]/50"}`}
						>
							<input
								{...register("attendance")}
								type="radio"
								value="yes"
								className="sr-only"
							/>
							<span
								className={`text-xl ${attendance === "yes" ? "text-[var(--color-primary)]" : "text-gray-400"}`}
							>
								✓
							</span>
							<span
								className={`font-medium ${attendance === "yes" ? "text-[var(--color-primary)]" : "text-gray-700"}`}
							>
								Tak, z przyjemnością
							</span>
						</label>
						<label
							className={`relative flex items-center justify-center gap-3 p-4 rounded-xl border-2 cursor-pointer bg-white transition-all ${attendance === "no" ? "border-red-500 bg-red-50" : "border-gray-100 hover:border-red-400/50"}`}
						>
							<input
								{...register("attendance")}
								type="radio"
								value="no"
								className="sr-only"
							/>
							<span
								className={`text-xl ${attendance === "no" ? "text-red-500" : "text-gray-400"}`}
							>
								✗
							</span>
							<span
								className={`font-medium ${attendance === "no" ? "text-red-600" : "text-gray-700"}`}
							>
								Niestety nie
							</span>
						</label>
					</div>
				</div>

				{attendance === "yes" && (
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
											htmlFor="plusOneName"
										>
											Imię i nazwisko osoby towarzyszącej
										</label>
										<input
											{...register("plusOneName", {
												required: "Podaj imię i nazwisko +1",
											})}
											id="plusOneName"
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

						{/* Separator */}
						<div className="h-px bg-gray-100 w-full my-2" />

						<div className="flex flex-col gap-3">
							<h4 className="text-gray-900 text-sm font-semibold uppercase tracking-wide">
								Data i godzina przylotu
							</h4>
							<input
								{...register("arrivalDateTime", {
									required: "Podaj datę i godzinę przylotu",
								})}
								type="hidden"
							/>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div className="flex flex-col gap-2">
									<label
										className="text-gray-900 text-xs font-semibold uppercase tracking-wide"
										htmlFor="arrival-date"
									>
										Data
									</label>
									<DatePicker
										id="arrival-date"
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
										htmlFor="arrival-time"
									>
										Godzina
									</label>
									<Input
										type="time"
										id="arrival-time"
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

						{/* Preferences Section */}
						<div className="grid grid-cols-1 gap-8 w-full">
							{/* Transport */}
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
						</div>
					</>
				)}

				{/* Message */}
				<div className="flex flex-col gap-2">
					<label
						className="text-gray-900 text-sm font-semibold uppercase tracking-wide"
						htmlFor="message"
					>
						Wiadomość dla Pary Młodej
					</label>
					<textarea
						{...register("message")}
						className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 p-4 text-gray-900 placeholder-gray-400 focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all outline-none"
						id="message"
						placeholder="Masz pytania lub chcesz nam coś przekazać?"
						rows={3}
					/>
				</div>

				{/* Submit Button */}
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
