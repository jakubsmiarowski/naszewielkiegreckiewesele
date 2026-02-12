const DEFAULT_PROD_CONVEX_URL =
  "https://scrupulous-squirrel-465.eu-west-1.convex.cloud";

type RawEnv = Record<string, unknown>;

type ResolveConvexUrlOptions = {
  viteEnv?: RawEnv;
  processEnv?: RawEnv;
  fallbackProdUrl?: string;
};

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
  const viteEnv = options.viteEnv ?? ((import.meta as any).env ?? {});
  const processEnv =
    options.processEnv ??
    (typeof process !== "undefined" ? (process.env ?? {}) : {});
  const envs = [viteEnv, processEnv];
  const local = isLocalEnvironment(viteEnv, processEnv);

  const localDevUrl = readFirst(envs, [
    "VITE_CONVEX_DEV_URL",
    "CONVEX_DEV_URL",
    "VITE_CONVEX_URL_DEV",
  ]);
  const productionUrl =
    readFirst(envs, ["VITE_CONVEX_PROD_URL", "CONVEX_PROD_URL"]) ??
    options.fallbackProdUrl ??
    DEFAULT_PROD_CONVEX_URL;

  if (local) {
    const explicit = readFirst(envs, ["VITE_CONVEX_URL", "CONVEX_URL"]);
    return explicit ?? localDevUrl ?? productionUrl;
  }

  return productionUrl;
}
