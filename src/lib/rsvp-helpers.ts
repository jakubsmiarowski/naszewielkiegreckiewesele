import { useMemo } from "react";
import type { InvitationData } from "@/components/dashboard/types";

export function useRsvpStats(
	invitationData: InvitationData | null | undefined,
) {
	const invitation = invitationData?.invitation;

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

	const hasResponded =
		Boolean(invitation?.attendance) || answeredGuestsCount > 0;

	return {
		invitationGuests,
		guestAttendanceMap,
		attendanceStats,
		answeredGuestsCount,
		hasAnyAttending,
		hasResponded,
	};
}
