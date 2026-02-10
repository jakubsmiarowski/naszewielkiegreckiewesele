import { WEDDING_EVENT } from "@/lib/wedding-event";

type BuildIcsFileOptions = {
	now?: Date;
};

type CalendarImportResult = "shared" | "downloaded" | "cancelled";

const EVENT_UID = "wesele-20261001T160000@kamila-kuba";

function pad(value: number) {
	return String(value).padStart(2, "0");
}

function formatUtc(date: Date) {
	return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(
		date.getUTCHours(),
	)}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;
}

function escapeIcsText(value: string) {
	return value
		.replaceAll("\\", "\\\\")
		.replaceAll("\n", "\\n")
		.replaceAll(",", "\\,")
		.replaceAll(";", "\\;");
}

function downloadIcsFile(icsContent: string) {
	const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
	const link = document.createElement("a");
	link.href = URL.createObjectURL(blob);
	link.download = WEDDING_EVENT.icsFileName;
	link.rel = "noopener";
	document.body.append(link);
	link.click();
	link.remove();
	URL.revokeObjectURL(link.href);
}

async function tryShareIcsFile(icsContent: string) {
	if (
		typeof navigator === "undefined" ||
		typeof navigator.share !== "function" ||
		typeof File === "undefined"
	) {
		return false;
	}

	const icsFile = new File([icsContent], WEDDING_EVENT.icsFileName, {
		type: "text/calendar;charset=utf-8",
	});
	const supportsFileShare =
		typeof navigator.canShare === "function"
			? navigator.canShare({ files: [icsFile] })
			: false;
	if (!supportsFileShare) {
		return false;
	}

	try {
		await navigator.share({
			title: WEDDING_EVENT.title,
			text: WEDDING_EVENT.description,
			files: [icsFile],
		});
		return true;
	} catch (error) {
		if (error instanceof DOMException && error.name === "AbortError") {
			return "cancelled";
		}
		return false;
	}
}

export function buildIcsFile(options?: BuildIcsFileOptions) {
	const now = options?.now ?? new Date();
	const dtStamp = formatUtc(now);
	const dtStart = formatUtc(new Date(WEDDING_EVENT.startIso));
	const dtEnd = formatUtc(new Date(WEDDING_EVENT.endIso));

	return [
		"BEGIN:VCALENDAR",
		"VERSION:2.0",
		"PRODID:-//KamilaKuba//Wedding//PL",
		"CALSCALE:GREGORIAN",
		"METHOD:PUBLISH",
		"BEGIN:VEVENT",
		`UID:${EVENT_UID}`,
		`DTSTAMP:${dtStamp}`,
		`DTSTART:${dtStart}`,
		`DTEND:${dtEnd}`,
		`SUMMARY:${escapeIcsText(WEDDING_EVENT.title)}`,
		`DESCRIPTION:${escapeIcsText(WEDDING_EVENT.description)}`,
		`LOCATION:${escapeIcsText(WEDDING_EVENT.location)}`,
		"STATUS:CONFIRMED",
		"SEQUENCE:0",
		"BEGIN:VALARM",
		"TRIGGER:-P7D",
		"ACTION:DISPLAY",
		`DESCRIPTION:${escapeIcsText(WEDDING_EVENT.reminderDescription)}`,
		"END:VALARM",
		"END:VEVENT",
		"END:VCALENDAR",
		"",
	].join("\r\n");
}

export async function importWeddingEventToCalendar(): Promise<CalendarImportResult> {
	const ics = buildIcsFile();
	const shareResult = await tryShareIcsFile(ics);
	if (shareResult === true) {
		return "shared";
	}
	if (shareResult === "cancelled") {
		return "cancelled";
	}

	downloadIcsFile(ics);
	return "downloaded";
}
