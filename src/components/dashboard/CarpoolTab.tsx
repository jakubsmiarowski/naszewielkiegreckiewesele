import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useMutation, useQuery } from "convex/react";
import { X } from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";
import type {
	CarpoolAdminOverview,
	CarpoolMyOffer,
	CarpoolOpenOffer,
	CarpoolRequestStatus,
	CarpoolTabData,
	InvitationData,
} from "@/components/dashboard/types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { buildLocalDateTime, parseLocalDateTime } from "@/lib/date-time";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

interface CarpoolTabProps {
	invitationData: InvitationData | null | undefined;
	isAdmin: boolean;
	adminAccessToken?: string | null;
	openCreateOfferToken?: number | null;
}

type OfferDraft = {
	pickupPoint: string;
	dropoffPoint: string;
	departureDateTime: string;
	seatsTotal: string;
	notes: string;
};

type OfferModalMode = "create" | "edit";

type RequestDraft = {
	seatsRequested: number;
	message: string;
	mediationRequested: boolean;
};

const STATUS_LABELS: Record<CarpoolRequestStatus, string> = {
	pending: "Oczekuje",
	accepted: "Zaakceptowane",
	rejected: "Odrzucone",
	cancelled_by_passenger: "Anulowane przez pasażera",
	cancelled_by_driver: "Anulowane przez kierowcę",
	cancelled_system: "Anulowane systemowo",
};

const EMPTY_OFFER_DRAFT: OfferDraft = {
	pickupPoint: "",
	dropoffPoint: "",
	departureDateTime: "",
	seatsTotal: "1",
	notes: "",
};

const createRequestDraft = (seatsRequested = 1): RequestDraft => ({
	seatsRequested,
	message: "",
	mediationRequested: false,
});

