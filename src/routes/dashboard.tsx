import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { useEffect, useMemo, useState } from "react";
import { AdminTab } from "@/components/dashboard/AdminTab";
import { importWeddingEventToCalendar } from "@/components/dashboard/buildIcsFile";
import { CarpoolTab } from "@/components/dashboard/CarpoolTab";
import { DashboardGreetingCard } from "@/components/dashboard/DashboardGreetingCard";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { HeroSection } from "@/components/dashboard/HeroSection";
import { InfoTabContent } from "@/components/dashboard/InfoTabContent";
import { RsvpTab } from "@/components/dashboard/RsvpTab";
import {
	DeadlineCountdownWidget,
	DogSlideshowWidget,
	EmergencyContactsWidget,
	EventCountdownWidget,
	GreekPhrasesWidget,
} from "@/components/dashboard/SidebarWidgets";
import type {
	AttractionAnchorId,
	CarpoolMediationAlert,
	MainTabId,
	QaAdminQuestion,
} from "@/components/dashboard/types";
import { authClient } from "@/lib/auth-client";
import { buildGreeting } from "@/lib/greetings";
import { useInvitationSession } from "@/lib/invitation-session";
import { useRsvpStats } from "@/lib/rsvp-helpers";
import { WEDDING_EVENT } from "@/lib/wedding-event";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

export const Route = createFileRoute("/dashboard")({
	component: DashboardPage,
});

const ADMIN_TABS: MainTabId[] = [
	"Admin",
	"Car Pool",
	"Plan zabawy",
	"Logistyka",
	"Atrakcje",
	"Q&A",
];
const GUEST_TABS: MainTabId[] = [
	"RSVP",
	"Car Pool",
	"Plan zabawy",
	"Logistyka",
	"Atrakcje",
	"Q&A",
];

