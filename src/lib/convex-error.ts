export function normalizeConvexErrorMessage(message: string) {
	if (!message) return "";

	const uncaughtErrorMatch = message.match(
		/Uncaught Error:\s*(.+?)(?:\s+at handler\b|\n|\()/,
	);
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