export function CarpoolTab({
	invitationData,
	isAdmin,
	adminAccessToken,
	openCreateOfferToken,
}: CarpoolTabProps) {
	const invitationId = invitationData?.invitation?._id;
	const rsvpArrivalDateTime = invitationData?.invitation?.arrivalDateTime;

	const adminOverview = useQuery(
		api.carpool.getAdminCarpoolOverview,
		isAdmin && adminAccessToken ? { adminAccessToken } : "skip",
	) as CarpoolAdminOverview | undefined;
	const carpoolData = useQuery(
		api.carpool.getCarpoolTabData,
		!isAdmin && invitationId
			? { invitationId: invitationId as Id<"invitations"> }
			: "skip",
	) as CarpoolTabData | undefined;

	const createOffer = useMutation(api.carpool.createOffer);
	const updateOffer = useMutation(api.carpool.updateOffer);
	const cancelOffer = useMutation(api.carpool.cancelOffer);
	const createRequest = useMutation(api.carpool.createRequest);
	const respondToRequest = useMutation(api.carpool.respondToRequest);
	const cancelRequest = useMutation(api.carpool.cancelRequest);

	const mediationCheckboxId = useId();

	const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
	const [offerModalMode, setOfferModalMode] =
		useState<OfferModalMode>("create");
	const [editingOfferId, setEditingOfferId] = useState<string | null>(null);
	const [offerDraft, setOfferDraft] = useState<OfferDraft>(EMPTY_OFFER_DRAFT);
	const [offerDate, setOfferDate] = useState<Date | undefined>(undefined);
	const [offerTime, setOfferTime] = useState("");

	// New state for applying to a ride
	const [selectedApplyOffer, setSelectedApplyOffer] =
		useState<CarpoolOpenOffer | null>(null);
	const [applyRequestDraft, setApplyRequestDraft] = useState<RequestDraft>(
		createRequestDraft(1),
	);

	const canMutate = Boolean(carpoolData?.isBeforeDeadline);
	const passengerRequiredSeats = carpoolData?.passengerRequiredSeats ?? 1;
	const passengerSeatLimit = carpoolData?.passengerSeatLimit ?? 1;

	const pendingRequestsCount = useMemo(
		() =>
			adminOverview?.pendingRequests.length ??
			carpoolData?.myRequests.filter((request) => request.status === "pending")
				.length ??
			0,
		[adminOverview?.pendingRequests.length, carpoolData?.myRequests],
	);

	const myAcceptedSeatsTotal = useMemo(
		() =>
			carpoolData?.myOffers.reduce(
				(sum, offer) => sum + offer.seatsAccepted,
				0,
			) ?? 0,
		[carpoolData?.myOffers],
	);

	useEffect(() => {
		setOfferDraft((prev) => ({
			...prev,
			departureDateTime: buildLocalDateTime(offerDate, offerTime),
		}));
	}, [offerDate, offerTime]);

	useEffect(() => {
		if (isAdmin || openCreateOfferToken == null) {
			return;
		}
		const parsed = parseLocalDateTime(rsvpArrivalDateTime);
		const departureDateTime = buildLocalDateTime(parsed.date, parsed.time);
		setOfferModalMode("create");
		setEditingOfferId(null);
		setOfferDraft({
			...EMPTY_OFFER_DRAFT,
			departureDateTime,
		});
		setOfferDate(parsed.date);
		setOfferTime(parsed.time);
		setIsOfferModalOpen(true);
	}, [isAdmin, openCreateOfferToken, rsvpArrivalDateTime]);

	const resetOfferDraft = () => {
		setOfferDraft(EMPTY_OFFER_DRAFT);
		setOfferDate(undefined);
		setOfferTime("");
		setOfferModalMode("create");
		setEditingOfferId(null);
	};

	const openCreateOfferModal = () => {
		const parsed = parseLocalDateTime(rsvpArrivalDateTime);
		const departureDateTime = buildLocalDateTime(parsed.date, parsed.time);
		setOfferModalMode("create");
		setEditingOfferId(null);
		setOfferDraft({
			...EMPTY_OFFER_DRAFT,
			departureDateTime,
		});
		setOfferDate(parsed.date);
		setOfferTime(parsed.time);
		setIsOfferModalOpen(true);
	};

	const openEditOfferModal = (offer: CarpoolMyOffer) => {
		setOfferModalMode("edit");
		setEditingOfferId(offer._id);
		setOfferDraft({
			pickupPoint: offer.pickupPoint ?? "",
			dropoffPoint: offer.dropoffPoint ?? "",
			departureDateTime: offer.departureDateTime,
			seatsTotal: String(offer.seatsTotal),
			notes: offer.notes ?? "",
		});
		const parsed = parseLocalDateTime(offer.departureDateTime);
		setOfferDate(parsed.date);
		setOfferTime(parsed.time);
		setIsOfferModalOpen(true);
	};

	const openApplyModal = (offer: CarpoolOpenOffer) => {
		setSelectedApplyOffer(offer);
		setApplyRequestDraft(createRequestDraft(passengerRequiredSeats));
	};

	const closeApplyModal = () => {
		setSelectedApplyOffer(null);
		setApplyRequestDraft(createRequestDraft(passengerRequiredSeats));
	};

	const handleOfferModalOpenChange = (nextOpen: boolean) => {
		setIsOfferModalOpen(nextOpen);
		if (!nextOpen) {
			resetOfferDraft();
		}
	};

	const handleSubmitOffer = async () => {
		if (!invitationId) return;
		const seatsTotal = Number(offerDraft.seatsTotal);
		if (!offerDraft.departureDateTime) {
			toast({
				variant: "destructive",
				title: "Brak daty i godziny",
				description: "Wybierz datę i godzinę ogłoszenia.",
			});
			return;
		}
		if (!Number.isInteger(seatsTotal) || seatsTotal < 1) {
			toast({
				variant: "destructive",
				title: "Nieprawidłowa liczba miejsc",
				description: "Podaj co najmniej 1 miejsce.",
			});
			return;
		}

		try {
			if (offerModalMode === "create") {
				await createOffer({
					invitationId: invitationId as Id<"invitations">,
					pickupPoint: offerDraft.pickupPoint,
					dropoffPoint: offerDraft.dropoffPoint,
					departureDateTime: offerDraft.departureDateTime,
					seatsTotal,
					notes: offerDraft.notes,
				});
				toast({
					variant: "success",
					title: "Ogłoszenie dodane",
					description: "Ogłoszenie Car Pool zostało opublikowane.",
				});
			} else {
				if (!editingOfferId) return;
				await updateOffer({
					invitationId: invitationId as Id<"invitations">,
					offerId: editingOfferId as Id<"carpoolOffers">,
					pickupPoint: offerDraft.pickupPoint,
					dropoffPoint: offerDraft.dropoffPoint,
					departureDateTime: offerDraft.departureDateTime,
					seatsTotal,
					notes: offerDraft.notes,
				});
				toast({
					variant: "success",
					title: "Ogłoszenie zaktualizowane",
				});
			}
			handleOfferModalOpenChange(false);
		} catch (error) {
			toast({
				variant: "destructive",
				title:
					offerModalMode === "create"
						? "Nie udało się dodać ogłoszenia"
						: "Nie udało się zapisać zmian",
				description:
					error instanceof Error ? error.message : "Spróbuj ponownie.",
			});
		}
	};

	const handleToggleOfferStatus = async (
		offerId: string,
		nextStatus: "open" | "closed",
	) => {
		if (!invitationId) return;
		try {
			await updateOffer({
				invitationId: invitationId as Id<"invitations">,
				offerId: offerId as Id<"carpoolOffers">,
				status: nextStatus,
			});
		} catch (error) {
			toast({
				variant: "destructive",
				title: "Nie udało się zmienić statusu",
				description:
					error instanceof Error ? error.message : "Spróbuj ponownie.",
			});
		}
	};

	const handleCancelOffer = async (offerId: string) => {
		if (!invitationId) return;
		try {
			await cancelOffer({
				invitationId: invitationId as Id<"invitations">,
				offerId: offerId as Id<"carpoolOffers">,
			});
			toast({
				variant: "success",
				title: "Ogłoszenie anulowane",
			});
		} catch (error) {
			toast({
				variant: "destructive",
				title: "Nie udało się anulować ogłoszenia",
				description:
					error instanceof Error ? error.message : "Spróbuj ponownie.",
			});
		}
	};

	const handleRespondToRequest = async (
		requestId: string,
		decision: "accept" | "reject",
	) => {
		if (!invitationId) return;
		try {
			await respondToRequest({
				invitationId: invitationId as Id<"invitations">,
				requestId: requestId as Id<"carpoolRequests">,
				decision,
			});
			toast({
				variant: "success",
				title:
					decision === "accept"
						? "Zgłoszenie zaakceptowane"
						: "Zgłoszenie odrzucone",
			});
		} catch (error) {
			toast({
				variant: "destructive",
				title: "Nie udało się zapisać decyzji",
				description:
					error instanceof Error ? error.message : "Spróbuj ponownie.",
			});
		}
	};

	const handleCreateRequest = async () => {
		if (!invitationId || !selectedApplyOffer) return;
		const seatsRequested = Math.max(applyRequestDraft.seatsRequested, 1);
		try {
			await createRequest({
				invitationId: invitationId as Id<"invitations">,
				offerId: selectedApplyOffer._id as Id<"carpoolOffers">,
				seatsRequested,
				message: applyRequestDraft.message,
				mediationRequested: applyRequestDraft.mediationRequested,
			});
			closeApplyModal();
			toast({
				variant: "success",
				title: "Wysłano zgłoszenie",
			});
		} catch (error) {
			toast({
				variant: "destructive",
				title: "Nie udało się wysłać zgłoszenia",
				description:
					error instanceof Error ? error.message : "Spróbuj ponownie.",
			});
		}
	};

	const handleCancelRequest = async (requestId: string) => {
		if (!invitationId) return;
		try {
			await cancelRequest({
				invitationId: invitationId as Id<"invitations">,
				requestId: requestId as Id<"carpoolRequests">,
			});
			toast({
				variant: "success",
				title: "Zgłoszenie anulowane",
			});
		} catch (error) {
			toast({
				variant: "destructive",
				title: "Nie udało się anulować zgłoszenia",
				description:
					error instanceof Error ? error.message : "Spróbuj ponownie.",
			});
		}
	};

	if (isAdmin) {
		if (!adminOverview) {
			return (
				<div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
					Ładowanie danych car pool...
				</div>
			);
		}

		return (
			<div className="space-y-6">
				<div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
					<h3 className="text-2xl font-bold text-foreground">
						Car Pool (podgląd)
					</h3>
					<p className="text-muted-foreground mt-2">
						Aktywne oferty: {adminOverview.offers.length}. Oczekujące
						zgłoszenia: {pendingRequestsCount}.
					</p>
				</div>
				{/* Admin view implementation kept simple as user asked for UX changes on client side predominantly */}
				<div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
					<h4 className="text-xl font-bold text-foreground mb-4">
						Ogłoszenia Car Pool
					</h4>
					<ul className="space-y-3">
						{adminOverview.offers.map((offer) => (
							<li
								key={offer._id}
								className="rounded-xl bg-[var(--color-background-light)] p-4"
							>
								<p className="font-semibold text-foreground">
									{offer.driverDisplayName}:{" "}
									{formatRoute(offer.pickupPoint, offer.dropoffPoint)}
								</p>
							</li>
						))}
					</ul>
				</div>
			</div>
		);
	}

	if (!invitationId) {
		return (
			<div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
				Brak aktywnego zaproszenia.
			</div>
		);
	}

	if (!carpoolData) {
		return (
			<div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
				Ładowanie danych car pool...
			</div>
		);
	}

	const hasActiveRequest = carpoolData.myRequests.some(
		(req) => req.status === "pending" || req.status === "accepted",
	);

	return (
		<>
			<div className="space-y-6">
				<div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
					<h3 className="text-2xl font-bold text-foreground">Car Pool</h3>
					<p className="text-muted-foreground mt-2">
						Zapisy są aktywne do {formatDateTime(carpoolData.carpoolDeadline)}.
					</p>
					{carpoolData.myOffers.length > 0 && (
						<p className="text-sm text-muted-foreground mt-2">
							Twoje obecne obsadzenie aut: {myAcceptedSeatsTotal} osób.
						</p>
					)}
					{!carpoolData.isBeforeDeadline && (
						<p className="text-sm text-amber-600 mt-3">
							Termin car pool minął. Dane są dostępne tylko do podglądu.
						</p>
					)}
				</div>

				<div className="rounded-2xl border border-border bg-white p-6 shadow-sm space-y-6">
					<div className="flex flex-wrap items-center justify-between gap-3">
						<div>
							<h4 className="text-xl font-bold text-foreground">Ogłoszenia</h4>
							<p className="text-sm text-muted-foreground mt-1">
								Trasa jest opcjonalna. Goście mogą dogadać szczegóły po
								akceptacji zgłoszenia.
							</p>
						</div>
						{carpoolData.canCreateOffer && (
							<Button
								type="button"
								onClick={openCreateOfferModal}
								disabled={!canMutate}
								className="px-4 py-2 rounded-full text-sm font-semibold bg-[var(--color-primary)] text-white disabled:opacity-60"
							>
								Dodaj ogłoszenie
							</Button>
						)}
					</div>

					{!carpoolData.canCreateOffer && (
						<p className="text-muted-foreground text-sm">
							Aby dodać ogłoszenie, włącz opcję "Będę kierowcą" w formularzu
							RSVP (wymaga transportu własnego).
						</p>
					)}

					{carpoolData.myOffers.length === 0 &&
					carpoolData.openOffers.length === 0 ? (
						<p className="text-muted-foreground">Brak ogłoszeń Car Pool.</p>
					) : (
						<div className="space-y-6">
							{/* My Offers Section */}
							{carpoolData.myOffers.length > 0 && (
								<div className="space-y-3">
									<h5 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
										Twoje ogłoszenia
									</h5>
									{carpoolData.myOffers.map((offer) => (
										<div
											key={offer._id}
											className="rounded-xl bg-[var(--color-background-light)] p-4 space-y-3"
										>
											<div className="flex flex-wrap items-start justify-between gap-3">
												<div>
													<p className="font-semibold text-foreground">
														{formatRoute(offer.pickupPoint, offer.dropoffPoint)}
													</p>
													<p className="text-sm text-muted-foreground mt-1">
														Odjazd: {formatDateTime(offer.departureDateTime)}
													</p>
													<p className="text-sm text-muted-foreground">
														Status: {offer.status} | miejsca:{" "}
														{offer.seatsAvailable}/{offer.seatsTotal}
													</p>
												</div>
												<div className="flex flex-wrap gap-2">
													<Button
														type="button"
														onClick={() => openEditOfferModal(offer)}
														disabled={
															!canMutate || offer.status === "cancelled"
														}
														variant="outline"
														className="rounded-full"
													>
														Edytuj
													</Button>
													{offer.status !== "cancelled" && (
														<Button
															type="button"
															onClick={() =>
																handleToggleOfferStatus(
																	offer._id,
																	offer.status === "open" ? "closed" : "open",
																)
															}
															disabled={!canMutate}
															variant="outline"
															className="rounded-full border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 hover:text-[var(--color-primary)]"
														>
															{offer.status === "open" ? "Zamknij" : "Otwórz"}
														</Button>
													)}
													<Button
														type="button"
														onClick={() => handleCancelOffer(offer._id)}
														disabled={
															!canMutate || offer.status === "cancelled"
														}
														variant="outline"
														className="rounded-full border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
													>
														Anuluj
													</Button>
												</div>
											</div>

											<div className="pt-2 border-t border-gray-200">
												<p className="text-sm font-semibold text-foreground mb-2">
													Zgłoszenia pasażerów
												</p>
												{offer.requests.length === 0 ? (
													<p className="text-sm text-muted-foreground">
														Brak zgłoszeń.
													</p>
												) : (
													<ul className="space-y-2">
														{offer.requests.map((request) => (
															<li
																key={request._id}
																className="rounded-lg bg-white px-3 py-3 border border-gray-100"
															>
																<div className="flex items-center justify-between gap-3">
																	<p className="font-medium text-foreground">
																		{request.passengerDisplayName} (miejsca:{" "}
																		{request.seatsRequested})
																	</p>
																	<span className="text-xs text-muted-foreground">
																		{STATUS_LABELS[request.status]}
																	</span>
																</div>
																{request.message && (
																	<p className="text-sm text-muted-foreground mt-1">
																		{request.message}
																	</p>
																)}
																{request.status === "pending" && (
																	<div className="flex gap-2 mt-2">
																		<Button
																			type="button"
																			onClick={() =>
																				handleRespondToRequest(
																					request._id,
																					"accept",
																				)
																			}
																			disabled={!canMutate}
																			className="h-7 rounded-full text-xs bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90"
																		>
																			Akceptuj
																		</Button>
																		<Button
																			type="button"
																			onClick={() =>
																				handleRespondToRequest(
																					request._id,
																					"reject",
																				)
																			}
																			disabled={!canMutate}
																			variant="outline"
																			className="h-7 rounded-full text-xs border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
																		>
																			Odrzuć
																		</Button>
																	</div>
																)}
															</li>
														))}
													</ul>
												)}
											</div>
										</div>
									))}
								</div>
							)}

							{/* Other Offers Section */}
							{carpoolData.openOffers.length > 0 && (
								<div className="space-y-3">
									{/* <h5 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
										Ogłoszenia innych kierowców
									</h5> */}
									<div className="grid grid-cols-1 md:grid-cols-2 items-stretch gap-4">
										{carpoolData.openOffers.map((offer) => {
											const isMyRequest = Boolean(offer.myRequestId);
											const canApply =
												!hasActiveRequest &&
												!isMyRequest &&
												offer.status === "open" &&
												offer.seatsAvailable > 0 &&
												carpoolData.canRequestRide;
											// If I have a request here, I can see it. If not, I can apply only if I don't have other active requests.
											// If I have other active request, I can see this offer but not apply.

											return (
												<button
													type="button"
													key={offer._id}
													className={`h-full w-full rounded-xl border p-4 text-left transition-colors ${
														isMyRequest
															? "bg-[var(--color-primary)]/5 border-[var(--color-primary)]/20"
															: "bg-white border-border hover:border-[var(--color-primary)]/50 cursor-pointer"
													}`}
													onClick={() => {
														if (canApply && !isMyRequest) {
															openApplyModal(offer);
														}
													}}
												>
													<div className="flex justify-between items-start mb-2">
														<p className="font-semibold text-foreground">
															{offer.driverDisplayName}
														</p>
														{isMyRequest && (
															<span className="inline-flex items-center rounded-full bg-[var(--color-primary)] px-2 py-0.5 text-xs font-medium text-white">
																Twoje zgłoszenie
															</span>
														)}
													</div>

													<p className="font-medium text-foreground mb-1">
														{formatRoute(offer.pickupPoint, offer.dropoffPoint)}
													</p>
													<p className="text-sm text-muted-foreground">
														Odjazd: {formatDateTime(offer.departureDateTime)}
													</p>
													<p className="text-sm text-muted-foreground">
														Wolne miejsca: {offer.seatsAvailable}/
														{offer.seatsTotal}
													</p>

													{offer.notes && (
														<p className="text-sm text-muted-foreground mt-2 italic">
															"{offer.notes}"
														</p>
													)}

													<div
														className={`mt-auto pt-3 ${
															isMyRequest
																? "border-t border-[var(--color-primary)]/20"
																: "border-t border-border/60"
														}`}
													>
														{isMyRequest && offer.myRequestId ? (
															<>
																<p className="text-sm text-foreground">
																	Status:{" "}
																	<span className="font-medium">
																		{offer.myRequestStatus
																			? STATUS_LABELS[offer.myRequestStatus]
																			: "-"}
																	</span>
																</p>
																{offer.myRequestStatus === "pending" && (
																	<Button
																		type="button"
																		variant="link"
																		onClick={(e) => {
																			e.stopPropagation();
																			if (offer.myRequestId) {
																				handleCancelRequest(offer.myRequestId);
																			}
																		}}
																		className="mt-2 h-auto p-0 text-xs font-semibold text-red-600 hover:no-underline"
																	>
																		Anuluj zgłoszenie
																	</Button>
																)}
															</>
														) : canApply ? (
															<Button
																type="button"
																disabled={!canApply}
																onClick={(e) => {
																	e.stopPropagation();
																	openApplyModal(offer);
																}}
																className="w-full rounded-full bg-[var(--color-primary)] text-white hover:opacity-90 disabled:opacity-50"
															>
																Zgłoś się
															</Button>
														) : (
															<p className="text-xs text-muted-foreground">
																{hasActiveRequest
																	? "Masz już aktywne zgłoszenie do innej oferty."
																	: "Ta oferta jest obecnie niedostępna."}
															</p>
														)}
													</div>
												</button>
											);
										})}
									</div>
								</div>
							)}
						</div>
					)}
				</div>
			</div>

			{/* Apply Modal */}
			<DialogPrimitive.Root
				open={Boolean(selectedApplyOffer)}
				onOpenChange={(open) => {
					if (!open) closeApplyModal();
				}}
			>
				<DialogPrimitive.Portal>
					<DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
					<DialogPrimitive.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg">
						{selectedApplyOffer && (
							<>
								<div className="flex flex-col space-y-1.5 text-center sm:text-left">
									<h2 className="text-lg font-semibold leading-none tracking-tight">
										Zgłoś się do przejazdu
									</h2>
									<p className="text-sm text-muted-foreground">
										Kierowca: {selectedApplyOffer.driverDisplayName}
									</p>
								</div>

								<div className="grid gap-4 py-4">
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										<div className="space-y-2">
											<label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
												Liczba miejsc
											</label>
											<Input
												type="number"
												min={1}
												max={Math.min(
													passengerSeatLimit,
													selectedApplyOffer.seatsAvailable,
												)}
												value={applyRequestDraft.seatsRequested}
												onChange={(e) =>
													setApplyRequestDraft((prev) => ({
														...prev,
														seatsRequested: Number(e.target.value),
													}))
												}
											/>
										</div>
										<div className="flex items-center space-x-2 pt-6">
											<Checkbox
												id={mediationCheckboxId}
												checked={applyRequestDraft.mediationRequested}
												onCheckedChange={(checked) =>
													setApplyRequestDraft((prev) => ({
														...prev,
														mediationRequested: checked as boolean,
													}))
												}
											/>
											<label
												htmlFor="mediation"
												className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
											>
												Potrzebuję pomocy
											</label>
										</div>
									</div>
									<div className="space-y-2">
										<label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
											Wiadomość do kierowcy (opcjonalnie)
										</label>
										<textarea
											className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
											value={applyRequestDraft.message}
											onChange={(e) =>
												setApplyRequestDraft((prev) => ({
													...prev,
													message: e.target.value,
												}))
											}
										/>
									</div>
								</div>

								<div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
									<Button
										type="button"
										onClick={closeApplyModal}
										variant="outline"
										className="mt-2 sm:mt-0"
									>
										Anuluj
									</Button>
									<Button
										type="button"
										onClick={handleCreateRequest}
										className="bg-[var(--color-primary)] text-white hover:opacity-90"
									>
										Wyślij zgłoszenie
									</Button>
								</div>
								<DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
									<X className="h-4 w-4" />
									<span className="sr-only">Close</span>
								</DialogPrimitive.Close>
							</>
						)}
					</DialogPrimitive.Content>
				</DialogPrimitive.Portal>
			</DialogPrimitive.Root>

			<DialogPrimitive.Root
				open={isOfferModalOpen}
				onOpenChange={handleOfferModalOpenChange}
			>
				<DialogPrimitive.Portal>
					<DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
					<DialogPrimitive.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg">
						<div className="flex flex-col space-y-1.5 text-center sm:text-left">
							<h2 className="text-lg font-semibold leading-none tracking-tight">
								{offerModalMode === "create"
									? "Dodaj ogłoszenie"
									: "Edytuj ogłoszenie"}
							</h2>
							<p className="text-sm text-muted-foreground">
								Szczegóły przejazdu.
							</p>
						</div>

						<div className="my-4 space-y-4">
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<label
										htmlFor="pickup"
										className="text-sm font-medium leading-none"
									>
										Skąd
									</label>
									<Input
										id="pickup"
										placeholder="np. Lotnisko Chania"
										value={offerDraft.pickupPoint}
										onChange={(e) =>
											setOfferDraft((prev) => ({
												...prev,
												pickupPoint: e.target.value,
											}))
										}
									/>
								</div>
								<div className="space-y-2">
									<label
										htmlFor="dropoff"
										className="text-sm font-medium leading-none"
									>
										Dokąd
									</label>
									<Input
										id="dropoff"
										placeholder="np. Hotel"
										value={offerDraft.dropoffPoint}
										onChange={(e) =>
											setOfferDraft((prev) => ({
												...prev,
												dropoffPoint: e.target.value,
											}))
										}
									/>
								</div>
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<label className="text-sm font-medium leading-none">
										Data
									</label>
									<DatePicker
										value={offerDate}
										onChange={setOfferDate}
										className="w-full"
									/>
								</div>
								<div className="space-y-2">
									<label
										htmlFor="time"
										className="text-sm font-medium leading-none"
									>
										Godzina
									</label>
									<Input
										id="time"
										type="time"
										value={offerTime}
										onChange={(e) => setOfferTime(e.target.value)}
									/>
								</div>
							</div>
							<div className="space-y-2">
								<label
									htmlFor="seats"
									className="text-sm font-medium leading-none"
								>
									Liczba miejsc
								</label>
								<Input
									id="seats"
									type="number"
									min={1}
									max={8}
									value={offerDraft.seatsTotal}
									onChange={(e) =>
										setOfferDraft((prev) => ({
											...prev,
											seatsTotal: e.target.value,
										}))
									}
								/>
							</div>
							<div className="space-y-2">
								<label
									htmlFor="notes"
									className="text-sm font-medium leading-none"
								>
									Notatki
								</label>
								<textarea
									id="notes"
									className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
									placeholder="Dodatkowe informacje..."
									value={offerDraft.notes}
									onChange={(e) =>
										setOfferDraft((prev) => ({
											...prev,
											notes: e.target.value,
										}))
									}
								/>
							</div>
						</div>

						<div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
							<Button
								type="button"
								variant="outline"
								onClick={() => handleOfferModalOpenChange(false)}
								className="mt-2 sm:mt-0"
							>
								Anuluj
							</Button>
							<Button
								type="button"
								onClick={handleSubmitOffer}
								className="bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary)]/90"
							>
								Zapisz
							</Button>
						</div>
						<DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
							<X className="h-4 w-4" />
							<span className="sr-only">Close</span>
						</DialogPrimitive.Close>
					</DialogPrimitive.Content>
				</DialogPrimitive.Portal>
			</DialogPrimitive.Root>
		</>
	);
}

function formatRoute(
	pickup: string | null | undefined,
	dropoff: string | null | undefined,
) {
	const p = pickup?.trim() || "Start";
	const d = dropoff?.trim() || "Cel";
	return `${p} ➝ ${d}`;
}

function formatDateTime(iso: string | null | undefined) {
	if (!iso) return "-";
	try {
		const date = new Date(iso);
		return date.toLocaleString("pl-PL", {
			day: "numeric",
			month: "short",
			hour: "2-digit",
			minute: "2-digit",
		});
	} catch {
		return iso;
	}
}
