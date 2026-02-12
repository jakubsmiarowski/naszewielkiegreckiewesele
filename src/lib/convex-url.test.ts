import { describe, expect, it } from "vitest";
import { resolveConvexUrl } from "./convex-url";

describe("resolveConvexUrl", () => {
  it("prefers explicit VITE_CONVEX_URL", () => {
    const url = resolveConvexUrl({
      viteEnv: {
        DEV: false,
        VITE_CONVEX_URL: "https://explicit.convex.cloud",
        VITE_CONVEX_PROD_URL: "https://prod.convex.cloud",
      },
      processEnv: {},
    });

    expect(url).toBe("https://explicit.convex.cloud");
  });

  it("ignores explicit VITE_CONVEX_URL outside local development", () => {
    const url = resolveConvexUrl({
      viteEnv: {
        DEV: false,
        VITE_CONVEX_URL: "https://explicit-dev.convex.cloud",
        VITE_CONVEX_PROD_URL: "https://prod.convex.cloud",
      },
      processEnv: { NODE_ENV: "production" },
    });

    expect(url).toBe("https://prod.convex.cloud");
  });

  it("uses dev URL in local development", () => {
    const url = resolveConvexUrl({
      viteEnv: {
        DEV: true,
        VITE_CONVEX_DEV_URL: "https://dev.convex.cloud",
      },
      processEnv: {},
      fallbackProdUrl: "https://prod.convex.cloud",
    });

    expect(url).toBe("https://dev.convex.cloud");
  });

  it("uses production URL outside local development", () => {
    const url = resolveConvexUrl({
      viteEnv: {
        DEV: false,
        VITE_CONVEX_DEV_URL: "https://dev.convex.cloud",
        VITE_CONVEX_PROD_URL: "https://prod.convex.cloud",
      },
      processEnv: { NODE_ENV: "production" },
    });

    expect(url).toBe("https://prod.convex.cloud");
  });
});
