import { normalizeConvexErrorMessage } from "@/lib/convex-error";

type AppLocale = "pl" | "en";

export function getRsvpSubmitErrorMessage(error: unknown) {
	if (error instanceof Error) {
		return normalizeConvexErrorMessage(error.message);
	}
	if (typeof error === "string") {
		return normalizeConvexErrorMessage(error);
	}
	return "";
}

export function formatRsvpSubmitError(
	error: unknown,
	locale: AppLocale = "pl",
) {
	const cleanedMessage = getRsvpSubmitErrorMessage(error);
	if (cleanedMessage) {
		return cleanedMessage;
	}

	return locale === "en"
		? "Could not save RSVP. Please try again."
		: "Nie udało się zapisać RSVP. Spróbuj ponownie.";
}
