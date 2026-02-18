import { useConvex, useMutation, useQuery } from "convex/react";
import { useEffect, useId, useMemo, useState } from "react";
import { getInvitationAttendanceStats } from "@/components/dashboard/admin/helpers";
import { SectionSelector } from "@/components/dashboard/admin/SectionSelector";
import { AdminsSection } from "@/components/dashboard/admin/sections/AdminsSection";
import { ArrivalsSection } from "@/components/dashboard/admin/sections/ArrivalsSection";
import { CarpoolAlertsSection } from "@/components/dashboard/admin/sections/CarpoolAlertsSection";
import { DeadlinesSection } from "@/components/dashboard/admin/sections/DeadlinesSection";
import { DeparturesSection } from "@/components/dashboard/admin/sections/DeparturesSection";
import { InvitationsSection } from "@/components/dashboard/admin/sections/InvitationsSection";
import { OverviewSection } from "@/components/dashboard/admin/sections/OverviewSection";
import { QaSection } from "@/components/dashboard/admin/sections/QaSection";
import type {
	AdminSectionId,
	AdminSectionMeta,
	AdminUserRecord,
} from "@/components/dashboard/admin/types";
import type {
	AdminInvitation,
	CarpoolMediationAlert,
	QaAdminQuestion,
	RsvpSettings,
} from "@/components/dashboard/types";
import { toast } from "@/components/ui/use-toast";
import { isDemoMode } from "@/lib/app-mode";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

interface AdminTabProps {
	invitations: AdminInvitation[];
	settings: RsvpSettings | null | undefined;
	adminAccessToken: string | null;
	mediationAlerts?: CarpoolMediationAlert[];
	qaQuestions?: QaAdminQuestion[];
}

