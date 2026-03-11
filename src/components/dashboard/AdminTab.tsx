import { useMutation, useQuery } from "convex/react";
import { useEffect, useId, useMemo, useState } from "react";
import { getInvitationAttendanceStats } from "@/components/dashboard/admin/helpers";
import { SectionSelector } from "@/components/dashboard/admin/SectionSelector";
import { AdminsSection } from "@/components/dashboard/admin/sections/AdminsSection";
import { ArrivalsSection } from "@/components/dashboard/admin/sections/ArrivalsSection";
import { CarpoolAlertsSection } from "@/components/dashboard/admin/sections/CarpoolAlertsSection";
import { DeadlinesSection } from "@/components/dashboard/admin/sections/DeadlinesSection";
import { DeparturesSection } from "@/components/dashboard/admin/sections/DeparturesSection";
import { ErrorsSection } from "@/components/dashboard/admin/sections/ErrorsSection";
import { InvitationsSection } from "@/components/dashboard/admin/sections/InvitationsSection";
import { OverviewSection } from "@/components/dashboard/admin/sections/OverviewSection";
import { QaSection } from "@/components/dashboard/admin/sections/QaSection";
import type {
	AdminSectionId,
	AdminSectionMeta,
	AdminUserRecord,
} from "@/components/dashboard/admin/types";
import type {
	AdminErrorEvent,
	AdminErrorEventDetail,
	AdminInvitation,
	CarpoolMediationAlert,
	ClientTelemetryKind,
	ErrorEventStatus,
	QaAdminQuestion,
	RsvpSettings,
} from "@/components/dashboard/types";
import { toast } from "@/components/ui/use-toast";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

interface AdminTabProps {
	invitations: AdminInvitation[];
	settings: RsvpSettings | null | undefined;
	adminAccessToken: string | null;
	mediationAlerts?: CarpoolMediationAlert[];
	qaQuestions?: QaAdminQuestion[];
	errorEvents?: AdminErrorEvent[];
}

const ALL_ERROR_FILTER = "__all__";

export function AdminTab({
	invitations,
	settings,
	adminAccessToken,
	mediationAlerts,
	qaQuestions,
	errorEvents,
}: AdminTabProps) {
	const updateRelation = useMutation(api.guests.updateGuestRelation);
	const updateSettings = useMutation(api.settings.updateRsvpSettings);
	const resolveMediationAlert = useMutation(api.carpool.resolveMediationAlert);
	const answerQuestion = useMutation(api.questions.answerQuestion);
	const addAdmin = useMutation(api.adminUsers.addAdmin);
	const setAdminStatus = useMutation(api.adminUsers.setAdminStatus);
	const setErrorEventStatus = useMutation(api.telemetry.setErrorStatus);
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
	const [savingQuestionId, setSavingQuestionId] = useState<string | null>(null);
	const [expandedAnsweredIds, setExpandedAnsweredIds] = useState<
		Record<string, boolean>
	>({});
	const [activeSection, setActiveSection] = useState<AdminSectionId>("admins");
	const [selectedErrorId, setSelectedErrorId] = useState<string | null>(null);
	const [statusMutationId, setStatusMutationId] = useState<string | null>(null);
	const [errorStatusFilter, setErrorStatusFilter] = useState<
		ErrorEventStatus | typeof ALL_ERROR_FILTER
	>(ALL_ERROR_FILTER);
	const [errorKindFilter, setErrorKindFilter] = useState<
		ClientTelemetryKind | typeof ALL_ERROR_FILTER
	>(ALL_ERROR_FILTER);
	const [errorRouteFilter, setErrorRouteFilter] = useState(ALL_ERROR_FILTER);
	const newAdminEmailId = useId();
	const selectedErrorEvent = useQuery(
		api.telemetry.getErrorEvent,
		adminAccessToken && selectedErrorId
			? {
					adminAccessToken,
					errorEventId: selectedErrorId as Id<"errorEvents">,
				}
			: "skip",
	) as AdminErrorEventDetail | null | undefined;

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
	const pendingErrorCount = useMemo(() => {
		if (!errorEvents) return 0;
		return errorEvents.filter((item) => item.status === "new").length;
	}, [errorEvents]);
	const pendingCarpoolCount = mediationAlerts?.length ?? 0;
	const availableErrorRoutes = useMemo(() => {
		if (!errorEvents) return [];
		return Array.from(
			new Set(
				errorEvents
					.map((item) => item.lastRoute?.trim())
					.filter((route): route is string => Boolean(route)),
			),
		).sort((a, b) => a.localeCompare(b));
	}, [errorEvents]);
	const filteredErrorEvents = useMemo(() => {
		if (!errorEvents) return undefined;
		return errorEvents.filter((item) => {
			if (errorStatusFilter !== ALL_ERROR_FILTER) {
				if (item.status !== errorStatusFilter) return false;
			}
			if (errorKindFilter !== ALL_ERROR_FILTER) {
				if (item.kind !== errorKindFilter) return false;
			}
			if (errorRouteFilter !== ALL_ERROR_FILTER) {
				if ((item.lastRoute ?? "") !== errorRouteFilter) return false;
			}
			return true;
		});
	}, [errorEvents, errorKindFilter, errorRouteFilter, errorStatusFilter]);

	useEffect(() => {
		if (!filteredErrorEvents || filteredErrorEvents.length === 0) {
			if (selectedErrorId !== null) {
				setSelectedErrorId(null);
			}
			return;
		}

		const isSelectedStillVisible = filteredErrorEvents.some(
			(item) => item._id === selectedErrorId,
		);
		if (!isSelectedStillVisible) {
			setSelectedErrorId(filteredErrorEvents[0]?._id ?? null);
		}
	}, [filteredErrorEvents, selectedErrorId]);

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
				id: "errors",
				title: "Błędy aplikacji",
				description: "Crashe klienta, błędy RSVP i unhandled promise.",
				pendingCount: pendingErrorCount,
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
		[pendingCarpoolCount, pendingErrorCount, pendingQaCount],
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

	const handleSetErrorStatus = async (status: ErrorEventStatus) => {
		if (!adminAccessToken || !selectedErrorId) return;
		try {
			setStatusMutationId(selectedErrorId);
			await setErrorEventStatus({
				adminAccessToken,
				errorEventId: selectedErrorId as Id<"errorEvents">,
				status,
			});
			toast({
				variant: "success",
				title: "Status błędu zapisany",
			});
		} catch (_error) {
			toast({
				variant: "destructive",
				title: "Nie udało się zmienić statusu błędu",
				description: "Spróbuj ponownie za chwilę.",
			});
		} finally {
			setStatusMutationId(null);
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

			{activeSection === "errors" && (
				<ErrorsSection
					errorEvents={filteredErrorEvents}
					selectedErrorId={selectedErrorId}
					selectedError={selectedErrorEvent ?? null}
					newErrorCount={pendingErrorCount}
					statusFilter={errorStatusFilter}
					kindFilter={errorKindFilter}
					routeFilter={errorRouteFilter}
					availableRoutes={availableErrorRoutes}
					statusMutationId={statusMutationId}
					onStatusFilterChange={setErrorStatusFilter}
					onKindFilterChange={setErrorKindFilter}
					onRouteFilterChange={setErrorRouteFilter}
					onSelectError={setSelectedErrorId}
					onSetErrorStatus={handleSetErrorStatus}
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
