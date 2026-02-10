import type { AdminInvitation } from "@/components/dashboard/types";

export function formatRoute(pickupPoint?: string, dropoffPoint?: string) {
	const pickup = pickupPoint?.trim();
	const dropoff = dropoffPoint?.trim();
	if (pickup && dropoff) return `${pickup} -> ${dropoff}`;
	if (pickup) return `Start: ${pickup}`;
	if (dropoff) return `Cel: ${dropoff}`;
	return "Trasa do ustalenia";
}

export function getGuestAttendance(
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

export function getInvitationAttendanceStats(invitation: AdminInvitation) {
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