export function AdminTab({
	invitations,
	settings,
	adminAccessToken,
	mediationAlerts,
	qaQuestions,
}: AdminTabProps) {
	const convex = useConvex();
	const updateRelation = useMutation(api.guests.updateGuestRelation);
	const updateSettings = useMutation(api.settings.updateRsvpSettings);
	const seedInvitations = useMutation(api.invitations.seedInvitations);
	const resetRsvpForAllInvitations = useMutation(
		api.invitations.resetRsvpForAllInvitations,
	);
	const resolveMediationAlert = useMutation(api.carpool.resolveMediationAlert);
	const answerQuestion = useMutation(api.questions.answerQuestion);
	const addAdmin = useMutation(api.adminUsers.addAdmin);
	const setAdminStatus = useMutation(api.adminUsers.setAdminStatus);
	const adminUsers = useQuery(
		api.adminUsers.listForAdmin,
		adminAccessToken ? { adminAccessToken } : "skip",
	) as AdminUserRecord[] | undefined;

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
	const [newAdminEmail, setNewAdminEmail] = useState("");
	const [adminMutationEmail, setAdminMutationEmail] = useState<string | null>(
		null,
	);
	const [isResettingRsvpData, setIsResettingRsvpData] = useState(false);
	const [savingQuestionId, setSavingQuestionId] = useState<string | null>(null);
	const [expandedAnsweredIds, setExpandedAnsweredIds] = useState<
		Record<string, boolean>
	>({});
	const [activeSection, setActiveSection] = useState<AdminSectionId>("admins");
	const newAdminEmailId = useId();
	const isDevelopment = import.meta.env.DEV;
	const isDemoEnvironment = isDemoMode();

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
				if (stats.confirmed > 0) {
					acc.childrenTotal += normalizeChildrenCount(invitation.childrenCount);
					if (invitation.accommodationType === "hostProvided") {
						acc.accommodationHostProvided += 1;
					} else if (invitation.accommodationType === "selfArranged") {
						acc.accommodationSelfArranged += 1;
					}
				}
				return acc;
			},
			{
				confirmed: 0,
				declined: 0,
				pending: 0,
				bus: 0,
				childrenTotal: 0,
				accommodationHostProvided: 0,
				accommodationSelfArranged: 0,
			},
		);
	}, [invitations]);

	const pendingQaCount = useMemo(() => {
		if (!qaQuestions) return 0;
		return qaQuestions.filter((item) => item.status === "pending").length;
	}, [qaQuestions]);
	const pendingCarpoolCount = mediationAlerts?.length ?? 0;

	const adminSections = useMemo<AdminSectionMeta[]>(
		() => [
			{
				id: "admins",
				title: "Administratorzy",
				description: "Dodawanie i zarządzanie dostępem administratorów.",
			},
			{
				id: "deadlines",
				title: "Terminy RSVP",
				description: "Aktualizacja terminów odpowiedzi i car pool.",
			},
			{
				id: "carpool",
				title: "Alerty Car Pool",
				description: "Sprawy wymagające pośrednictwa organizatora.",
				pendingCount: pendingCarpoolCount,
			},
			{
				id: "qa",
				title: "Q&A od gości",
				description: "Pytania od gości i odpowiedzi administratora.",
				pendingCount: pendingQaCount,
			},
			{
				id: "arrivals",
				title: "Przyloty",
				description: "Lista przylotów pogrupowana po datach.",
			},
			{
				id: "departures",
				title: "Wyloty",
				description: "Lista wylotów pogrupowana po datach.",
			},
			{
				id: "invitations",
				title: "Zaproszenia",
				description: "Pełna tabela gości, relacji, RSVP i QR.",
			},
		],
		[pendingCarpoolCount, pendingQaCount],
	);

	const handleAddAdmin = async () => {
		if (!adminAccessToken) return;
		const email = newAdminEmail.trim();
		if (!email) {
			toast({
				variant: "destructive",
				title: "Brak adresu e-mail",
				description: "Wpisz adres e-mail osoby, którą chcesz dodać.",
			});
			return;
		}

		try {
			setAdminMutationEmail(email.toLowerCase());
			await addAdmin({
				adminAccessToken,
				email,
			});
			setNewAdminEmail("");
			toast({
				variant: "success",
				title: "Administrator zapisany",
				description: "Uprawnienia zostały zaktualizowane.",
			});
		} catch (_error) {
			toast({
				variant: "destructive",
				title: "Nie udało się dodać administratora",
				description: "Sprawdź adres e-mail i spróbuj ponownie.",
			});
		} finally {
			setAdminMutationEmail(null);
		}
	};

	const handleSetAdminStatus = async (email: string, nextIsActive: boolean) => {
		if (!adminAccessToken) return;
		try {
			setAdminMutationEmail(email);
			await setAdminStatus({
				adminAccessToken,
				email,
				isActive: nextIsActive,
			});
			toast({
				variant: "success",
				title: nextIsActive
					? "Administrator przywrócony"
					: "Administrator dezaktywowany",
			});
		} catch (_error) {
			toast({
				variant: "destructive",
				title: "Nie udało się zmienić uprawnień",
				description: "Spróbuj ponownie za chwilę.",
			});
		} finally {
			setAdminMutationEmail(null);
		}
	};

	const handleCopyInvitationLink = async (token: string) => {
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
			if (isDemoEnvironment) {
				await convex.mutation(api.demo.resetDemoEnvironment, {
					adminAccessToken,
				});
				toast({
					variant: "success",
					title: "Dane demo odtworzone",
					description: "Załadowano fikcyjny zestaw gości i scenariuszy demo.",
				});
				return;
			}

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

	const handleResetRsvpForAllInvitations = async () => {
		if (
			!adminAccessToken ||
			(!isDevelopment && !isDemoEnvironment) ||
			isResettingRsvpData
		) {
			return;
		}
		if (
			typeof window !== "undefined" &&
			!window.confirm(
				isDemoEnvironment
					? "To odtworzy pełny dataset demo (RSVP, Car Pool i Q&A). Kontynuować?"
					: "To wyczyści wszystkie odpowiedzi RSVP i pola logistyczne dla każdego zaproszenia. Kontynuować?",
			)
		) {
			return;
		}

		try {
			setIsResettingRsvpData(true);
			if (isDemoEnvironment) {
				await convex.mutation(api.demo.resetDemoEnvironment, {
					adminAccessToken,
				});
				toast({
					variant: "success",
					title: "Dane demo zresetowane",
					description: "Środowisko demo zostało odtworzone do stanu bazowego.",
				});
				return;
			}

			const resetCount = await resetRsvpForAllInvitations({ adminAccessToken });
			toast({
				variant: "success",
				title: "Dane RSVP zresetowane",
				description: `Przywrócono ${resetCount} zaproszeń do stanu początkowego RSVP.`,
			});
		} catch (_error) {
			toast({
				variant: "destructive",
				title: "Nie udało się zresetować RSVP",
				description: "Spróbuj ponownie za chwilę.",
			});
		} finally {
			setIsResettingRsvpData(false);
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

	const handleToggleAnsweredCard = (questionId: string) => {
		setExpandedAnsweredIds((previous) => ({
			...previous,
			[questionId]: !previous[questionId],
		}));
	};

	const handleAnswerDraftChange = (questionId: string, value: string) => {
		setAnswerDrafts((previous) => ({
			...previous,
			[questionId]: value,
		}));
	};

	return (
		<div className="flex flex-col gap-6">
			<SectionSelector
				sections={adminSections}
				activeSection={activeSection}
				onSelect={setActiveSection}
			/>

			<OverviewSection totals={totals} />

			{activeSection === "admins" && (
				<AdminsSection
					newAdminEmail={newAdminEmail}
					newAdminEmailId={newAdminEmailId}
					adminMutationEmail={adminMutationEmail}
					adminUsers={adminUsers}
					onNewAdminEmailChange={setNewAdminEmail}
					onAddAdmin={handleAddAdmin}
					onSetAdminStatus={handleSetAdminStatus}
				/>
			)}

			{activeSection === "deadlines" && (
				<DeadlinesSection
					deadline={deadline}
					graceDeadline={graceDeadline}
					carpoolDeadline={carpoolDeadline}
					onDeadlineChange={setDeadline}
					onGraceDeadlineChange={setGraceDeadline}
					onCarpoolDeadlineChange={setCarpoolDeadline}
					onSave={handleSaveSettings}
				/>
			)}

			{activeSection === "carpool" && (
				<CarpoolAlertsSection
					mediationAlerts={mediationAlerts}
					pendingCarpoolCount={pendingCarpoolCount}
					onResolveMediation={handleResolveMediation}
				/>
			)}

			{activeSection === "qa" && (
				<QaSection
					qaQuestions={qaQuestions}
					pendingQaCount={pendingQaCount}
					answerDrafts={answerDrafts}
					savingQuestionId={savingQuestionId}
					expandedAnsweredIds={expandedAnsweredIds}
					onToggleAnsweredCard={handleToggleAnsweredCard}
					onAnswerDraftChange={handleAnswerDraftChange}
					onSaveAnswer={handleSaveAnswer}
				/>
			)}

			{activeSection === "arrivals" && (
				<ArrivalsSection invitations={invitations} />
			)}

			{activeSection === "departures" && (
				<DeparturesSection invitations={invitations} />
			)}

			{activeSection === "invitations" && (
				<InvitationsSection
					invitations={invitations}
					onSeedInvitations={handleSeedInvitations}
					onResetRsvpForAllInvitations={handleResetRsvpForAllInvitations}
					showResetRsvpForAllButton={isDevelopment || isDemoEnvironment}
					isResettingRsvpForAll={isResettingRsvpData}
					resetRsvpButtonLabel={
						isDemoEnvironment ? "Reset danych demo" : "Reset RSVP (dev)"
					}
					onRelationChange={handleRelationChange}
					onCopyInvitationLink={handleCopyInvitationLink}
				/>
			)}
		</div>
	);
}

function normalizeChildrenCount(value: number | undefined) {
	if (typeof value !== "number" || !Number.isFinite(value)) return 0;
	return Math.max(0, Math.min(3, Math.trunc(value)));
}
