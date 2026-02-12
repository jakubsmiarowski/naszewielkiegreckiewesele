import { ConvexHttpClient } from "convex/browser";
import { resolveConvexUrl } from "./convex-url";

const CONVEX_URL = resolveConvexUrl();

if (!CONVEX_URL) {
  console.error("Missing Convex URL for server-side Convex client.");
}

let cachedClient: ConvexHttpClient | null = null;

export function getConvexServerClient() {
  if (!cachedClient) {
    cachedClient = new ConvexHttpClient(CONVEX_URL);
  }
  return cachedClient;
}
