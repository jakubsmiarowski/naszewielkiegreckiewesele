import { useMutation, useQuery } from "convex/react";
import { useMemo, useState } from "react";
import type {
	InvitationData,
	RsvpSettings,
} from "@/components/dashboard/types";
import {
	type RSVPFormData,
	type RsvpCarpoolSuggestion,
	RsvpForm,
} from "@/components/rsvp/RsvpForm";
import { toast } from "@/components/ui/use-toast";
import { formatLocalDate } from "@/lib/date-time";
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
	const updateRsvp = useMutation(api.invitations.updateRsvp);
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

	const defaultValues: Partial<RSVPFormData> | undefined = invitation
		? {
				guestAttendances: guestAttendanceMap,
				transport: invitation.transport ?? "own",
				carpoolDriverOptIn: invitation.carpoolDriverOptIn ? "yes" : "no",
				arrivalDateTime: invitation.arrivalDateTime ?? "",
				message: invitation.message ?? "",
				plusOneName: invitation.plusOneName ?? "",
				plusOneAttendance: invitation.plusOneAttendance,
			}
		: undefined;

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

		try {
			await updateRsvp({
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
			});
			toast({
				variant: "success",
				title: "RSVP zapisane",
				description: "Dziękujemy za przesłanie formularza.",
			});
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
						<button
							type="button"
							onClick={() => setIsEditing(true)}
							className="px-4 py-2 rounded-full text-sm font-semibold bg-[var(--color-primary)] text-white shadow hover:bg-[var(--color-primary-dark)] transition"
						>
							Edytuj
						</button>
					)}
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<InfoRow
						label="Obecność"
						value={`Tak: ${attendanceStats.confirmed} / Nie: ${attendanceStats.declined}`}
					/>
					<InfoRow
						label="Brak odpowiedzi"
						value={String(attendanceStats.pending)}
					/>
					<InfoRow
						label="Transport"
						value={invitation.transport === "bus" ? "Bus" : "Własny"}
					/>
					<InfoRow
						label="Car Pool (kierowca)"
						value={invitation.carpoolDriverOptIn ? "Tak" : "Nie"}
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

				<div className="rounded-xl bg-[var(--color-background-light)] p-4">
					<p className="text-xs uppercase tracking-widest text-muted-foreground">
						Obecność osób
					</p>
					<ul className="mt-2 space-y-1.5">
						{invitationGuests.map((guest) => {
							const attendance = guestAttendanceMap[guest.id];
							return (
								<li
									key={guest.id}
									className="flex items-center justify-between gap-3 text-sm"
								>
									<span className="text-foreground">{guest.fullName}</span>
									<span
										className={
											attendance === "yes"
												? "font-medium text-green-600"
												: attendance === "no"
													? "font-medium text-red-600"
													: "text-muted-foreground"
										}
									>
										{attendance === "yes"
											? "Tak"
											: attendance === "no"
												? "Nie"
												: "Brak odpowiedzi"}
									</span>
								</li>
							);
						})}
					</ul>
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

				{hasAnyAttending &&
					invitation.transport === "bus" &&
					carpoolSuggestions.length > 0 && (
						<div className="rounded-xl bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/20 p-4 flex items-start justify-between gap-4">
							<div>
								<p className="text-xs uppercase tracking-widest text-muted-foreground">
									Car Pool
								</p>
								<p className="text-foreground mt-1">
									Znaleźliśmy dostępne miejsca u innych gości. Sprawdź oferty w
									zakładce Car Pool.
								</p>
							</div>
							{onGoToCarpool && (
								<button
									type="button"
									onClick={() => onGoToCarpool()}
									className="shrink-0 px-4 py-2 rounded-full text-sm font-semibold border border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 transition"
								>
									Pokaż oferty
								</button>
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
										Sprawdzamy Twoje ogłoszenia Car Pool...
									</p>
								) : hasMyCarpoolOffer ? (
									<p className="text-foreground mt-1">
										Masz aktywny Car Pool i opublikowane ogłoszenia. Obecnie{" "}
										{myCarpoolAcceptedSeats}/{myCarpoolSeatsTotal} miejsc jest
										już zajętych.
									</p>
								) : (
									<p className="text-foreground mt-1">
										Masz aktywną gotowość do zabierania gości. Dodaj pierwsze
										ogłoszenie Car Pool.
									</p>
								)}
							</div>
							{onGoToCarpool && (
								<button
									type="button"
									onClick={() =>
										onGoToCarpool({
											openCreateModal: isCarpoolDataReady && !hasMyCarpoolOffer,
										})
									}
									className="shrink-0 px-4 py-2 rounded-full text-sm font-semibold border border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 transition"
								>
									{!isCarpoolDataReady
										? "Otwórz Car Pool"
										: hasMyCarpoolOffer
											? "Otwórz Car Pool"
											: "Dodaj ogłoszenie"}
								</button>
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
			onGoToCarpool={onGoToCarpool}
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
