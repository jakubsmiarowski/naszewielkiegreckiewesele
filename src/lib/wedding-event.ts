import { isDemoMode } from "@/lib/app-mode";

export const WEDDING_EVENT = {
	title: "Nasze Wielkie Greckie Wesele",
	description: isDemoMode()
		? "Demo wedding scenario in Santorini with a sample multi-day schedule."
		: "Spotykamy się w Grecji na kilka dni wspólnego świętowania.",
	location: isDemoMode() ? "Santorini, Greece" : "Kreta, Grecja",
	reminderDescription: "Przypomnienie o weselu",
	startIso: "2026-10-01T16:00:00+03:00",
	endIso: "2026-10-01T23:59:00+03:00",
	icsFileName: "wesele-2026-10-01.ics",
} as const;
