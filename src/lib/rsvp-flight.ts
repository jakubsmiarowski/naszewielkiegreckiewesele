function normalizeDateTime(value: string | undefined) {
	if (typeof value !== "string") return undefined;
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : undefined;
}

export function resolveRsvpFlightDateTimes({
	arrivalDateTime,
	departureDateTime,
}: {
	arrivalDateTime?: string;
	departureDateTime?: string;
}) {
	const normalizedArrivalDateTime = normalizeDateTime(arrivalDateTime);
	const normalizedDepartureDateTime = normalizeDateTime(departureDateTime);

	if (!normalizedArrivalDateTime && !normalizedDepartureDateTime) {
		return {
			arrivalDateTime: undefined,
			departureDateTime: undefined,
			hasFlightDates: false,
		};
	}

	if (!normalizedArrivalDateTime) {
		throw new Error("Podaj datę i godzinę przylotu.");
	}

	if (!normalizedDepartureDateTime) {
		throw new Error("Podaj datę i godzinę wylotu.");
	}

	return {
		arrivalDateTime: normalizedArrivalDateTime,
		departureDateTime: normalizedDepartureDateTime,
		hasFlightDates: true,
	};
}
