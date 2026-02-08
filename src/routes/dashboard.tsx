import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { HeroSection } from "@/components/dashboard/HeroSection";
import {
	type InfoCardData,
	InfoCardGrid,
} from "@/components/dashboard/InfoCard";
import { PlanTimeline } from "@/components/dashboard/PlanTimeline";
import {
	DeadlineCountdownWidget,
	DogSlideshowWidget,
	EmergencyContactsWidget,
	EventCountdownWidget,
} from "@/components/dashboard/SidebarWidgets";
import { type RSVPFormData, RsvpForm } from "@/components/rsvp/RsvpForm";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { isAdminEmail } from "@/lib/admin";
import { authClient } from "@/lib/auth-client";
import {
	buildLocalDateTime,
	formatLocalDate,
	parseLocalDateTime,
} from "@/lib/date-time";
import { buildGreeting, RELATION_OPTIONS } from "@/lib/greetings";
import { useInvitationSession } from "@/lib/invitation-session";
import { api } from "../../convex/_generated/api";

export const Route = createFileRoute("/dashboard")({
	component: DashboardPage,
});

type MainTabId =
	// | "Informacje"
	"RSVP" | "Plan zabawy" | "Logistyka" | "Atrakcje" | "Q&A" | "Admin";

function DashboardPage() {
	const navigate = useNavigate();
	const { invitationId, isLoading: isSessionLoading } = useInvitationSession();
	const { data: adminSession, isPending: isAdminPending } =
		authClient.useSession();
	const isAdmin = isAdminEmail(adminSession?.user?.email);

	const invitationData = useQuery(
		api.invitations.getById,
		invitationId ? { invitationId: invitationId as any } : "skip",
	);
	const adminInvitations = useQuery(
		api.invitations.listForAdmin,
		isAdmin ? {} : "skip",
	);
	const settings = useQuery(api.settings.getRsvpSettings, {});

	const [activeTab, setActiveTab] = useState<MainTabId>("RSVP");

	useEffect(() => {
		if (activeTab === "Admin" && !isAdmin) {
			setActiveTab("Admin");
		}
	}, [activeTab, isAdmin]);

	useEffect(() => {
		if (!isSessionLoading && !isAdminPending && !invitationId && !isAdmin) {
			navigate({ to: "/" });
		}
	}, [invitationId, isAdmin, isAdminPending, isSessionLoading, navigate]);

	const greeting = useMemo(() => {
		if (!invitationData?.guests) return "Cześć!";
		return buildGreeting(invitationData.guests);
	}, [invitationData?.guests]);

	const tabs = useMemo(() => {
		const base: MainTabId[] = [
			// "Informacje",
			"RSVP",
			"Plan zabawy",
			"Logistyka",
			"Atrakcje",
			"Q&A",
		];
		if (isAdmin) {
			base.push("Admin");
		}
		return base;
	}, [isAdmin]);

	const eventDate = useMemo(() => new Date("2026-10-02T16:00"), []);
	const deadlineDate = useMemo(() => {
		const fallback = new Date("2026-02-28T23:59");
		if (!settings) return fallback;
		const parsed = new Date(settings.rsvpDeadline);
		return Number.isNaN(parsed.getTime()) ? fallback : parsed;
	}, [settings]);

	const handleAddToCalendar = () => {
		const ics = buildIcsFile();
		const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
		const link = document.createElement("a");
		link.href = URL.createObjectURL(blob);
		link.download = "wesele.ics";
		link.click();
		URL.revokeObjectURL(link.href);
	};

	if (isSessionLoading && !isAdmin) {
		return (
			<div className="flex items-center justify-center min-h-screen bg-[var(--color-background-light)]">
				<div className="flex flex-col items-center gap-4">
					<div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-[var(--color-primary)]" />
					<p className="text-gray-500 font-medium">Ładowanie...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="w-full bg-background min-h-screen">
			<HeroSection />
			<div className="w-full max-w-7xl px-4 md:px-8 py-12 flex flex-col lg:flex-row gap-12 mx-auto">
				<div className="flex-1 flex flex-col gap-8">
					<div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
						<h2 className="text-3xl md:text-4xl font-black text-foreground">
							{greeting}
						</h2>
						<p className="text-muted-foreground mt-2">
							Jesteśmy niesamowicie szczęśliwi, że jesteś z nami w tej
							przygodzie.
						</p>
						<div className="mt-4 space-y-6">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="rounded-xl bg-[var(--color-background-light)] p-4">
									<p className="text-xs uppercase tracking-widest text-muted-foreground">
										Miejsce
									</p>
									<p className="font-semibold text-foreground mt-1">
										Kreta, Grecja
									</p>
								</div>
								<div className="rounded-xl bg-[var(--color-background-light)] p-4">
									<p className="text-xs uppercase tracking-widest text-muted-foreground">
										Ważne daty
									</p>
									<p className="font-semibold text-foreground mt-1">
										30.09 – 04.10.2026
									</p>
								</div>
							</div>
							<p className="text-muted-foreground">
								Jeśli potrzebujesz pomocy z podróżą lub noclegiem, daj nam znać
								w formularzu RSVP.
							</p>
						</div>
					</div>

					<FilterBar
						filtersOverride={tabs}
						activeFilter={activeTab}
						onSelect={(label) => setActiveTab(label as MainTabId)}
					/>

					{activeTab === "RSVP" && (
						<RsvpTab invitationData={invitationData} settings={settings} />
					)}
					{activeTab === "Admin" && isAdmin && (
						<AdminTab
							invitations={adminInvitations ?? []}
							settings={settings}
						/>
					)}
					{activeTab !== "RSVP" && activeTab !== "Admin" && (
						<InfoTab activeInfoTab={activeTab} />
					)}
				</div>

				<aside className="w-full lg:w-80 flex flex-col gap-8">
					<EventCountdownWidget
						eventDate={eventDate}
						onAddToCalendar={handleAddToCalendar}
					/>
					<DeadlineCountdownWidget deadline={deadlineDate} />
					<EmergencyContactsWidget />
					<DogSlideshowWidget />
				</aside>
			</div>
		</div>
	);
}

function InfoTab({ activeInfoTab }: { activeInfoTab: MainTabId }) {
	switch (activeInfoTab) {
		case "Plan zabawy":
			return <InfoPlanTemplate />;
		case "Logistyka":
			return <InfoLogisticsTemplate />;
		case "Atrakcje":
			return <InfoAttractionsTemplate />;
		case "Q&A":
			return <InfoQATemplate />;
		default:
			return <InfoOverview />;
	}
}

function InfoOverview() {
	const cards: InfoCardData[] = [
		{
			id: "info-rsvp",
			image:
				"https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1200&q=80",
			category: "RSVP",
			date: "Luty 2026",
			title: "Potwierdź obecność",
			description:
				"Formularz do potwierdzenia obecności z shared. Dwa mode - create / update. Lista gości.",
			alt: "Notatnik i długopis przy filiżance kawy",
			content: (
				<ul className="space-y-2 text-sm text-muted-foreground">
					<li>Formularz do potwierdzenia obecności z shared</li>
					<li>dwa mode - create / update</li>
					<li>Lista gości</li>
				</ul>
			),
		},
		{
			id: "info-plan",
			image:
				"https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
			category: "Plan zabawy",
			date: "Wrzesień 2026",
			title: "Harmonogram dni",
			description: "Kazdy dzien szczegolowo rozpisany.",
			alt: "Widok na morze o zachodzie słońca",
			content: (
				<p className="text-sm text-muted-foreground">
					Kazdy dzien szczegolowo rozpisany.
				</p>
			),
		},
	];

	return (
		<div className="space-y-6">
			<div className="rounded-2xl border border-border bg-white p-6 shadow-sm space-y-6">
				<div>
					<h3 className="text-2xl font-bold text-foreground">
						Nasze Wielkie Greckie Wesele
					</h3>
					<p className="text-muted-foreground mt-2">
						Widujemy się w Grecji od 30 września do 4 października. Główna
						uroczystość: 2 października 2026.
					</p>
				</div>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="rounded-xl bg-[var(--color-background-light)] p-4">
						<p className="text-xs uppercase tracking-widest text-muted-foreground">
							Miejsce
						</p>
						<p className="font-semibold text-foreground mt-1">Kreta, Grecja</p>
					</div>
					<div className="rounded-xl bg-[var(--color-background-light)] p-4">
						<p className="text-xs uppercase tracking-widest text-muted-foreground">
							Ważne daty
						</p>
						<p className="font-semibold text-foreground mt-1">
							30.09 – 04.10.2026
						</p>
					</div>
				</div>
				<p className="text-muted-foreground">
					Jeśli potrzebujesz pomocy z podróżą lub noclegiem, daj nam znać w
					formularzu RSVP.
				</p>
			</div>
			<InfoCardGrid cards={cards} />
		</div>
	);
}

function InfoPlanTemplate() {
	return (
		<div className="space-y-6">
			{/* <div className="rounded-2xl border border-border bg-white p-6 shadow-sm space-y-4">
				<h3 className="text-2xl font-bold text-foreground">Plan zabawy</h3>
				<p className="text-muted-foreground">
					Kazdy dzien szczegolowo rozpisany.
				</p>
			</div> */}
			<PlanTimeline />
		</div>
	);
}

function InfoLogisticsTemplate() {
	const cards: InfoCardData[] = [
		{
			id: "logistics-hotel",
			image:
				"https://images.unsplash.com/photo-1501117716987-c8e1ecb210b9?auto=format&fit=crop&w=1200&q=80",
			category: "Logistyka",
			date: "Wrzesień 2026",
			title: "Nocleg i dojazd",
			description:
				"hotel lefka ori lub wokol w zaleznosci od przybycia. Transport z lotniska i na lotnisko.",
			alt: "Stylowy hotel z basenem",
			content: (
				<ul className="space-y-2 text-sm text-muted-foreground">
					<li>hotel lefka ori lub wokol w zaleznosci od przybycia</li>
					<li>
						transport z lotniska do hotelu - samemu autem 1:30h lub busem z 2
						link w zaleznosci od liczby ppl
					</li>
					<li>
						transport z hotelu na lotnisko - samemu autem 1:30h lub busem z 2
						link w zaleznosci od liczby ppl link autobusy
					</li>
				</ul>
			),
		},
	];

	return (
		<div className="space-y-6">
			<div className="rounded-2xl border border-border bg-white p-6 shadow-sm space-y-4">
				<h3 className="text-2xl font-bold text-foreground">Logistyka</h3>
				<ul className="text-muted-foreground space-y-2">
					<li>hotel lefka ori lub wokol w zaleznosci od przybycia</li>
					<li>
						transport z lotniska do hotelu - samemu autem 1:30h lub busem z 2
						link w zaleznosci od liczby ppl
					</li>
					<li>
						transport z hotelu na lotnisko - samemu autem 1:30h lub busem z 2
						link w zaleznosci od liczby ppl link autobusy
					</li>
				</ul>
			</div>
			<InfoCardGrid cards={cards} />
		</div>
	);
}

function InfoAttractionsTemplate() {
	const cards: InfoCardData[] = [
		{
			id: "attractions-list",
			image:
				"https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
			category: "Atrakcje",
			date: "Wrzesień 2026",
			title: "Najlepsze miejsca",
			description: "Lista atrakcji na Krecie i linki do atrakcji.",
			alt: "Widok na plażę i klify",
			content: (
				<ul className="space-y-2 text-sm text-muted-foreground">
					<li>Lista atrakcji na Krecie</li>
					<li>Linki do atrakcji</li>
				</ul>
			),
		},
	];

	return (
		<div className="space-y-6">
			<div className="rounded-2xl border border-border bg-white p-6 shadow-sm space-y-4">
				<h3 className="text-2xl font-bold text-foreground">Atrakcje</h3>
				<ul className="text-muted-foreground space-y-2">
					<li>Lista atrakcji na Krecie</li>
					<li>Linki do atrakcji</li>
				</ul>
			</div>
			<InfoCardGrid cards={cards} />
		</div>
	);
}

function InfoQATemplate() {
	const cards: InfoCardData[] = [
		{
			id: "qa-pack",
			image:
				"https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1200&q=80",
			category: "Q&A",
			date: "Wrzesień 2026",
			title: "Najczęstsze pytania",
			description: "Najważniejsze odpowiedzi w jednym miejscu.",
			alt: "Kartki z notatkami i planem",
			content: (
				<ul className="space-y-2 text-sm text-muted-foreground">
					<li>
						co zabrac ze soba? lista rzeczy do zabrania wazny dowod japonki
						wygodne buty okulary kostium kapielowy
					</li>
					<li>czy brac cash?</li>
					<li>dzieci</li>
					<li>dress code</li>
					<li>Formularz do zadawania pytań</li>
				</ul>
			),
		},
	];

	return (
		<div className="space-y-6">
			<div className="rounded-2xl border border-border bg-white p-6 shadow-sm space-y-4">
				<h3 className="text-2xl font-bold text-foreground">Q&A</h3>
				<ul className="text-muted-foreground space-y-2">
					<li>
						co zabrac ze soba? lista rzeczy do zabrania wazny dowod japonki
						wygodne buty okulary kostium kapielowy
					</li>
					<li>czy brac cash?</li>
					<li>dzieci</li>
					<li>dress code</li>
					<li>Formularz do zadawania pytań</li>
				</ul>
			</div>
			<InfoCardGrid cards={cards} />
		</div>
	);
}

function RsvpTab({
	invitationData,
	settings,
}: {
	invitationData:
			| {
					invitation: {
						_id: string;
					attendance?: "yes" | "no";
					answeredForAll?: boolean;
					answeredForName?: string;
					transport?: "own" | "bus";
					arrivalDateTime?: string;
					message?: string;
					plusOneName?: string;
						plusOneAttendance?: "yes" | "no";
						hasPlusOne: boolean;
					};
					guests: Array<{
						_id: string;
						fullName: string;
						relation?: string;
					}>;
			  }
			| undefined;
	settings:
		| {
				rsvpDeadline: string;
				rsvpGraceDeadline: string;
		  }
		| undefined;
}) {
	const updateRsvp = useMutation(api.invitations.updateRsvp);
	const invitation = invitationData?.invitation;
	const invitationGuests = useMemo(
		() => invitationData?.guests.map((guest) => guest.fullName) ?? [],
		[invitationData?.guests],
	);
	const [isEditing, setIsEditing] = useState(false);
	const [responseMode, setResponseMode] = useState<"edit-existing" | "respond-next">(
		"edit-existing",
	);

	const deadline = useMemo(() => {
		if (!settings) return new Date("2026-02-28T23:59");
		return new Date(settings.rsvpDeadline);
	}, [settings]);
	const graceDeadline = useMemo(() => {
		if (!settings) return new Date("2026-03-31T23:59");
		return new Date(settings.rsvpGraceDeadline);
	}, [settings]);

	const now = Date.now();
	const isAfterDeadline = now > deadline.getTime();
	const isAfterGrace = now > graceDeadline.getTime();

	const hasRsvp = Boolean(invitation?.attendance);
	const canEdit = !isAfterGrace;
	const canSubmitNew = !isAfterDeadline;

	const defaultValues: Partial<RSVPFormData> | undefined = invitation
		? {
				attendance: invitation.attendance ?? "yes",
				answeredForAll: invitation.answeredForAll ? "yes" : "no",
				answeredForName:
					responseMode === "respond-next"
						? ""
						: invitation.answeredForName ?? "",
				transport: invitation.transport ?? "own",
				arrivalDateTime: invitation.arrivalDateTime ?? "",
				message: invitation.message ?? "",
				plusOneName: invitation.plusOneName ?? "",
				plusOneAttendance: invitation.plusOneAttendance,
			}
		: undefined;
	const blockedGuests =
		responseMode === "respond-next" &&
		invitation?.answeredForAll === false &&
		invitation.answeredForName?.trim()
			? [invitation.answeredForName.trim()]
			: [];

	const handleSubmit = async (data: RSVPFormData) => {
		if (!invitation) return;
		const attending = data.attendance === "yes";
		try {
			await updateRsvp({
				invitationId: invitation._id as any,
				attendance: data.attendance,
				answeredForAll: data.answeredForAll === "yes",
				answeredForName:
					data.answeredForAll === "no" ? data.answeredForName?.trim() : undefined,
				transport: attending ? data.transport : undefined,
				arrivalDateTime:
					attending && data.arrivalDateTime ? data.arrivalDateTime : undefined,
				message: data.message,
				plusOneName:
					attending && invitation.hasPlusOne && data.plusOneAttendance === "yes"
						? data.plusOneName
						: undefined,
				plusOneAttendance:
					attending && invitation.hasPlusOne && data.plusOneAttendance
						? data.plusOneAttendance
						: undefined,
			});
			toast({
				variant: "success",
				title: "RSVP zapisane",
				description: "Dziękujemy za przesłanie formularza.",
			});
			setResponseMode("edit-existing");
			setIsEditing(false);
		} catch (_error) {
			toast({
				variant: "destructive",
				title: "Nie udało się zapisać RSVP",
				description: "Spróbuj ponownie za chwilę.",
			});
		}
	};

	if (!invitation) {
		return (
			<div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
				Ładowanie RSVP...
			</div>
		);
	}

	if (!hasRsvp && !canSubmitNew) {
		return (
			<div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
				<h3 className="text-2xl font-bold text-foreground">RSVP zamknięte</h3>
				<p className="text-muted-foreground mt-2">
					Termin odpowiedzi minął. Jeśli to ważne, skontaktuj się z nami
					bezpośrednio.
				</p>
			</div>
		);
	}

	if (hasRsvp && !isEditing) {
		return (
				<div className="rounded-2xl border border-border bg-white p-6 shadow-sm space-y-4">
					<div className="flex items-center justify-between">
						<h3 className="text-2xl font-bold text-foreground">
							Twoja odpowiedź
						</h3>
						{canEdit && (
							<div className="flex items-center gap-2">
								<button
									type="button"
									onClick={() => {
										setResponseMode("edit-existing");
										setIsEditing(true);
									}}
									className="px-4 py-2 rounded-full text-sm font-semibold bg-[var(--color-primary)] text-white shadow hover:bg-[var(--color-primary-dark)] transition"
								>
									Edytuj
								</button>
									{invitation.answeredForAll === false && (
										<button
											type="button"
											onClick={() => {
												setResponseMode("respond-next");
												setIsEditing(true);
											}}
											className="px-4 py-2 rounded-full text-sm font-semibold border border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 transition"
										>
											Odpowiedz za inną osobę
										</button>
									)}
								</div>
							)}
						</div>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<InfoRow
						label="Obecność"
						value={invitation.attendance === "yes" ? "Tak" : "Nie"}
					/>
					<InfoRow
						label="Odpowiedź za wszystkich"
						value={invitation.answeredForAll ? "Tak" : "Nie"}
					/>
					{invitation.answeredForAll === false && (
						<InfoRow
							label="Odpowiedź dotyczy"
							value={invitation.answeredForName ?? "-"}
						/>
					)}
					<InfoRow
						label="Transport"
						value={invitation.transport === "bus" ? "Bus" : "Własny"}
					/>
						<InfoRow
							label="Przylot"
							value={formatLocalDate(invitation.arrivalDateTime) || "-"}
						/>
					{invitation.hasPlusOne && (
						<>
							<InfoRow
								label="+1 obecność"
								value={invitation.plusOneAttendance ?? "-"}
							/>
							<InfoRow
								label="+1 imię i nazwisko"
								value={invitation.plusOneName ?? "-"}
							/>
						</>
					)}
				</div>
				{invitation.message && (
					<div className="rounded-xl bg-[var(--color-background-light)] p-4">
						<p className="text-xs uppercase tracking-widest text-muted-foreground">
							Wiadomość
						</p>
						<p className="text-foreground mt-2">{invitation.message}</p>
					</div>
				)}
				{!canEdit && (
					<p className="text-sm text-muted-foreground">
						Edycja RSVP jest już zamknięta (po 31 marca 2026).
					</p>
				)}
			</div>
		);
	}

	return (
		<RsvpForm
			key={responseMode}
			defaultValues={defaultValues}
			hasPlusOne={invitation.hasPlusOne}
			invitationGuests={invitationGuests}
			blockedGuests={blockedGuests}
			onSubmit={handleSubmit}
		/>
	);
}

function InfoRow({ label, value }: { label: string; value: string }) {
	return (
		<div className="rounded-xl bg-[var(--color-background-light)] p-4">
			<p className="text-xs uppercase tracking-widest text-muted-foreground">
				{label}
			</p>
			<p className="font-semibold text-foreground mt-1">{value}</p>
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
			<label className="text-xs uppercase tracking-widest text-muted-foreground">
				{label}
			</label>
			<div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
				<DatePicker
					value={selectedDate}
					onChange={setSelectedDate}
					placeholder="Wybierz datę"
					className="h-10 rounded-xl border-gray-200 bg-gray-50 px-4"
				/>
				<Input
					type="time"
					value={selectedTime}
					onChange={(event) => setSelectedTime(event.target.value)}
					step={60}
					className="h-10 rounded-xl border-gray-200 bg-gray-50 px-4"
				/>
			</div>
		</div>
	);
}

function AdminTab({
	invitations,
	settings,
}: {
	invitations: Array<{
		_id: string;
		displayName: string;
		shortCode: string;
		qrToken: string;
		attendance?: "yes" | "no";
		answeredForAll?: boolean;
		answeredForName?: string;
		transport?: "own" | "bus";
		arrivalDateTime?: string;
		plusOneName?: string;
		plusOneAttendance?: "yes" | "no";
		guests: Array<{
			_id: string;
			fullName: string;
			relation?: string;
		}>;
	}>;
	settings:
		| {
				rsvpDeadline: string;
				rsvpGraceDeadline: string;
		  }
		| undefined;
}) {
	const updateRelation = useMutation(api.guests.updateGuestRelation);
	const updateSettings = useMutation(api.settings.updateRsvpSettings);
	const seedInvitations = useMutation(api.invitations.seedInvitations);

	const [deadline, setDeadline] = useState(
		settings?.rsvpDeadline ?? "2026-02-28T23:59",
	);
	const [graceDeadline, setGraceDeadline] = useState(
		settings?.rsvpGraceDeadline ?? "2026-03-31T23:59",
	);

	useEffect(() => {
		if (settings?.rsvpDeadline) {
			setDeadline(settings.rsvpDeadline);
		}
		if (settings?.rsvpGraceDeadline) {
			setGraceDeadline(settings.rsvpGraceDeadline);
		}
	}, [settings?.rsvpDeadline, settings?.rsvpGraceDeadline]);

	const baseUrl =
		(import.meta as any).env?.PUBLIC_APP_URL ??
		(typeof window === "undefined" ? "" : window.location.origin);

	const totals = useMemo(() => {
		const confirmed = invitations.filter((i) => i.attendance === "yes").length;
		const declined = invitations.filter((i) => i.attendance === "no").length;
		const pending = invitations.length - confirmed - declined;
		const bus = invitations.filter(
			(i) => i.attendance === "yes" && i.transport === "bus",
		).length;
		return { confirmed, declined, pending, bus };
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
		try {
			await updateSettings({
				rsvpDeadline: deadline,
				rsvpGraceDeadline: graceDeadline,
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
		try {
			await seedInvitations({});
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
		try {
			await updateRelation({
				guestId: guestId as any,
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
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
					<h3 className="text-xl font-bold text-foreground mb-4">Przyloty (data)</h3>
				{arrivals.length === 0 ? (
					<p className="text-muted-foreground">Brak danych o przylotach.</p>
				) : (
					<ul className="space-y-2">
						{arrivals.map((invitation) => (
							<li
								key={invitation._id}
								className="flex items-center justify-between rounded-lg bg-[var(--color-background-light)] px-4 py-2"
							>
								<span className="font-medium text-foreground">
									{invitation.displayName}
								</span>
									<span className="text-sm text-muted-foreground">
										{formatLocalDate(invitation.arrivalDateTime)}
									</span>
								</li>
							))}
					</ul>
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
						{invitations.map((invitation) => (
							<tr key={invitation._id} className="align-top">
								<td className="py-4 pr-4">
									<div className="font-semibold text-foreground">
										{invitation.displayName}
									</div>
									<div className="mt-2 space-y-2">
										{invitation.guests.map((guest) => (
											<div key={guest._id} className="text-sm text-foreground">
												{guest.fullName}
											</div>
										))}
									</div>
								</td>
								<td className="py-4 pr-4">
									<div className="mt-2 space-y-2">
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
														className="text-xs rounded-md border border-gray-200 bg-gray-50 px-2 py-1"
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
								<td className="py-4 pr-4 font-mono text-xs">
									{invitation.shortCode}
								</td>
								<td className="py-4 pr-4">
									<button
										type="button"
										onClick={() => handleCopy(invitation.qrToken)}
										className="text-xs font-semibold text-[var(--color-primary)] hover:underline"
									>
										Kopiuj link
									</button>
								</td>
								<td className="py-4 pr-4">
									<span className="text-sm text-foreground">
										{invitation.attendance
											? invitation.attendance === "yes"
												? "Tak"
												: "Nie"
											: "Brak"}
									</span>
									{invitation.answeredForAll === false && (
										<p className="text-xs text-amber-600">
											Tylko za: {invitation.answeredForName ?? "siebie"}
										</p>
									)}
								</td>
								<td className="py-4 pr-4 text-sm text-foreground">
									{invitation.transport
										? invitation.transport === "bus"
											? "Bus"
											: "Własny"
										: "-"}
								</td>
									<td className="py-4 pr-4 text-sm text-foreground">
										{formatLocalDate(invitation.arrivalDateTime) || "-"}
									</td>
								<td className="py-4 pr-4 text-sm text-foreground">
									{invitation.plusOneAttendance ?? "-"}
									{invitation.plusOneName ? ` (${invitation.plusOneName})` : ""}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}

function buildIcsFile() {
	const now = new Date();
	const pad = (val: number) => String(val).padStart(2, "0");
	const formatUtc = (date: Date) =>
		`${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(
			date.getUTCHours(),
		)}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;

	const dtStamp = formatUtc(now);
	const dtStart = "20261002T160000";
	const dtEnd = "20261002T235900";
	const uid = `wesele-${now.getTime()}@kamila-kuba`;

	return [
		"BEGIN:VCALENDAR",
		"VERSION:2.0",
		"PRODID:-//KamilaKuba//Wedding//PL",
		"BEGIN:VEVENT",
		`UID:${uid}`,
		`DTSTAMP:${dtStamp}`,
		`DTSTART:${dtStart}`,
		`DTEND:${dtEnd}`,
		"SUMMARY:Nasze Wielkie Greckie Wesele",
		"DESCRIPTION:Spotykamy się w Grecji na kilka dni wspólnego świętowania.",
		"LOCATION:Kreta, Grecja",
		"BEGIN:VALARM",
		"TRIGGER:-P7D",
		"ACTION:DISPLAY",
		"DESCRIPTION:Przypomnienie o weselu",
		"END:VALARM",
		"END:VEVENT",
		"END:VCALENDAR",
	].join("\r\n");
}
