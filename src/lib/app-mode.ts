export type AppMode = "production" | "demo";

type RawEnv = Record<string, unknown>;

type ResolveAppModeOptions = {
	viteEnv?: RawEnv;
	processEnv?: RawEnv;
	hostname?: string;
};

function getDefaultViteEnv(): RawEnv {
	return (import.meta as ImportMeta & { env?: RawEnv }).env ?? {};
}

function readEnv(env: RawEnv, key: string): string | undefined {
	const value = env[key];
	if (typeof value !== "string") {
		return undefined;
	}
	const trimmed = value.trim().toLowerCase();
	return trimmed.length > 0 ? trimmed : undefined;
}

function readFirst(envs: RawEnv[], keys: string[]) {
	for (const key of keys) {
		for (const env of envs) {
			const value = readEnv(env, key);
			if (value) {
				return value;
			}
		}
	}
	return undefined;
}

function isDemoHostname(hostname: string | undefined) {
	if (!hostname) {
		return false;
	}
	return hostname.trim().toLowerCase().startsWith("demo.");
}

export function resolveAppMode(options: ResolveAppModeOptions = {}): AppMode {
	const viteEnv = options.viteEnv ?? getDefaultViteEnv();
	const processEnv =
		options.processEnv ??
		(typeof process !== "undefined" ? (process.env ?? {}) : {});
	const envs = [viteEnv, processEnv];

	const rawMode = readFirst(envs, ["VITE_APP_MODE", "APP_MODE"]);
	if (rawMode === "demo") {
		return "demo";
	}
	if (rawMode === "production") {
		return "production";
	}

	const runtimeHostname =
		options.hostname ??
		(typeof window !== "undefined" ? window.location.hostname : undefined);
	return isDemoHostname(runtimeHostname) ? "demo" : "production";
}

export function isDemoMode(options: ResolveAppModeOptions = {}): boolean {
	return resolveAppMode(options) === "demo";
}
