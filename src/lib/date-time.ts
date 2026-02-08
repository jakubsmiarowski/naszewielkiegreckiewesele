const pad2 = (value: number) => String(value).padStart(2, "0");
const toDateValue = (date: Date) =>
	`${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(
		date.getDate(),
	)}`;

type ParsedLocalDateTime = {
	date?: Date;
	time: string;
};

const polishDateFormatter = new Intl.DateTimeFormat("pl-PL", {
	day: "numeric",
	month: "long",
	year: "numeric",
});

export const parseLocalDateTime = (value?: string): ParsedLocalDateTime => {
	if (!value) {
		return { date: undefined, time: "" };
	}
	const [datePart, timePart] = value.split("T");
	if (!datePart) {
		return { date: undefined, time: "" };
	}
	const [year, month, day] = datePart
		.split("-")
		.map((part) => Number(part));
	if (!year || !month || !day) {
		return { date: undefined, time: "" };
	}
	const [hours = "", minutes = ""] = (timePart ?? "").split(":");
	const time =
		hours && minutes ? `${pad2(Number(hours))}:${pad2(Number(minutes))}` : "";
	return { date: new Date(year, month - 1, day), time };
};

export const buildLocalDateTime = (date?: Date, time?: string) => {
	if (!date || !time) return "";
	return `${toDateValue(date)}T${time}`;
};

export const formatLocalDate = (value?: string) => {
	if (!value) return "";
	const { date } = parseLocalDateTime(value);
	if (!date) return value;
	return polishDateFormatter.format(date);
};
