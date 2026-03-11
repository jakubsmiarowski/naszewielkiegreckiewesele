function toSearchParams(value: unknown, params: URLSearchParams, key?: string) {
	if (value === null || typeof value === "undefined") {
		return;
	}

	if (Array.isArray(value)) {
		for (const item of value) {
			toSearchParams(item, params, key);
		}
		return;
	}

	if (!key) {
		if (typeof value === "object") {
			for (const [entryKey, entryValue] of Object.entries(
				value as Record<string, unknown>,
			)) {
				toSearchParams(entryValue, params, entryKey);
			}
		}
		return;
	}

	if (
		typeof value === "string" ||
		typeof value === "number" ||
		typeof value === "boolean"
	) {
		params.append(key, String(value));
		return;
	}

	params.append(key, JSON.stringify(value));
}

export function stringifyLocationSearch(search: unknown, pathname?: string) {
	if (typeof search === "string") {
		if (!search) return "";
		return search.startsWith("?") ? search : `?${search}`;
	}

	if (
		typeof window !== "undefined" &&
		pathname &&
		window.location.pathname === pathname
	) {
		return window.location.search;
	}

	if (!search || typeof search !== "object") {
		return "";
	}

	const params = new URLSearchParams();
	toSearchParams(search, params);
	const queryString = params.toString();
	return queryString ? `?${queryString}` : "";
}

export function buildRouteWithSearch(pathname: string, search: unknown) {
	return `${pathname}${stringifyLocationSearch(search, pathname)}`;
}
