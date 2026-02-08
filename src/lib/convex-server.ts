import { ConvexHttpClient } from "convex/browser";

const CONVEX_URL =
  process.env.VITE_CONVEX_URL ??
  (import.meta as any).env?.VITE_CONVEX_URL ??
  "";

if (!CONVEX_URL) {
  console.error("Missing VITE_CONVEX_URL for server-side Convex client.");
}

let cachedClient: ConvexHttpClient | null = null;

export function getConvexServerClient() {
  if (!cachedClient) {
    cachedClient = new ConvexHttpClient(CONVEX_URL);
  }
  return cachedClient;
}