function DashboardPage() {
	const navigate = useNavigate();
	const { invitationId, isLoading: isSessionLoading } = useInvitationSession();
	const { data: adminSession, isPending: isAdminPending } =
		authClient.useSession();
	const adminEmail = adminSession?.user?.email ?? null;
	const [adminAccessToken, setAdminAccessToken] = useState<string | null>(null);
	const [isAdminTokenLoading, setIsAdminTokenLoading] = useState(false);
	const [hasCheckedAdminAccess, setHasCheckedAdminAccess] = useState(false);
	const [adminAccessError, setAdminAccessError] = useState<string | null>(null);
	const isAdmin = Boolean(adminAccessToken);

	const invitationData = useQuery(
		api.invitations.getById,
		invitationId ? { invitationId: invitationId as Id<"invitations"> } : "skip",
	);
	const { hasResponded, hasAnyAttending } = useRsvpStats(invitationData);
	const adminInvitations = useQuery(
		api.invitations.listForAdmin,
		adminAccessToken ? { adminAccessToken } : "skip",
	);
	const settings = useQuery(api.settings.getRsvpSettings, {});
	const mediationAlerts = useQuery(
		api.carpool.listMediationAlertsForAdmin,
		adminAccessToken ? { adminAccessToken } : "skip",
	) as CarpoolMediationAlert[] | undefined;
	const qaQuestions = useQuery(
		api.questions.listForAdmin,
		adminAccessToken ? { adminAccessToken } : "skip",
	) as QaAdminQuestion[] | undefined;

	const [activeTab, setActiveTab] = useState<MainTabId>("RSVP");
	const [focusAttractionId, setFocusAttractionId] =
		useState<AttractionAnchorId | null>(null);
	const [openCarpoolCreateToken, setOpenCarpoolCreateToken] = useState<
		number | null
	>(null);

	useEffect(() => {
		if (isAdmin && activeTab === "RSVP") {
			setActiveTab("Admin");
			return;
		}
		if (!isAdmin && activeTab === "Admin") {
			setActiveTab("RSVP");
		}
	}, [activeTab, isAdmin]);

	useEffect(() => {
		if (isAdminPending) {
			return;
		}

		if (
			!isSessionLoading &&
			!isAdminPending &&
			!isAdminTokenLoading &&
			(adminEmail ? hasCheckedAdminAccess : true) &&
			!adminEmail &&
			!invitationId &&
			!isAdmin
		) {
			navigate({ to: "/" });
		}
	}, [
		invitationId,
		isAdmin,
		isAdminPending,
		isAdminTokenLoading,
		hasCheckedAdminAccess,
		adminEmail,
		isSessionLoading,
		navigate,
	]);

	useEffect(() => {
		if (isAdminPending) {
			return;
		}

		if (!adminEmail) {
			setAdminAccessToken(null);
			setIsAdminTokenLoading(false);
			setHasCheckedAdminAccess(true);
			setAdminAccessError(null);
			return;
		}

		let isCancelled = false;
		const loadAdminSession = async () => {
			setIsAdminTokenLoading(true);
			setHasCheckedAdminAccess(false);
			setAdminAccessError(null);
			try {
				const response = await fetch("/api/admin/session");
				if (!response.ok) {
					const data = (await response
						.json()
						.catch(() => ({ error: "forbidden" }))) as { error?: string };
					throw new Error(data.error ?? "forbidden");
				}
				const data = (await response.json()) as { adminAccessToken?: string };
				if (!isCancelled) {
					setAdminAccessToken(data.adminAccessToken ?? null);
				}
			} catch (error) {
				if (!isCancelled) {
					setAdminAccessToken(null);
					setAdminAccessError(
						error instanceof Error
							? error.message
							: "failed_to_load_admin_access",
					);
				}
			} finally {
				if (!isCancelled) {
					setIsAdminTokenLoading(false);
					setHasCheckedAdminAccess(true);
				}
			}
		};

		loadAdminSession();
		return () => {
			isCancelled = true;
		};
	}, [adminEmail, isAdminPending]);

	const greeting = useMemo(() => {
		if (!invitationData?.guests) return "Cześć!";
		return buildGreeting(invitationData.guests);
	}, [invitationData?.guests]);

	const tabs = useMemo(() => {
		return isAdmin ? ADMIN_TABS : GUEST_TABS;
	}, [isAdmin]);
	const pendingQaCount = useMemo(() => {
		if (!qaQuestions) return 0;
		return qaQuestions.filter((item) => item.status === "pending").length;
	}, [qaQuestions]);
	const adminActionCount = (mediationAlerts?.length ?? 0) + pendingQaCount;

	const eventDate = useMemo(() => new Date(WEDDING_EVENT.startIso), []);
	const deadlineDate = useMemo(() => {
		const fallback = new Date("2026-02-28T23:59");
		if (!settings) return fallback;
		const parsed = new Date(settings.rsvpDeadline);
		return Number.isNaN(parsed.getTime()) ? fallback : parsed;
	}, [settings]);

	const handleAddToCalendar = async () => {
		await importWeddingEventToCalendar();
	};

	const handleOpenAttraction = (anchorId: AttractionAnchorId) => {
		setFocusAttractionId(anchorId);
		setActiveTab("Atrakcje");
	};

	const handleGoToCarpool = (options?: { openCreateModal?: boolean }) => {
		setActiveTab("Car Pool");
		if (options?.openCreateModal) {
			setOpenCarpoolCreateToken(Date.now());
		}
	};

	if (isSessionLoading || isAdminPending) {
		return (
			<div className="flex items-center justify-center min-h-screen bg-[var(--color-background-light)]">
				<div className="flex flex-col items-center gap-4">
					<div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-[var(--color-primary)]" />
					<p className="text-gray-500 font-medium">Ładowanie...</p>
				</div>
			</div>
		);
	}

	if (adminEmail && (isAdminTokenLoading || !hasCheckedAdminAccess)) {
		return (
			<div className="flex items-center justify-center min-h-screen bg-[var(--color-background-light)]">
				<div className="flex flex-col items-center gap-4">
					<div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-[var(--color-primary)]" />
					<p className="text-gray-500 font-medium">Weryfikacja uprawnień...</p>
				</div>
			</div>
		);
	}

	if (adminEmail && hasCheckedAdminAccess && !isAdmin) {
		return (
			<div className="flex items-center justify-center min-h-screen bg-[var(--color-background-light)] px-4">
				<div className="w-full max-w-2xl rounded-2xl border border-border bg-white p-6 shadow-sm space-y-3">
					<h2 className="text-xl font-bold text-foreground">
						Brak dostępu administratora
					</h2>
					<p className="text-sm text-muted-foreground">
						Twoja sesja logowania działa, ale backend nie przyznał tokenu
						administratora.
					</p>
					<p className="text-sm text-muted-foreground">
						Sprawdź `GET /api/admin/session` w Network (status + payload) oraz
						czy użytkownik istnieje jako aktywny admin w Convex.
					</p>
					<p className="text-xs text-muted-foreground">
						Szczegóły: {adminAccessError ?? "forbidden"}
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="w-full bg-background min-h-screen">
			<HeroSection />
			<div className="w-full max-w-7xl px-4 md:px-8 py-12 flex flex-col lg:flex-row gap-12 mx-auto">
				<div className="flex-1 flex flex-col gap-8">
					<DashboardGreetingCard greeting={greeting} />

					<FilterBar
						filtersOverride={tabs}
						activeFilter={activeTab}
						onSelect={(label) => setActiveTab(label as MainTabId)}
						badges={isAdmin ? { Admin: adminActionCount } : undefined}
						showCarpoolTab={
							invitationData?.invitation.carpoolDriverOptIn ||
							(hasResponded && hasAnyAttending)
						}
					/>

					{activeTab === "RSVP" && (
						<RsvpTab
							invitationData={invitationData}
							settings={settings}
							onGoToCarpool={handleGoToCarpool}
						/>
					)}
					{activeTab === "Car Pool" &&
						(invitationData?.invitation.carpoolDriverOptIn ||
							(hasResponded && hasAnyAttending)) && (
							<CarpoolTab
								invitationData={invitationData}
								isAdmin={isAdmin}
								adminAccessToken={adminAccessToken}
								openCreateOfferToken={openCarpoolCreateToken}
							/>
						)}
					{activeTab === "Admin" && isAdmin && (
						<AdminTab
							invitations={adminInvitations ?? []}
							settings={settings}
							adminAccessToken={adminAccessToken}
							mediationAlerts={mediationAlerts}
							qaQuestions={qaQuestions}
						/>
					)}
					{activeTab !== "RSVP" &&
						activeTab !== "Admin" &&
						activeTab !== "Car Pool" && (
							<InfoTabContent
								activeTab={activeTab}
								invitationId={invitationData?.invitation._id}
								focusAttractionId={focusAttractionId}
								onAttractionFocused={() => setFocusAttractionId(null)}
								onOpenAttraction={handleOpenAttraction}
							/>
						)}
				</div>

				<aside className="w-full lg:w-80 flex flex-col gap-8">
					<EventCountdownWidget
						eventDate={eventDate}
						onAddToCalendar={handleAddToCalendar}
					/>
					<DeadlineCountdownWidget deadline={deadlineDate} />
					<EmergencyContactsWidget />
					<GreekPhrasesWidget />
					<DogSlideshowWidget />
				</aside>
			</div>
		</div>
	);
}
