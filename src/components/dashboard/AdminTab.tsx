import { useMutation, useQuery } from "convex/react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type {
	AdminInvitation,
	CarpoolMediationAlert,
	QaAdminQuestion,
	RsvpSettings,
} from "@/components/dashboard/types";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import {
	buildLocalDateTime,
	formatLocalDate,
	parseLocalDateTime,
} from "@/lib/date-time";
import { RELATION_OPTIONS } from "@/lib/greetings";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

interface AdminTabProps {
	invitations: AdminInvitation[];
	settings: RsvpSettings | null | undefined;
	adminAccessToken: string | null;
}

export function AdminTab({
	invitations,
	settings,
	adminAccessToken,
}: AdminTabProps) {
	const updateRelation = useMutation(api.guests.updateGuestRelation);
	const updateSettings = useMutation(api.settings.updateRsvpSettings);
	const seedInvitations = useMutation(api.invitations.seedInvitations);
	const resolveMediationAlert = useMutation(api.carpool.resolveMediationAlert);
	const answerQuestion = useMutation(api.questions.answerQuestion);
	const mediationAlerts = useQuery(
		api.carpool.listMediationAlertsForAdmin,
		adminAccessToken ? { adminAccessToken } : "skip",
	) as CarpoolMediationAlert[] | undefined;
	const qaQuestions = useQuery(
		api.questions.listForAdmin,
		adminAccessToken ? { adminAccessToken } : "skip",
	) as
		| QaAdminQuestion[]
		| undefined;

	const [deadline, setDeadline] = useState(
		settings?.rsvpDeadline ?? "2026-02-28T23:59",
	);
	const [graceDeadline, setGraceDeadline] = useState(
		settings?.rsvpGraceDeadline ?? "2026-03-31T23:59",
	);
	const [carpoolDeadline, setCarpoolDeadline] = useState(
		settings?.carpoolDeadline ?? "2026-10-04T23:59",
	);
	const [answerDrafts, setAnswerDrafts] = useState<Record<string, string>>({});

	const [savingQuestionId, setSavingQuestionId] = useState<string | null>(null);
	const [expandedAnsweredIds, setExpandedAnsweredIds] = useState<
		Record<string, boolean>
	>({});

	useEffect(() => {
		if (settings?.rsvpDeadline) {
			setDeadline(settings.rsvpDeadline);
		}
		if (settings?.rsvpGraceDeadline) {
			setGraceDeadline(settings.rsvpGraceDeadline);
		}
		if (settings?.carpoolDeadline) {
			setCarpoolDeadline(settings.carpoolDeadline);
		}
	}, [
		settings?.rsvpDeadline,
		settings?.rsvpGraceDeadline,
		settings?.carpoolDeadline,
	]);

	useEffect(() => {
		if (!qaQuestions) return;
		setAnswerDrafts((previous) => {
			const next = { ...previous };
			for (const item of qaQuestions) {
				next[item._id] = previous[item._id] ?? item.answer ?? "";
			}
			return next;
		});
	}, [qaQuestions]);

	const baseUrl =
		(import.meta.env as { PUBLIC_APP_URL?: string }).PUBLIC_APP_URL ??
		(typeof window === "undefined" ? "" : window.location.origin);

	const totals = useMemo(() => {
		return invitations.reduce(
			(acc, invitation) => {
				const stats = getInvitationAttendanceStats(invitation);
				acc.confirmed += stats.confirmed;
				acc.declined += stats.declined;
				acc.pending += stats.pending;
				if (stats.confirmed > 0 && invitation.transport === "bus") {
					acc.bus += 1;
				}
				return acc;
			},
			{ confirmed: 0, declined: 0, pending: 0, bus: 0 },
		);
	}, [invitations]);

	const arrivals = useMemo(() => {
		return invitations
			.filter((i) => i.arrivalDateTime)
			.slice()
			.sort((a, b) => {
				return (
					new Date(a.arrivalDateTime ?? "").getTime() -
					new Date(b.arrivalDateTime ?? "").getTime()
				);
			});
	}, [invitations]);

	const [expandedArrivalDates, setExpandedArrivalDates] = useState<
		Record<string, boolean>
	>({});

	const arrivalsByDate = useMemo(() => {
		const groups: Record<string, AdminInvitation[]> = {};
		for (const invitation of arrivals) {
			const dateKey = invitation.arrivalDateTime?.split("T")[0] ?? "unknown";
			if (!groups[dateKey]) {
				groups[dateKey] = [];
			}
			groups[dateKey].push(invitation);
		}
		return groups;
	}, [arrivals]);

	const sortedArrivalDates = useMemo(() => {
		return Object.keys(arrivalsByDate).sort();
	}, [arrivalsByDate]);

	const toggleArrivalDate = (date: string) => {
		setExpandedArrivalDates((prev) => ({
			...prev,
			[date]: !prev[date],
		}));
	};

	const pendingQaCount = useMemo(() => {
		if (!qaQuestions) return 0;
		return qaQuestions.filter((item) => item.status === "pending").length;
	}, [qaQuestions]);

	const handleCopy = async (token: string) => {
		try {
			const url = `${baseUrl}/auth/verify?token=${token}`;
			await navigator.clipboard.writeText(url);
			toast({
				variant: "success",
				title: "Link skopiowany",
				description: "Link do zaproszenia został skopiowany do schowka.",
			});
		} catch (_error) {
			toast({
				variant: "destructive",
				title: "Nie udało się skopiować linku",
				description: "Sprawdź uprawnienia schowka i spróbuj ponownie.",
			});
		}
	};

	const handleSaveSettings = async () => {
		if (!adminAccessToken) return;
		try {
			await updateSettings({
				adminAccessToken,
				rsvpDeadline: deadline,
				rsvpGraceDeadline: graceDeadline,
				carpoolDeadline,
			});
			toast({
				variant: "success",
				title: "Terminy zapisane",
				description: "Ustawienia RSVP zostały zaktualizowane.",
			});
		} catch (_error) {
			toast({
				variant: "destructive",
				title: "Nie udało się zapisać terminów",
				description: "Spróbuj ponownie za chwilę.",
			});
		}
	};

	const handleSeedInvitations = async () => {
		if (!adminAccessToken) return;
		try {
			await seedInvitations({ adminAccessToken });
			toast({
				variant: "success",
				title: "Zaproszenia załadowane",
				description: "Lista zaproszeń została dodana do bazy.",
			});
		} catch (_error) {
			toast({
				variant: "destructive",
				title: "Nie udało się załadować zaproszeń",
				description: "Spróbuj ponownie za chwilę.",
			});
		}
	};

	const handleRelationChange = async (
		guestId: string,
		relation: string | undefined,
	) => {
		if (!adminAccessToken) return;
		try {
			await updateRelation({
				adminAccessToken,
				guestId: guestId as Id<"guests">,
				relation,
			});
			toast({
				variant: "success",
				title: "Relacja zapisana",
			});
		} catch (_error) {
			toast({
				variant: "destructive",
				title: "Nie udało się zapisać relacji",
				description: "Spróbuj ponownie za chwilę.",
			});
		}
	};

	const handleResolveMediation = async (requestId: string) => {
		if (!adminAccessToken) return;
		try {
			await resolveMediationAlert({
				adminAccessToken,
				requestId: requestId as Id<"carpoolRequests">,
			});
			toast({
				variant: "success",
				title: "Alert zamknięty",
				description: "Oznaczono, że organizator połączył gości.",
			});
		} catch (_error) {
			toast({
				variant: "destructive",
				title: "Nie udało się zamknąć alertu",
				description: "Spróbuj ponownie za chwilę.",
			});
		}
	};

	const handleSaveAnswer = async (questionId: string) => {
		if (!adminAccessToken) return;
		const answer = (answerDrafts[questionId] ?? "").trim();
		if (!answer) {
			toast({
				variant: "destructive",
				title: "Brak odpowiedzi",
				description: "Wpisz treść odpowiedzi przed zapisaniem.",
			});
			return;
		}

		try {
			setSavingQuestionId(questionId);
			await answerQuestion({
				adminAccessToken,
				questionId: questionId as Id<"qaQuestions">,
				answer,
			});
			toast({
				variant: "success",
				title: "Odpowiedź zapisana",
			});
		} catch (_error) {
			toast({
				variant: "destructive",
				title: "Nie udało się zapisać odpowiedzi",
				description: "Spróbuj ponownie za chwilę.",
			});
		} finally {
			setSavingQuestionId(null);
		}
	};

	const toggleAnsweredCard = (questionId: string) => {
		setExpandedAnsweredIds((previous) => ({
			...previous,
			[questionId]: !previous[questionId],
		}));
	};

	return (
		<div className="flex flex-col gap-6">
			{invitations.length === 0 && (
				<div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
					<p className="text-muted-foreground">
						Brak zaproszeń w bazie. Możesz je teraz załadować z listy.
					</p>
					<button
						type="button"
						onClick={handleSeedInvitations}
						className="mt-4 px-4 py-2 rounded-full bg-[var(--color-primary)] text-white font-semibold"
					>
						Załaduj zaproszenia
					</button>
				</div>
			)}
			<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
				<div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
					<div className="text-3xl font-bold text-[var(--color-primary)]">
						{totals.confirmed}
					</div>
					<div className="text-sm text-gray-500 mt-1">Potwierdzeni</div>
				</div>
				<div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
					<div className="text-3xl font-bold text-red-500">
						{totals.declined}
					</div>
					<div className="text-sm text-gray-500 mt-1">Odmowy</div>
				</div>
				<div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
					<div className="text-3xl font-bold text-gray-700">
						{totals.pending}
					</div>
					<div className="text-sm text-gray-500 mt-1">Brak odpowiedzi</div>
				</div>
				<div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
					<div className="text-3xl font-bold text-blue-600">{totals.bus}</div>
					<div className="text-sm text-gray-500 mt-1">Transport (bus)</div>
				</div>
			</div>

			<div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
				<h3 className="text-xl font-bold text-foreground mb-4">Terminy RSVP</h3>
				<div className="flex flex-col gap-4">
					<DateTimeField
						label="Deadline"
						value={deadline}
						onChange={setDeadline}
					/>
					<DateTimeField
						label="Grace"
						value={graceDeadline}
						onChange={setGraceDeadline}
					/>
					<DateTimeField
						label="Car Pool"
						value={carpoolDeadline}
						onChange={setCarpoolDeadline}
					/>
				</div>
				<button
					type="button"
					onClick={handleSaveSettings}
					className="mt-4 px-4 py-2 rounded-full bg-[var(--color-primary)] text-white font-semibold"
				>
					Zapisz terminy
				</button>
			</div>

			<div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
				<h3 className="text-xl font-bold text-foreground mb-4">
					Alerty Car Pool
				</h3>
				{!mediationAlerts ? (
					<p className="text-muted-foreground">Ładowanie alertów...</p>
				) : mediationAlerts.length === 0 ? (
					<p className="text-muted-foreground">
						Brak aktywnych próśb o pośrednictwo.
					</p>
				) : (
					<ul className="space-y-3">
						{mediationAlerts.map((alert) => (
							<li
								key={alert.requestId}
								className="rounded-xl bg-[var(--color-background-light)] p-4"
							>
								<p className="font-semibold text-foreground">
									{alert.passengerDisplayName} potrzebuje połączenia z{" "}
									{alert.driverDisplayName}
								</p>
								<p className="text-sm text-muted-foreground mt-1">
									Trasa: {formatRoute(alert.pickupPoint, alert.dropoffPoint)}
								</p>
								<p className="text-sm text-muted-foreground">
									Miejsca: {alert.seatsRequested}
								</p>
								<button
									type="button"
									onClick={() => handleResolveMediation(alert.requestId)}
									className="mt-3 px-4 py-2 rounded-full text-sm font-semibold border border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 transition"
								>
									Oznacz jako połączone
								</button>
							</li>
						))}
					</ul>
				)}
			</div>

			<div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
				<div className="flex flex-wrap items-center justify-between gap-3 mb-4">
					<h3 className="text-xl font-bold text-foreground">Q&A od gości</h3>
					<p className="text-sm text-muted-foreground">
						Oczekujące pytania: {pendingQaCount}
					</p>
				</div>
				{!qaQuestions ? (
					<p className="text-muted-foreground">Ładowanie pytań...</p>
				) : qaQuestions.length === 0 ? (
					<p className="text-muted-foreground">Brak pytań od gości.</p>
				) : (
					<ul className="space-y-3">
						{qaQuestions.map((item) => {
							const isAnswered = item.status === "answered";
							const isExpanded = !isAnswered || expandedAnsweredIds[item._id];

							if (!isExpanded) {
								return (
									<li
										key={item._id}
										className="rounded-xl bg-[var(--color-background-light)] p-4"
									>
										<div className="flex items-start justify-between gap-3">
											<div>
												<p className="text-xs uppercase tracking-widest text-muted-foreground">
													Odpowiedziane
												</p>
												<p className="font-semibold text-foreground mt-1">
													{item.question}
												</p>
												<p className="text-xs text-muted-foreground mt-1">
													Od: {item.askerDisplayName ?? "Gość"} •{" "}
													{new Date(item.createdAt).toLocaleString("pl-PL")}
												</p>
											</div>
											<button
												type="button"
												onClick={() => toggleAnsweredCard(item._id)}
												className="shrink-0 px-3 py-1.5 rounded-full border border-[var(--color-primary)] text-[var(--color-primary)] text-xs font-semibold hover:bg-[var(--color-primary)]/10 transition"
											>
												Rozwiń
											</button>
										</div>
									</li>
								);
							}

							return (
								<li
									key={item._id}
									className="rounded-xl bg-[var(--color-background-light)] p-4"
								>
									<div className="flex flex-wrap items-center justify-between gap-2">
										<p className="text-xs uppercase tracking-widest text-muted-foreground">
											{isAnswered ? "Odpowiedziane" : "Oczekujące"}
										</p>
										<div className="flex items-center gap-2">
											<p className="text-xs text-muted-foreground">
												{new Date(item.createdAt).toLocaleString("pl-PL")}
											</p>
											{isAnswered && (
												<button
													type="button"
													onClick={() => toggleAnsweredCard(item._id)}
													className="px-3 py-1 rounded-full border border-[var(--color-primary)] text-[var(--color-primary)] text-xs font-semibold hover:bg-[var(--color-primary)]/10 transition"
												>
													Zwiń
												</button>
											)}
										</div>
									</div>
									<p className="font-semibold text-foreground mt-2">
										{item.question}
									</p>
									<p className="text-xs text-muted-foreground mt-1">
										Od: {item.askerDisplayName ?? "Gość"}
									</p>
									<textarea
										value={answerDrafts[item._id] ?? ""}
										onChange={(event) =>
											setAnswerDrafts((previous) => ({
												...previous,
												[item._id]: event.target.value,
											}))
										}
										rows={3}
										placeholder="Wpisz odpowiedź dla gości..."
										className="mt-3 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm text-foreground shadow-xs focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
									/>
									<button
										type="button"
										onClick={() => handleSaveAnswer(item._id)}
										disabled={savingQuestionId === item._id}
										className="mt-3 px-4 py-2 rounded-full bg-[var(--color-primary)] text-white text-sm font-semibold hover:bg-[var(--color-primary-dark)] disabled:cursor-not-allowed disabled:opacity-70 transition"
									>
										{savingQuestionId === item._id
											? "Zapisywanie..."
											: "Zapisz odpowiedź"}
									</button>
								</li>
							);
						})}
					</ul>
				)}
			</div>

			<div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
				<h3 className="text-xl font-bold text-foreground mb-4">
					Przyloty (data)
				</h3>
				{arrivals.length === 0 ? (
					<p className="text-muted-foreground">Brak danych o przylotach.</p>
				) : (
					<div className="space-y-3">
						{sortedArrivalDates.map((date) => {
							const isExpanded = expandedArrivalDates[date];
							const group = arrivalsByDate[date];
							const label =
								date === "unknown" ? "Nieznana data" : formatLocalDate(date);

							return (
								<div
									key={date}
									className="rounded-xl border border-gray-100 bg-white overflow-hidden"
								>
									<button
										type="button"
										onClick={() => toggleArrivalDate(date)}
										className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition text-left"
									>
										<span className="font-semibold text-foreground">
											{label}
										</span>
										<div className="flex items-center gap-2 text-muted-foreground">
											<span className="text-xs">{group.length}</span>
											{isExpanded ? (
												<ChevronDown className="h-4 w-4" />
											) : (
												<ChevronRight className="h-4 w-4" />
											)}
										</div>
									</button>
									{isExpanded && (
										<div className="p-2 bg-white">
											{group.map((invitation) => (
												<div
													key={invitation._id}
													className="py-2 px-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 rounded-md transition-colors flex justify-between items-center"
												>
													<span className="text-sm font-medium text-foreground">
														{invitation.displayName}
													</span>
												</div>
											))}
										</div>
									)}
								</div>
							);
						})}
					</div>
				)}
			</div>

			<div className="rounded-2xl border border-border bg-white p-6 shadow-sm overflow-x-auto">
				<h3 className="text-xl font-bold text-foreground mb-4">Zaproszenia</h3>
				<table className="w-full text-sm">
					<thead>
						<tr className="text-left text-xs uppercase tracking-widest text-muted-foreground">
							<th className="py-2 pr-4">Goście</th>
							<th className="py-2 pr-4">Relacja</th>
							<th className="py-2 pr-4">PIN</th>
							<th className="py-2 pr-4">QR</th>
							<th className="py-2 pr-4">RSVP</th>
							<th className="py-2 pr-4">Transport</th>
							<th className="py-2 pr-4">Przylot</th>
							<th className="py-2 pr-4">+1</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-gray-100">
						{invitations.map((invitation) => {
							const attendanceStats = getInvitationAttendanceStats(invitation);
							const attendanceSummary =
								attendanceStats.confirmed > 0
									? "yes"
									: attendanceStats.pending === 0 &&
											attendanceStats.declined > 0
										? "no"
										: undefined;

							return (
								<tr
									key={invitation._id}
									className="align-middle border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors"
								>
									<td className="py-4 pr-4">
										<div className="flex items-center gap-3">
											<div
												className={`w-2.5 h-2.5 rounded-full shrink-0 ${
													attendanceSummary === "yes"
														? "bg-green-500 shadow-[0_0_0_2px_rgba(34,197,94,0.2)]"
														: attendanceSummary === "no"
															? "bg-red-500 shadow-[0_0_0_2px_rgba(239,68,68,0.2)]"
															: "bg-gray-200"
												}`}
												title={
													attendanceSummary === "yes"
														? "Potwierdzone"
														: attendanceSummary === "no"
															? "Odmowa"
															: "Brak odpowiedzi"
												}
											/>
											<div>
												<div className="font-semibold text-foreground">
													{invitation.displayName}
												</div>
												<div className="mt-1 space-y-1">
													{invitation.guests.map((guest) => {
														const guestAttendance = getGuestAttendance(
															invitation,
															guest,
														);

														return (
															<div
																key={guest._id}
																className="text-xs text-muted-foreground flex items-center gap-2"
															>
																<span>{guest.fullName}</span>
																<span
																	className={
																		guestAttendance === "yes"
																			? "text-green-600 font-medium"
																			: guestAttendance === "no"
																				? "text-red-600 font-medium"
																				: "text-muted-foreground"
																	}
																>
																	{guestAttendance === "yes"
																		? "Tak"
																		: guestAttendance === "no"
																			? "Nie"
																			: "-"}
																</span>
															</div>
														);
													})}
												</div>
											</div>
										</div>
									</td>
									<td className="py-4 pr-4">
										<div className="space-y-2">
											{invitation.guests.map((guest) => (
												<div key={guest._id}>
													<select
														value={guest.relation ?? ""}
														onChange={(e) =>
															handleRelationChange(
																guest._id,
																e.target.value || undefined,
															)
														}
														className="text-xs rounded-md border border-gray-200 bg-white px-2 py-1.5 focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] outline-none transition-all w-32"
													>
														{RELATION_OPTIONS.map((option) => (
															<option key={option.value} value={option.value}>
																{option.label}
															</option>
														))}
													</select>
												</div>
											))}
										</div>
									</td>
									<td className="py-4 pr-4">
										<code className="px-2 py-1 rounded bg-gray-100 text-xs font-mono text-gray-700 border border-gray-200">
											{invitation.shortCode}
										</code>
									</td>
									<td className="py-4 pr-4">
										<button
											type="button"
											onClick={() => handleCopy(invitation.qrToken)}
											className="text-xs font-medium text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] hover:underline flex items-center gap-1"
										>
											<span className="i-lucide-link h-3 w-3" />
											Kopiuj link
										</button>
									</td>
									<td className="py-4 pr-4">
										<div className="flex flex-col gap-0.5">
											<span className="text-sm font-medium text-foreground">
												Tak: {attendanceStats.confirmed} / Nie:{" "}
												{attendanceStats.declined}
											</span>
											{attendanceStats.pending > 0 && (
												<span className="text-[10px] uppercase tracking-wider text-muted-foreground">
													Brak odpowiedzi: {attendanceStats.pending}
												</span>
											)}
											{invitation.answeredForAll === false && (
												<span className="text-[10px] uppercase tracking-wider text-amber-600 font-medium bg-amber-50 px-1.5 py-0.5 rounded self-start">
													Tylko: {invitation.answeredForName ?? "1 os."}
												</span>
											)}
										</div>
									</td>
									<td className="py-4 pr-4">
										<span className="text-sm text-foreground">
											{invitation.transport
												? invitation.transport === "bus"
													? "Bus"
													: "Własny"
												: "-"}
										</span>
									</td>
									<td className="py-4 pr-4 text-sm text-foreground whitespace-nowrap">
										{formatLocalDate(invitation.arrivalDateTime) || "-"}
									</td>
									<td className="py-4 pr-4 text-sm text-foreground">
										<div className="flex flex-col">
											{invitation.plusOneAttendance && (
												<span
													className={
														invitation.plusOneAttendance === "yes"
															? "text-green-600"
															: "text-red-600"
													}
												>
													{invitation.plusOneAttendance === "yes"
														? "Tak"
														: "Nie"}
												</span>
											)}
											{invitation.plusOneName && (
												<span className="text-xs text-muted-foreground">
													{invitation.plusOneName}
												</span>
											)}
											{!invitation.plusOneAttendance && "-"}
										</div>
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>
		</div>
	);
}

function DateTimeField({
	label,
	value,
	onChange,
}: {
	label: string;
	value: string;
	onChange: (value: string) => void;
}) {
	const initialParsed = parseLocalDateTime(value);
	const [selectedDate, setSelectedDate] = useState<Date | undefined>(
		initialParsed.date,
	);
	const [selectedTime, setSelectedTime] = useState<string>(initialParsed.time);
	const lastValueRef = useRef(value);

	useEffect(() => {
		if (value !== lastValueRef.current) {
			lastValueRef.current = value;
			const parsed = parseLocalDateTime(value);
			setSelectedDate(parsed.date);
			setSelectedTime(parsed.time);
		}
	}, [value]);

	useEffect(() => {
		const nextValue = buildLocalDateTime(selectedDate, selectedTime);
		if (nextValue && nextValue !== value) {
			lastValueRef.current = nextValue;
			onChange(nextValue);
		}
	}, [onChange, selectedDate, selectedTime, value]);

	return (
		<div>
			<p className="text-xs uppercase tracking-widest text-muted-foreground">
				{label}
			</p>
			<div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
				<DatePicker
					value={selectedDate}
					onChange={setSelectedDate}
					placeholder="Wybierz datę"
					className="h-10 w-full rounded-xl border-gray-200 bg-gray-50 px-4"
				/>
				<Input
					type="time"
					value={selectedTime}
					onChange={(event) => setSelectedTime(event.target.value)}
					step={60}
					className="h-10 w-full rounded-xl border-gray-200 bg-gray-50 px-4"
				/>
			</div>
		</div>
	);
}

function formatRoute(pickupPoint?: string, dropoffPoint?: string) {
	const pickup = pickupPoint?.trim();
	const dropoff = dropoffPoint?.trim();
	if (pickup && dropoff) return `${pickup} -> ${dropoff}`;
	if (pickup) return `Start: ${pickup}`;
	if (dropoff) return `Cel: ${dropoff}`;
	return "Trasa do ustalenia";
}

function getGuestAttendance(
	invitation: AdminInvitation,
	guest: AdminInvitation["guests"][number],
): "yes" | "no" | undefined {
	const fromId = invitation.guestAttendances?.[guest._id];
	if (fromId === "yes" || fromId === "no") {
		return fromId;
	}
	const normalizedName = guest.fullName.trim();
	const fromMap = invitation.guestAttendances?.[normalizedName];
	if (fromMap === "yes" || fromMap === "no") {
		return fromMap;
	}

	const hasGuestAttendances =
		invitation.guestAttendances &&
		Object.keys(invitation.guestAttendances).length > 0;
	if (hasGuestAttendances) {
		return undefined;
	}

	if (invitation.attendance === "yes" || invitation.attendance === "no") {
		return invitation.attendance;
	}
	return undefined;
}

function getInvitationAttendanceStats(invitation: AdminInvitation) {
	return invitation.guests.reduce(
		(acc, guest) => {
			const guestAttendance = getGuestAttendance(invitation, guest);
			if (guestAttendance === "yes") {
				acc.confirmed += 1;
			} else if (guestAttendance === "no") {
				acc.declined += 1;
			} else {
				acc.pending += 1;
			}
			return acc;
		},
		{ confirmed: 0, declined: 0, pending: 0 },
	);
}
