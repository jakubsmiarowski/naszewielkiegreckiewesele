import { useMutation, useQuery } from "convex/react";
import { Dialog } from "radix-ui";
import { useEffect, useMemo, useState } from "react";
import type {
	CarpoolAdminOverview,
	CarpoolMyOffer,
	CarpoolRequestStatus,
	CarpoolTabData,
	InvitationData,
} from "@/components/dashboard/types";
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

const OFFER_PICKUP_INPUT_ID = "carpool-offer-pickup";
const OFFER_DROPOFF_INPUT_ID = "carpool-offer-dropoff";
const OFFER_DEPARTURE_DATE_ID = "carpool-offer-departure-date";
const OFFER_SEATS_INPUT_ID = "carpool-offer-seats";
const OFFER_NOTES_INPUT_ID = "carpool-offer-notes";

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

	const [requestDrafts, setRequestDrafts] = useState<
		Record<string, RequestDraft>
	>({});
	const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
	const [offerModalMode, setOfferModalMode] =
		useState<OfferModalMode>("create");
	const [editingOfferId, setEditingOfferId] = useState<string | null>(null);
	const [offerDraft, setOfferDraft] = useState<OfferDraft>(EMPTY_OFFER_DRAFT);
	const [offerDate, setOfferDate] = useState<Date | undefined>(undefined);
	const [offerTime, setOfferTime] = useState("");

	const canMutate = Boolean(carpoolData?.isBeforeDeadline);
	const passengerRequiredSeats = carpoolData?.passengerRequiredSeats ?? 1;
	const passengerSeatLimit = carpoolData?.passengerSeatLimit ?? 1;
	const canCreateOffer = Boolean(carpoolData?.canCreateOffer && canMutate);

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

	const handleCreateRequest = async (offerId: string) => {
		if (!invitationId) return;
		const draft =
			requestDrafts[offerId] ?? createRequestDraft(passengerRequiredSeats);
		const seatsRequested = Math.max(draft.seatsRequested, 1);
		try {
			await createRequest({
				invitationId: invitationId as Id<"invitations">,
				offerId: offerId as Id<"carpoolOffers">,
				seatsRequested,
				message: draft.message,
				mediationRequested: draft.mediationRequested,
			});
			setRequestDrafts((prev) => ({
				...prev,
				[offerId]: createRequestDraft(passengerRequiredSeats),
			}));
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

				<div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
					<h4 className="text-xl font-bold text-foreground mb-4">
						Ogłoszenia Car Pool
					</h4>
					{adminOverview.offers.length === 0 ? (
						<p className="text-muted-foreground">Brak ogłoszeń.</p>
					) : (
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
									<p className="text-sm text-muted-foreground mt-1">
										Odjazd: {formatDateTime(offer.departureDateTime)} | status:{" "}
										{offer.status} | miejsca: {offer.seatsAvailable}/
										{offer.seatsTotal}
									</p>
									<p className="text-sm text-muted-foreground">
										Przylot kierowcy:{" "}
										{formatDateTime(offer.driverArrivalDateTime)}
									</p>
								</li>
							))}
						</ul>
					)}
				</div>

				<div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
					<h4 className="text-xl font-bold text-foreground mb-4">
						Oczekujące zgłoszenia
					</h4>
					{adminOverview.pendingRequests.length === 0 ? (
						<p className="text-muted-foreground">Brak oczekujących zgłoszeń.</p>
					) : (
						<ul className="space-y-2">
							{adminOverview.pendingRequests.map((request) => (
								<li
									key={request._id}
									className="rounded-lg bg-[var(--color-background-light)] px-4 py-3"
								>
									<p className="font-medium text-foreground">
										{request.passengerDisplayName} (miejsca:{" "}
										{request.seatsRequested})
									</p>
								</li>
							))}
						</ul>
					)}
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
							<button
								type="button"
								onClick={openCreateOfferModal}
								disabled={!canMutate}
								className="px-4 py-2 rounded-full text-sm font-semibold bg-[var(--color-primary)] text-white disabled:opacity-60"
							>
								Dodaj ogłoszenie
							</button>
						)}
					</div>

					{!carpoolData.canCreateOffer && (
						<p className="text-muted-foreground text-sm">
							Aby dodać ogłoszenie, ustaw RSVP = tak, transport = wypożyczamy
							auto i włącz Car Pool w formularzu RSVP.
						</p>
					)}

					{carpoolData.myOffers.length === 0 &&
					carpoolData.openOffers.length === 0 ? (
						<p className="text-muted-foreground">Brak ogłoszeń Car Pool.</p>
					) : (
						<div className="space-y-6">
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
													<button
														type="button"
														onClick={() => openEditOfferModal(offer)}
														disabled={
															!canMutate || offer.status === "cancelled"
														}
														className="px-4 py-2 rounded-full text-sm font-semibold border border-gray-300 text-gray-700 disabled:opacity-60"
													>
														Edytuj
													</button>
													{offer.status !== "cancelled" && (
														<button
															type="button"
															onClick={() =>
																handleToggleOfferStatus(
																	offer._id,
																	offer.status === "open" ? "closed" : "open",
																)
															}
															disabled={!canMutate}
															className="px-4 py-2 rounded-full text-sm font-semibold border border-[var(--color-primary)] text-[var(--color-primary)] disabled:opacity-60"
														>
															{offer.status === "open" ? "Zamknij" : "Otwórz"}
														</button>
													)}
													<button
														type="button"
														onClick={() => handleCancelOffer(offer._id)}
														disabled={
															!canMutate || offer.status === "cancelled"
														}
														className="px-4 py-2 rounded-full text-sm font-semibold border border-red-300 text-red-600 disabled:opacity-60"
													>
														Anuluj
													</button>
												</div>
											</div>

											{offer.notes && (
												<p className="text-sm text-muted-foreground">
													{offer.notes}
												</p>
											)}

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
																		<button
																			type="button"
																			onClick={() =>
																				handleRespondToRequest(
																					request._id,
																					"accept",
																				)
																			}
																			disabled={!canMutate}
																			className="px-3 py-1.5 rounded-full text-xs font-semibold bg-[var(--color-primary)] text-white disabled:opacity-60"
																		>
																			Akceptuj
																		</button>
																		<button
																			type="button"
																			onClick={() =>
																				handleRespondToRequest(
																					request._id,
																					"reject",
																				)
																			}
																			disabled={!canMutate}
																			className="px-3 py-1.5 rounded-full text-xs font-semibold border border-red-300 text-red-600 disabled:opacity-60"
																		>
																			Odrzuć
																		</button>
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

							{carpoolData.openOffers.length > 0 && (
								<div className="space-y-3">
									<h5 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
										Ogłoszenia innych kierowców
									</h5>
									{carpoolData.openOffers.map((offer) => {
										const draft =
											requestDrafts[offer._id] ??
											createRequestDraft(passengerRequiredSeats);
										const maxRequestSeats = Math.min(
											passengerSeatLimit,
											offer.seatsAvailable,
										);
										const seatsRequestedValue = Math.max(
											1,
											Math.min(
												draft.seatsRequested,
												Math.max(maxRequestSeats, 1),
											),
										);
										const canSendRequest =
											carpoolData.canRequestRide &&
											carpoolData.isBeforeDeadline &&
											offer.status === "open" &&
											offer.seatsAvailable > 0 &&
											!offer.myRequestId &&
											!carpoolData.hasPendingRequest;

										return (
											<div
												key={offer._id}
												className="rounded-xl bg-[var(--color-background-light)] p-4 space-y-2"
											>
												<p className="font-semibold text-foreground">
													{offer.driverDisplayName}:{" "}
													{formatRoute(offer.pickupPoint, offer.dropoffPoint)}
												</p>
												<p className="text-sm text-muted-foreground">
													Odjazd: {formatDateTime(offer.departureDateTime)} |
													wolne miejsca: {offer.seatsAvailable}/
													{offer.seatsTotal}
												</p>
												<p className="text-sm text-muted-foreground">
													Przylot kierowcy:{" "}
													{formatDateTime(offer.driverArrivalDateTime)}
												</p>
												{offer.notes && (
													<p className="text-sm text-muted-foreground">
														{offer.notes}
													</p>
												)}

												{offer.myRequestId ? (
													<p className="text-sm text-muted-foreground">
														Twoje zgłoszenie: {offer.myRequestSeats} miejsca,
														status{" "}
														{offer.myRequestStatus
															? STATUS_LABELS[offer.myRequestStatus]
															: "-"}
													</p>
												) : (
													<div className="space-y-2 pt-1">
														<div className="grid grid-cols-1 md:grid-cols-2 gap-2">
															<Input
																type="number"
																min={1}
																max={maxRequestSeats}
																value={seatsRequestedValue}
																onChange={(event) => {
																	const nextSeats = Number(event.target.value);
																	setRequestDrafts((prev) => ({
																		...prev,
																		[offer._id]: {
																			...draft,
																			seatsRequested:
																				Number.isFinite(nextSeats) &&
																				nextSeats > 0
																					? nextSeats
																					: 1,
																		},
																	}));
																}}
																disabled={!canSendRequest}
															/>
															<label className="flex items-center gap-2 text-sm text-gray-700 rounded-lg border border-gray-200 bg-white px-3 py-2">
																<input
																	type="checkbox"
																	checked={draft.mediationRequested}
																	onChange={(event) =>
																		setRequestDrafts((prev) => ({
																			...prev,
																			[offer._id]: {
																				...draft,
																				mediationRequested:
																					event.target.checked,
																			},
																		}))
																	}
																	disabled={!canSendRequest}
																/>
																Potrzebuję pośrednictwa organizatora
															</label>
														</div>
														<textarea
															rows={2}
															value={draft.message}
															onChange={(event) =>
																setRequestDrafts((prev) => ({
																	...prev,
																	[offer._id]: {
																		...draft,
																		message: event.target.value,
																	},
																}))
															}
															placeholder="Wiadomość do kierowcy (opcjonalnie)"
															className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
															disabled={!canSendRequest}
														/>
														<button
															type="button"
															onClick={() => handleCreateRequest(offer._id)}
															disabled={!canSendRequest}
															className="px-4 py-2 rounded-full text-sm font-semibold bg-[var(--color-primary)] text-white disabled:opacity-60"
														>
															Wyślij zgłoszenie
														</button>
														{carpoolData.hasPendingRequest && (
															<p className="text-xs text-amber-600">
																Masz już jedno oczekujące zgłoszenie. Najpierw
																poczekaj na decyzję lub je anuluj.
															</p>
														)}
													</div>
												)}
											</div>
										);
									})}
								</div>
							)}
						</div>
					)}
				</div>

				<div className="rounded-2xl border border-border bg-white p-6 shadow-sm space-y-4">
					<h4 className="text-xl font-bold text-foreground">Moje zgłoszenia</h4>
					{carpoolData.myRequests.length === 0 ? (
						<p className="text-muted-foreground">Brak wysłanych zgłoszeń.</p>
					) : (
						<ul className="space-y-3">
							{carpoolData.myRequests.map((request) => (
								<li
									key={request._id}
									className="rounded-xl bg-[var(--color-background-light)] p-4"
								>
									<p className="font-semibold text-foreground">
										{request.driverDisplayName}:{" "}
										{formatRoute(
											request.offer.pickupPoint,
											request.offer.dropoffPoint,
										)}
									</p>
									<p className="text-sm text-muted-foreground mt-1">
										Odjazd: {formatDateTime(request.offer.departureDateTime)} |
										miejsca: {request.seatsRequested} | status:{" "}
										{STATUS_LABELS[request.status]}
									</p>
									{request.mediationRequested &&
										!request.mediationResolvedAt && (
											<p className="text-xs text-amber-600 mt-1">
												Zgłoszono potrzebę pośrednictwa organizatora.
											</p>
										)}
									{(request.status === "pending" ||
										request.status === "accepted") && (
										<button
											type="button"
											onClick={() => handleCancelRequest(request._id)}
											disabled={!canMutate}
											className="mt-2 px-4 py-2 rounded-full text-sm font-semibold border border-red-300 text-red-600 disabled:opacity-60"
										>
											Anuluj zgłoszenie
										</button>
									)}
								</li>
							))}
						</ul>
					)}
				</div>
			</div>

			<Dialog.Root
				open={isOfferModalOpen}
				onOpenChange={handleOfferModalOpenChange}
			>
				<Dialog.Portal>
					<Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
					<Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(720px,92vw)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-white p-6 shadow-2xl">
						<Dialog.Title className="text-xl font-bold text-foreground">
							{offerModalMode === "create"
								? "Dodaj ogłoszenie"
								: "Edytuj ogłoszenie"}
						</Dialog.Title>
						<Dialog.Description className="text-sm text-muted-foreground mt-1">
							Podaj szczegóły przejazdu. Skąd i dokąd są opcjonalne.
						</Dialog.Description>

						<div className="mt-5 space-y-4">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
								<div className="space-y-1">
									<label
										htmlFor={OFFER_PICKUP_INPUT_ID}
										className="text-sm font-medium text-foreground"
									>
										Skąd (opcjonalnie)
									</label>
									<Input
										id={OFFER_PICKUP_INPUT_ID}
										value={offerDraft.pickupPoint}
										onChange={(event) =>
											setOfferDraft((prev) => ({
												...prev,
												pickupPoint: event.target.value,
											}))
										}
										placeholder="np. lotnisko Chania"
										disabled={!canMutate}
										className="h-11"
									/>
								</div>
								<div className="space-y-1">
									<label
										htmlFor={OFFER_DROPOFF_INPUT_ID}
										className="text-sm font-medium text-foreground"
									>
										Dokąd (opcjonalnie)
									</label>
									<Input
										id={OFFER_DROPOFF_INPUT_ID}
										value={offerDraft.dropoffPoint}
										onChange={(event) =>
											setOfferDraft((prev) => ({
												...prev,
												dropoffPoint: event.target.value,
											}))
										}
										placeholder="np. Lefka Ori Hotel"
										disabled={!canMutate}
										className="h-11"
									/>
								</div>
							</div>

							<div className="space-y-1">
								<label
									htmlFor={OFFER_DEPARTURE_DATE_ID}
									className="text-sm font-medium text-foreground"
								>
									Kiedy jedziesz?
								</label>
								<div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_160px] gap-3">
									<DatePicker
										id={OFFER_DEPARTURE_DATE_ID}
										value={offerDate}
										onChange={setOfferDate}
										placeholder="Wybierz datę"
										disabled={!canMutate}
										className="h-11 rounded-xl border-gray-200 bg-gray-50 px-4"
									/>
									<Input
										type="time"
										value={offerTime}
										onChange={(event) => setOfferTime(event.target.value)}
										disabled={!canMutate}
										className="h-11 rounded-xl border-gray-200 bg-gray-50 px-4"
									/>
								</div>
							</div>

							<div className="space-y-1">
								<label
									htmlFor={OFFER_SEATS_INPUT_ID}
									className="text-sm font-medium text-foreground"
								>
									Liczba miejsc
								</label>
								<Input
									id={OFFER_SEATS_INPUT_ID}
									type="number"
									min={1}
									value={offerDraft.seatsTotal}
									onChange={(event) =>
										setOfferDraft((prev) => ({
											...prev,
											seatsTotal: event.target.value,
										}))
									}
									disabled={!canMutate}
									className="h-11"
								/>
							</div>

							<div className="space-y-1">
								<label
									htmlFor={OFFER_NOTES_INPUT_ID}
									className="text-sm font-medium text-foreground"
								>
									Dodatkowe informacje (opcjonalnie)
								</label>
								<textarea
									id={OFFER_NOTES_INPUT_ID}
									rows={3}
									value={offerDraft.notes}
									onChange={(event) =>
										setOfferDraft((prev) => ({
											...prev,
											notes: event.target.value,
										}))
									}
									placeholder="Np. mogę podjechać pod inny hotel"
									className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm"
									disabled={!canMutate}
								/>
							</div>
						</div>

						<div className="mt-6 flex flex-wrap justify-end gap-2">
							<button
								type="button"
								onClick={() => handleOfferModalOpenChange(false)}
								className="px-4 py-2 rounded-full text-sm font-semibold border border-gray-300 text-gray-700"
							>
								Anuluj
							</button>
							<button
								type="button"
								onClick={handleSubmitOffer}
								disabled={
									!canMutate || (offerModalMode === "create" && !canCreateOffer)
								}
								className="px-4 py-2 rounded-full text-sm font-semibold bg-[var(--color-primary)] text-white disabled:opacity-60"
							>
								{offerModalMode === "create" ? "Dodaj ogłoszenie" : "Zapisz"}
							</button>
						</div>
					</Dialog.Content>
				</Dialog.Portal>
			</Dialog.Root>
		</>
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
