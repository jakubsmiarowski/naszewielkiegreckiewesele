import { resolveAppMode } from "./app-mode";

const DEFAULT_PROD_CONVEX_URL =
	"https://scrupulous-squirrel-465.eu-west-1.convex.cloud";
const DEFAULT_DEMO_CONVEX_URL =
	"https://compassionate-elephant-886.convex.cloud";

type RawEnv = Record<string, unknown>;

type ResolveConvexUrlOptions = {
	viteEnv?: RawEnv;
	processEnv?: RawEnv;
	hostname?: string;
	fallbackProdUrl?: string;
	fallbackDemoUrl?: string;
};

function getDefaultViteEnv(): RawEnv {
	return (import.meta as ImportMeta & { env?: RawEnv }).env ?? {};
}

function readEnv(env: RawEnv, key: string): string | undefined {
	const value = env[key];
	if (typeof value !== "string") {
		return undefined;
	}
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : undefined;
}

function readFirst(envs: RawEnv[], keys: string[]): string | undefined {
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

function isLocalEnvironment(viteEnv: RawEnv, processEnv: RawEnv): boolean {
	if (viteEnv.DEV === true) {
		return true;
	}
	const nodeEnv = readEnv(processEnv, "NODE_ENV");
	return nodeEnv === "development" || nodeEnv === "test";
}

export function resolveConvexUrl(
	options: ResolveConvexUrlOptions = {},
): string {
	const viteEnv = options.viteEnv ?? getDefaultViteEnv();
	const processEnv =
		options.processEnv ??
		(typeof process !== "undefined" ? (process.env ?? {}) : {});
	const envs = [viteEnv, processEnv];
	const local = isLocalEnvironment(viteEnv, processEnv);
	const appMode = resolveAppMode({
		viteEnv,
		processEnv,
		hostname: options.hostname,
	});

	const localDevUrl = readFirst(envs, [
		"VITE_CONVEX_DEV_URL",
		"CONVEX_DEV_URL",
		"VITE_CONVEX_URL_DEV",
	]);
	const productionUrl =
		readFirst(envs, ["VITE_CONVEX_PROD_URL", "CONVEX_PROD_URL"]) ??
		options.fallbackProdUrl ??
		DEFAULT_PROD_CONVEX_URL;
	const demoUrl =
		readFirst(envs, ["VITE_CONVEX_DEMO_URL", "CONVEX_DEMO_URL"]) ??
		options.fallbackDemoUrl ??
		DEFAULT_DEMO_CONVEX_URL;

	if (local) {
		const explicit = readFirst(envs, ["VITE_CONVEX_URL", "CONVEX_URL"]);
		if (explicit) {
			return explicit;
		}
		return appMode === "demo"
			? (demoUrl ?? localDevUrl ?? productionUrl)
			: (localDevUrl ?? productionUrl);
	}

	return appMode === "demo" ? demoUrl : productionUrl;
}
