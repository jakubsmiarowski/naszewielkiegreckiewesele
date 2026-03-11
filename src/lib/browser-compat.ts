const REQUIRED_BROWSER_APIS = [
	{
		name: "fetch",
		isSupported: (target: Partial<typeof globalThis>) =>
			typeof target.fetch === "function",
	},
	{
		name: "URLSearchParams",
		isSupported: (target: Partial<typeof globalThis>) =>
			typeof target.URLSearchParams === "function",
	},
	{
		name: "Intl.DateTimeFormat",
		isSupported: (target: Partial<typeof globalThis>) =>
			typeof target.Intl?.DateTimeFormat === "function",
	},
	{
		name: "localStorage",
		isSupported: () => {
			if (typeof window === "undefined") return true;
			try {
				const probeKey = "__nwgw_storage_probe__";
				window.localStorage.setItem(probeKey, "1");
				window.localStorage.removeItem(probeKey);
				return true;
			} catch {
				return false;
			}
		},
	},
	{
		name: "history.pushState",
		isSupported: () =>
			typeof window === "undefined"
				? true
				: typeof window.history?.pushState === "function",
	},
	{
		name: "requestAnimationFrame",
		isSupported: () =>
			typeof window === "undefined"
				? true
				: typeof window.requestAnimationFrame === "function",
	},
] as const;

export function getBrowserCompatibilityIssue(
	target: Partial<typeof globalThis> = globalThis,
) {
	for (const requirement of REQUIRED_BROWSER_APIS) {
		if (!requirement.isSupported(target)) {
			return requirement.name;
		}
	}

	return null;
}

export function isBrowserCompatibilitySupported(
	target: Partial<typeof globalThis> = globalThis,
) {
	return getBrowserCompatibilityIssue(target) === null;
}
