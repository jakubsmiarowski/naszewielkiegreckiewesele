export type RsvpAttendanceValue = "yes" | "no" | undefined;

export function calculateRequestedCarpoolSeats({
	guestAttendances,
	hasPlusOne,
	plusOneAttendance,
	childrenCount,
}: {
	guestAttendances: Record<string, "yes" | "no">;
	hasPlusOne: boolean;
	plusOneAttendance: RsvpAttendanceValue;
	childrenCount: number;
}) {
	const guestsCount = Object.values(guestAttendances).filter(
		(attendance) => attendance === "yes",
	).length;
	const plusOneCount = hasPlusOne && plusOneAttendance === "yes" ? 1 : 0;
	const normalizedChildrenCount = Number.isFinite(childrenCount)
		? Math.max(0, Math.trunc(childrenCount))
		: 0;

	return Math.max(1, guestsCount + plusOneCount + normalizedChildrenCount);
}

export function formatSeatCount(value: number) {
	if (value === 1) return "1 miejsce";
	if (value % 10 >= 2 && value % 10 <= 4 && (value < 10 || value > 20)) {
		return `${value} miejsca`;
	}
	return `${value} miejsc`;
}

export function formatCarpoolRequestError({
	error,
	requestedSeats,
	seatsAvailable,
}: {
	error: unknown;
	requestedSeats: number;
	seatsAvailable?: number;
}) {
	const rawMessage = error instanceof Error ? error.message : "";
	const cleanedMessage = normalizeConvexErrorMessage(rawMessage);

	if (
		cleanedMessage.includes("Brak wystarczającej liczby wolnych miejsc") ||
		cleanedMessage.includes("Przekroczono limit miejsc")
	) {
		if (typeof seatsAvailable === "number") {
			return `Wybrana oferta ma ${formatSeatCount(seatsAvailable)}, a Twoja grupa potrzebuje ${formatSeatCount(requestedSeats)}. Wybierz inną ofertę car pool.`;
		}
		return `Wybrana oferta nie ma wystarczającej liczby miejsc dla Twojej grupy (${formatSeatCount(requestedSeats)}). Wybierz inną ofertę car pool.`;
	}

	if (
		cleanedMessage.includes("Ta oferta nie przyjmuje już zgłoszeń") ||
		cleanedMessage.includes("Ta oferta nie jest już dostępna")
	) {
		return "Wybrana oferta car pool nie jest już dostępna. Wybierz inną ofertę.";
	}

	if (cleanedMessage.includes("Masz już jedno oczekujące zgłoszenie")) {
		return "Masz już jedno oczekujące zgłoszenie car pool. Poczekaj na decyzję kierowcy albo anuluj zgłoszenie.";
	}

	if (cleanedMessage) {
		return cleanedMessage;
	}

	return "Nie udało się wysłać zgłoszenia car pool. Spróbuj ponownie.";
}

function normalizeConvexErrorMessage(message: string) {
	if (!message) return "";

	const uncaughtErrorMatch = message.match(/Uncaught Error:\s*([^\n(]+)/);
	if (uncaughtErrorMatch?.[1]) {
		return uncaughtErrorMatch[1].trim();
	}

	let cleaned = message
		.replace(/\[CONVEX [^\]]+\]\s*/g, "")
		.replace(/\[Request ID:[^\]]+\]\s*/g, "")
		.replace(/Server Error\s*/g, "")
		.replace(/\s+Called by client\.?$/g, "")
		.trim();

	const atHandlerIndex = cleaned.indexOf("at handler");
	if (atHandlerIndex >= 0) {
		cleaned = cleaned.slice(0, atHandlerIndex).trim();
	}

	return cleaned;
}
