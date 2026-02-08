export function buildIcsFile() {
	const now = new Date();
	const pad = (val: number) => String(val).padStart(2, "0");
	const formatUtc = (date: Date) =>
		`${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(
			date.getUTCHours(),
		)}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;

	const dtStamp = formatUtc(now);
	const dtStart = "20261002T160000";
	const dtEnd = "20261002T235900";
	const uid = `wesele-${now.getTime()}@kamila-kuba`;

	return [
		"BEGIN:VCALENDAR",
		"VERSION:2.0",
		"PRODID:-//KamilaKuba//Wedding//PL",
		"BEGIN:VEVENT",
		`UID:${uid}`,
		`DTSTAMP:${dtStamp}`,
		`DTSTART:${dtStart}`,
		`DTEND:${dtEnd}`,
		"SUMMARY:Nasze Wielkie Greckie Wesele",
		"DESCRIPTION:Spotykamy się w Grecji na kilka dni wspólnego świętowania.",
		"LOCATION:Kreta, Grecja",
		"BEGIN:VALARM",
		"TRIGGER:-P7D",
		"ACTION:DISPLAY",
		"DESCRIPTION:Przypomnienie o weselu",
		"END:VALARM",
		"END:VEVENT",
		"END:VCALENDAR",
	].join("\r\n");
}
