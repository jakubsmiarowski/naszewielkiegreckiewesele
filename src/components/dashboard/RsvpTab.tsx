import { useMutation, useQuery } from "convex/react";
import { useMemo, useState } from "react";
import { useLocation } from "@tanstack/react-router";
import type {
	InvitationData,
	RsvpSettings,
} from "@/components/dashboard/types";
import {
	type RSVPFormData,
	type RsvpCarpoolSuggestion,
	RsvpForm,
} from "@/components/rsvp/RsvpForm";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { formatLocalDate } from "@/lib/date-time";
import { useLocale } from "@/lib/locale";
import {
	calculateRequestedCarpoolSeats,
	formatCarpoolRequestError,
	formatSeatCount,
} from "@/lib/rsvp-carpool";
import { useTelemetry } from "@/lib/telemetry";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

interface RsvpTabProps {
	invitationData: InvitationData | null | undefined;
	settings: RsvpSettings | null | undefined;
	onGoToCarpool?: (options?: { openCreateModal?: boolean }) => void;
}

export function RsvpTab({
	invitationData,
	settings,
	onGoToCarpool,
}: RsvpTabProps) {
	const { locale } = useLocale();
	const location = useLocation();
	const { captureClientError } = useTelemetry();
	const isEnglish = locale === "en";
	const updateRsvp = useMutation(api.invitations.updateRsvp);
	const createCarpoolRequest = useMutation(api.carpool.createRequest);
	const invitation = invitationData?.invitation;
	const carpoolData = useQuery(
		api.carpool.getCarpoolTabData,
		invitation ? { invitationId: invitation._id as Id<"invitations"> } : "skip",
	);
	const invitationGuests = useMemo(
		() =>
			(invitationData?.guests ?? [])
				.map((guest) => ({
					id: guest._id,
					fullName: guest.fullName.trim(),
				}))
				.filter((guest) => guest.fullName.length > 0),
		[invitationData?.guests],
	);
	const invitationGuestIds = useMemo(
		() => new Set(invitationGuests.map((guest) => guest.id)),
		[invitationGuests],
	);
	const guestAttendanceMap = useMemo<Record<string, "yes" | "no">>(() => {
		const source = invitation?.guestAttendances ?? {};
		const next: Record<string, "yes" | "no"> = {};

		for (const guest of invitationGuests) {
			const byId = source[guest.id];
			if (byId === "yes" || byId === "no") {
				next[guest.id] = byId;
				continue;
			}

			const byName = source[guest.fullName];
			if (byName === "yes" || byName === "no") {
				next[guest.id] = byName;
			}
		}

		if (
			Object.keys(next).length === 0 &&
			(invitation?.attendance === "yes" || invitation?.attendance === "no")
		) {
			if (invitation.answeredForAll === false) {
				const answeredForName = invitation.answeredForName?.trim();
				const matchedGuest = invitationGuests.find(
					(guest) => guest.fullName === answeredForName,
				);
				if (matchedGuest) {
					next[matchedGuest.id] = invitation.attendance;
				}
			} else {
				for (const guest of invitationGuests) {
					next[guest.id] = invitation.attendance;
				}
			}
		}

		return next;
	}, [
		invitation?.guestAttendances,
		invitation?.attendance,
		invitation?.answeredForAll,
		invitation?.answeredForName,
		invitationGuests,
	]);
	const attendanceStats = useMemo(() => {
		return invitationGuests.reduce(
			(acc, guest) => {
				const attendance = guestAttendanceMap[guest.id];
				if (attendance === "yes") {
					acc.confirmed += 1;
				} else if (attendance === "no") {
					acc.declined += 1;
				} else {
					acc.pending += 1;
				}
				return acc;
			},
			{ confirmed: 0, declined: 0, pending: 0 },
		);
	}, [guestAttendanceMap, invitationGuests]);
	const answeredGuestsCount =
		attendanceStats.confirmed + attendanceStats.declined;
	const hasAnyAttending =
		attendanceStats.confirmed > 0 || invitation?.attendance === "yes";
	const carpoolSuggestions = useMemo<RsvpCarpoolSuggestion[]>(
		() =>
			(carpoolData?.openOffers ?? [])
				.filter((offer) => offer.seatsAvailable > 0)
				.slice(0, 3)
				.map((offer) => ({
					_id: offer._id,
					driverDisplayName: offer.driverDisplayName,
					driverArrivalDateTime: offer.driverArrivalDateTime,
					pickupPoint: offer.pickupPoint,
					dropoffPoint: offer.dropoffPoint,
					departureDateTime: offer.departureDateTime,
					seatsAvailable: offer.seatsAvailable,
					myRequestId: offer.myRequestId,
					myRequestStatus: offer.myRequestStatus,
				})),
		[carpoolData?.openOffers],
	);

	const [isEditing, setIsEditing] = useState(false);
	const isCarpoolDataReady = Boolean(carpoolData);
	const hasMyCarpoolOffer = (carpoolData?.myOffers.length ?? 0) > 0;
	const myCarpoolAcceptedSeats =
		carpoolData?.myOffers.reduce(
			(sum, offer) => sum + offer.seatsAccepted,
			0,
		) ?? 0;
	const myCarpoolSeatsTotal =
		carpoolData?.myOffers.reduce((sum, offer) => sum + offer.seatsTotal, 0) ??
		0;

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

	const hasRsvp = Boolean(invitation?.attendance) || answeredGuestsCount > 0;
	const canEdit = !isAfterGrace;
	const canSubmitNew = !isAfterDeadline;
	const currentRoute = `${location.pathname}${location.search}`;

	const defaultValues: Partial<RSVPFormData> | undefined = invitation
		? {
				guestAttendances: guestAttendanceMap,
				transport: invitation.transport ?? "own",
				carpoolDriverOptIn: invitation.carpoolDriverOptIn ? "yes" : "no",
				arrivalDateTime: invitation.arrivalDateTime ?? "",
				departureDateTime: invitation.departureDateTime ?? "",
				message: invitation.message ?? "",
				plusOneName: invitation.plusOneName ?? "",
				plusOneAttendance: invitation.plusOneAttendance,
				childrenCount: invitation.childrenCount ?? 0,
				childrenSleepOption: invitation.childrenSleepOption,
				accommodationType: invitation.accommodationType,
				needsExtraNightsHelp: invitation.needsExtraNightsHelp ?? false,
				extraNightsFromDate: invitation.extraNightsFromDate ?? "",
				extraNightsToDate: invitation.extraNightsToDate ?? "",
			}
		: undefined;

	const reportRsvpError = (
		error: unknown,
		payload: RSVPFormData,
		context: Record<string, unknown>,
	) => {
		captureClientError({
			kind: "rsvp_submit_error",
			route: currentRoute,
			invitationId: invitation?._id,
			message: error instanceof Error ? error.message : "Could not save RSVP",
			stack: error instanceof Error ? error.stack : undefined,
			payload,
			context: {
				locale,
				...context,
			},
		});
	};

	const handleSubmit = async (data: RSVPFormData) => {
		if (!invitation) return;
		const normalizedGuestAttendances: Record<string, "yes" | "no"> = {};
		for (const [guestId, attendance] of Object.entries(
			data.guestAttendances ?? {},
		)) {
			if (!invitationGuestIds.has(guestId)) continue;
			if (attendance === "yes" || attendance === "no") {
				normalizedGuestAttendances[guestId] = attendance;
			}
		}

		const hasAtLeastOneAttending = Object.values(
			normalizedGuestAttendances,
		).some((attendance) => attendance === "yes");
		const canUseExtraNightsHelp =
			hasAtLeastOneAttending && data.accommodationType === "hostProvided";
		const normalizedChildrenCount = hasAtLeastOneAttending
			? normalizeChildrenCount(data.childrenCount)
			: 0;
		const legacyCompatiblePayload = {
			invitationId: invitation._id as Id<"invitations">,
			guestAttendances: normalizedGuestAttendances,
			transport: hasAtLeastOneAttending ? data.transport : undefined,
			carpoolDriverOptIn:
				hasAtLeastOneAttending && data.transport === "own"
					? data.carpoolDriverOptIn === "yes"
					: false,
			arrivalDateTime:
				hasAtLeastOneAttending && data.arrivalDateTime
					? data.arrivalDateTime
					: undefined,
			message: data.message,
			plusOneName:
				hasAtLeastOneAttending &&
				invitation.hasPlusOne &&
				data.plusOneAttendance === "yes"
					? data.plusOneName
					: undefined,
			plusOneAttendance:
				hasAtLeastOneAttending &&
				invitation.hasPlusOne &&
				data.plusOneAttendance
					? data.plusOneAttendance
					: undefined,
		};

		try {
			let usedLegacyRsvpFallback = false;
			try {
				await updateRsvp({
					...legacyCompatiblePayload,
					departureDateTime:
						hasAtLeastOneAttending && data.departureDateTime
							? data.departureDateTime
							: undefined,
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
					childrenCount: hasAtLeastOneAttending
						? normalizedChildrenCount
						: undefined,
					childrenSleepOption:
						hasAtLeastOneAttending &&
						normalizedChildrenCount > 0 &&
						(data.childrenSleepOption === "extraBed" ||
							data.childrenSleepOption === "crib")
							? data.childrenSleepOption
							: undefined,
					accommodationType:
						hasAtLeastOneAttending &&
						(data.accommodationType === "hostProvided" ||
							data.accommodationType === "selfArranged")
							? data.accommodationType
							: undefined,
				});
			} catch (error) {
				if (!isLegacyRsvpValidatorError(error)) {
					throw error;
				}
				reportRsvpError(error, data, {
					stage: "updateRsvp.extendedPayload",
					recoveredWithLegacyFallback: true,
				});
				await updateRsvp(legacyCompatiblePayload);
				usedLegacyRsvpFallback = true;
			}

			let carpoolRequestError: string | null = null;
			let hasCarpoolRequestBeenCreated = false;
			if (
				hasAtLeastOneAttending &&
				data.transport === "bus" &&
				data.selectedCarpoolOfferId
			) {
				const requestedSeats = calculateRequestedCarpoolSeats({
					guestAttendances: normalizedGuestAttendances,
					hasPlusOne: invitation.hasPlusOne,
					plusOneAttendance: data.plusOneAttendance,
					childrenCount: normalizedChildrenCount,
				});
				const selectedOffer = carpoolData?.openOffers.find(
					(offer) =>
						offer._id === data.selectedCarpoolOfferId &&
						offer.seatsAvailable > 0,
				);
				if (selectedOffer?.myRequestId) {
					carpoolRequestError = isEnglish
						? "You already submitted a request for this car pool offer."
						: "Masz już zgłoszenie do tej oferty car pool.";
				} else if (!selectedOffer) {
					carpoolRequestError = isEnglish
						? "The selected car pool offer is no longer available."
						: "Wybrana oferta car pool nie jest już dostępna.";
				} else if (selectedOffer.seatsAvailable < requestedSeats) {
					carpoolRequestError = isEnglish
						? `The selected offer has ${formatSeatCount(selectedOffer.seatsAvailable, locale)}, but your group needs ${formatSeatCount(requestedSeats, locale)}. Please choose another car pool offer.`
						: `Wybrana oferta ma ${formatSeatCount(selectedOffer.seatsAvailable, locale)}, a Twoja grupa potrzebuje ${formatSeatCount(requestedSeats, locale)}. Wybierz inną ofertę car pool.`;
				} else {
					try {
						await createCarpoolRequest({
							invitationId: invitation._id as Id<"invitations">,
							offerId: selectedOffer._id as Id<"carpoolOffers">,
							seatsRequested: requestedSeats,
							message: "",
							mediationRequested: false,
						});
						hasCarpoolRequestBeenCreated = true;
					} catch (error) {
						reportRsvpError(error, data, {
							stage: "createCarpoolRequest",
							offerId: selectedOffer._id,
							requestedSeats,
							seatsAvailable: selectedOffer.seatsAvailable,
						});
						carpoolRequestError = formatCarpoolRequestError({
							error,
							requestedSeats,
							seatsAvailable: selectedOffer.seatsAvailable,
							locale,
						});
					}
				}
			}

			toast({
				variant: carpoolRequestError ? "destructive" : "success",
				title: carpoolRequestError
					? isEnglish
						? "RSVP saved, but the car pool request was not sent"
						: "RSVP zapisane, ale car pool nie został wysłany"
					: isEnglish
						? "RSVP saved"
						: "RSVP zapisane",
				description: carpoolRequestError
					? carpoolRequestError
					: hasCarpoolRequestBeenCreated
						? isEnglish
							? "Thank you for submitting the form. Your car pool request has been sent."
							: "Dziękujemy za przesłanie formularza. Zgłoszenie car pool zostało wysłane."
						: usedLegacyRsvpFallback
							? isEnglish
								? "Thank you for submitting the form. The backend is running a legacy version and did not save children/accommodation fields yet."
								: "Dziękujemy za przesłanie formularza. Backend działa w starszej wersji i nie zapisał jeszcze pól dzieci/noclegu."
							: isEnglish
								? "Thank you for submitting the form."
								: "Dziękujemy za przesłanie formularza.",
			});
			setIsEditing(false);
		} catch (error) {
			reportRsvpError(error, data, {
				stage: "updateRsvp.final",
			});
			toast({
				variant: "destructive",
				title: isEnglish ? "Could not save RSVP" : "Nie udało się zapisać RSVP",
				description: isEnglish
					? "Please try again in a moment."
					: "Spróbuj ponownie za chwilę.",
			});
		}
	};

	if (!invitation) {
		return (
			<div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
				{isEnglish ? "Loading RSVP..." : "Ładowanie RSVP..."}
			</div>
		);
	}

	if (!hasRsvp && !canSubmitNew) {
		return (
			<div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
				<h3 className="text-2xl font-bold text-foreground">
					{isEnglish ? "RSVP closed" : "RSVP zamknięte"}
				</h3>
				<p className="text-muted-foreground mt-2">
					{isEnglish
						? "The response deadline has passed. If needed, contact us directly."
						: "Termin odpowiedzi minął. Jeśli to ważne, skontaktuj się z nami bezpośrednio."}
				</p>
			</div>
		);
	}

	if (hasRsvp && !isEditing) {
		return (
			<div className="rounded-2xl border border-border bg-white p-6 shadow-sm space-y-4">
				<div className="flex items-center justify-between">
					<h3 className="text-2xl font-bold text-foreground">
						{isEnglish ? "Your response" : "Twoja odpowiedź"}
					</h3>
					{canEdit && (
						<Button
							type="button"
							onClick={() => setIsEditing(true)}
							className="rounded-full px-4 py-2 font-semibold shadow transition"
						>
							{isEnglish ? "Edit" : "Edytuj"}
						</Button>
					)}
				</div>

				<div className="rounded-xl bg-[var(--color-background-light)] p-4">
					<p className="text-xs uppercase tracking-widest text-muted-foreground">
						{isEnglish ? "Attendance" : "Obecność"}
					</p>
					<ul className="mt-2 space-y-1.5">
						{invitationGuests.map((guest) => {
							const attendance = guestAttendanceMap[guest.id];
							const isAttending = attendance === "yes";
							return (
								<li
									key={guest.id}
									className="flex items-center justify-between gap-3 text-sm"
								>
									<span className="text-foreground">{guest.fullName}</span>
									<span
										className={
											isAttending
												? "font-medium text-green-600"
												: "text-muted-foreground"
										}
									>
										{isAttending ? (isEnglish ? "Yes" : "Tak") : "-"}
									</span>
								</li>
							);
						})}
					</ul>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<InfoRow
						label={isEnglish ? "Transport" : "Transport"}
						value={
							invitation.transport === "bus"
								? isEnglish
									? "We need transport"
									: "Potrzebujemy transportu"
								: isEnglish
									? "Own transport"
									: "Własny"
						}
					/>
					<InfoRow
						label={isEnglish ? "Car Pool (driver)" : "Car Pool (kierowca)"}
						value={
							invitation.carpoolDriverOptIn ? (isEnglish ? "Yes" : "Tak") : "-"
						}
					/>
					<InfoRow
						label={isEnglish ? "Arrival" : "Przylot"}
						value={formatLocalDate(invitation.arrivalDateTime, locale) || "-"}
					/>
					<InfoRow
						label={isEnglish ? "Departure" : "Wylot"}
						value={formatLocalDate(invitation.departureDateTime, locale) || "-"}
					/>
					<InfoRow
						label={isEnglish ? "Children" : "Dzieci"}
						value={
							(invitation.childrenCount ?? 0) > 0
								? `${isEnglish ? "Yes" : "Tak"} (${invitation.childrenCount})`
								: "-"
						}
					/>
					{(invitation.childrenCount ?? 0) > 0 && (
						<InfoRow
							label={
								isEnglish ? "Sleeping place for children" : "Miejsce dla dzieci"
							}
							value={formatChildrenSleepOption(
								invitation.childrenSleepOption,
								locale,
							)}
						/>
					)}
					<InfoRow
						label={isEnglish ? "Accommodation" : "Nocleg"}
						value={formatAccommodationType(
							invitation.accommodationType,
							locale,
						)}
					/>
					<InfoRow
						label={
							isEnglish
								? "Accommodation help (extra days)"
								: "Pomoc z noclegiem (dodatkowe dni)"
						}
						value={
							invitation.needsExtraNightsHelp
								? isEnglish
									? "Yes"
									: "Tak"
								: "-"
						}
					/>
					{invitation.needsExtraNightsHelp && (
						<InfoRow
							label={
								isEnglish ? "Extra nights range" : "Zakres dodatkowych noclegów"
							}
							value={formatExtraNightsRange(
								invitation.extraNightsFromDate,
								invitation.extraNightsToDate,
								locale,
							)}
						/>
					)}
					{invitation.hasPlusOne && (
						<>
							<InfoRow
								label={isEnglish ? "+1 attendance" : "+1 obecność"}
								value={formatAttendanceValue(
									invitation.plusOneAttendance,
									locale,
								)}
							/>
							<InfoRow
								label={isEnglish ? "+1 full name" : "+1 imię i nazwisko"}
								value={invitation.plusOneName ?? "-"}
							/>
						</>
					)}
				</div>

				{invitation.message && (
					<div className="rounded-xl bg-[var(--color-background-light)] p-4">
						<p className="text-xs uppercase tracking-widest text-muted-foreground">
							{isEnglish ? "Message" : "Wiadomość"}
						</p>
						<p className="text-foreground mt-2">{invitation.message}</p>
					</div>
				)}

				{!canEdit && (
					<p className="text-sm text-muted-foreground">
						{isEnglish
							? "RSVP editing is already closed (after March 31, 2026)."
							: "Edycja RSVP jest już zamknięta (po 31 marca 2026)."}
					</p>
				)}

				{hasAnyAttending &&
					invitation.transport === "bus" &&
					carpoolSuggestions.length > 0 && (
						<div className="rounded-xl bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/20 p-4 flex items-start justify-between gap-4">
							<div>
								<p className="text-xs uppercase tracking-widest text-muted-foreground">
									Car Pool
								</p>
								<p className="text-foreground mt-1">
									{isEnglish
										? "We found available seats from other guests. Check offers in the Car Pool tab."
										: "Znaleźliśmy dostępne miejsca u innych gości. Sprawdź oferty w zakładce Car Pool."}
								</p>
							</div>
							{onGoToCarpool && (
								<Button
									type="button"
									onClick={() => onGoToCarpool()}
									variant="outline"
									className="shrink-0 rounded-full border-[var(--color-primary)] px-4 py-2 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10"
								>
									{isEnglish ? "Show offers" : "Pokaż oferty"}
								</Button>
							)}
						</div>
					)}
				{hasAnyAttending &&
					invitation.transport === "own" &&
					invitation.carpoolDriverOptIn && (
						<div className="rounded-xl bg-[var(--color-background-light)] p-4 flex items-start justify-between gap-4">
							<div>
								<p className="text-xs uppercase tracking-widest text-muted-foreground">
									Car Pool
								</p>
								{!isCarpoolDataReady ? (
									<p className="text-foreground mt-1">
										{isEnglish
											? "Checking your Car Pool offers..."
											: "Sprawdzamy Twoje ogłoszenia Car Pool..."}
									</p>
								) : hasMyCarpoolOffer ? (
									<p className="text-foreground mt-1">
										{isEnglish
											? `You have an active Car Pool with published offers. Currently ${myCarpoolAcceptedSeats}/${myCarpoolSeatsTotal} seats are already taken.`
											: `Masz aktywny Car Pool i opublikowane ogłoszenia. Obecnie ${myCarpoolAcceptedSeats}/${myCarpoolSeatsTotal} miejsc jest już zajętych.`}
									</p>
								) : (
									<p className="text-foreground mt-1">
										{isEnglish
											? "Have seats in your car? Add an offer and help others get to the wedding."
											: "Masz miejsca w aucie? Dodaj ogłoszenie i pomóż innym dojechać na ślub."}
									</p>
								)}
							</div>
							{onGoToCarpool && (
								<Button
									type="button"
									onClick={() =>
										onGoToCarpool({
											openCreateModal: isCarpoolDataReady && !hasMyCarpoolOffer,
										})
									}
									variant="outline"
									className="shrink-0 rounded-full border-[var(--color-primary)] px-4 py-2 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10"
								>
									{!isCarpoolDataReady
										? isEnglish
											? "Open Car Pool"
											: "Otwórz Car Pool"
										: hasMyCarpoolOffer
											? isEnglish
												? "Open Car Pool"
												: "Otwórz Car Pool"
											: isEnglish
												? "Add offer"
												: "Dodaj ogłoszenie"}
								</Button>
							)}
						</div>
					)}
			</div>
		);
	}

	return (
		<RsvpForm
			defaultValues={defaultValues}
			hasPlusOne={invitation.hasPlusOne}
			invitationGuests={invitationGuests}
			carpoolSuggestions={carpoolSuggestions}
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

function normalizeChildrenCount(value: unknown) {
	const numeric = typeof value === "number" ? value : Number(value);
	if (!Number.isFinite(numeric) || Number.isNaN(numeric)) return 0;
	return Math.max(0, Math.min(3, Math.trunc(numeric)));
}

function formatChildrenSleepOption(
	value: "extraBed" | "crib" | undefined,
	locale: "pl" | "en",
): string {
	if (value === "extraBed") return locale === "en" ? "Extra bed" : "Dostawka";
	if (value === "crib") return locale === "en" ? "Crib" : "Łóżeczko";
	return "-";
}

function formatAccommodationType(
	value: "hostProvided" | "selfArranged" | undefined,
	locale: "pl" | "en",
): string {
	if (value === "hostProvided") {
		return locale === "en" ? "Provided by hosts" : "Od organizatorów";
	}
	if (value === "selfArranged") {
		return locale === "en" ? "Self-arranged" : "Na własną rękę";
	}
	return "-";
}

function formatExtraNightsRange(
	fromDate: string | undefined,
	toDate: string | undefined,
	locale: "pl" | "en",
): string {
	if (!fromDate && !toDate) return "-";
	if (fromDate && toDate) {
		const from = formatLocalDate(fromDate, locale);
		const to = formatLocalDate(toDate, locale);
		return from === to ? from : `${from} - ${to}`;
	}
	return formatLocalDate(fromDate ?? toDate, locale) || "-";
}

function formatAttendanceValue(
	value: "yes" | "no" | undefined,
	locale: "pl" | "en",
): string {
	return value === "yes" ? (locale === "en" ? "Yes" : "Tak") : "-";
}

function isLegacyRsvpValidatorError(error: unknown) {
	if (!(error instanceof Error)) return false;
	const message = error.message;
	return (
		message.includes("extra field `accommodationType`") ||
		message.includes("extra field `childrenCount`") ||
		message.includes("extra field `childrenSleepOption`") ||
		message.includes("extra field `departureDateTime`") ||
		message.includes("extra field `needsExtraNightsHelp`") ||
		message.includes("extra field `extraNightsFromDate`") ||
		message.includes("extra field `extraNightsToDate`")
	);
}
