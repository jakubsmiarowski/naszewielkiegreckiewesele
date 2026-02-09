import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getInternalApiKey } from "./adminConfig";

const PIN_WINDOW_MS = 15 * 60 * 1000;
const PIN_BLOCK_MS = 30 * 60 * 1000;
const PIN_MAX_FAILURES = 8;

function assertInternalApiKey(value: string) {
  if (value !== getInternalApiKey()) {
    throw new Error("Brak uprawnień do operacji bezpieczeństwa.");
  }
}

function normalizeThrottleKey(value: string) {
  return value.trim().slice(0, 180);
}

function toState(now: number, doc?: { failureCount: number; blockedUntil?: number }) {
  const blockedUntil = doc?.blockedUntil;
  const isBlocked = typeof blockedUntil === "number" && blockedUntil > now;
  return {
    isBlocked,
    blockedUntil: isBlocked ? blockedUntil : undefined,
    failureCount: doc?.failureCount ?? 0,
    retryAfterSeconds:
      isBlocked && blockedUntil ? Math.max(Math.ceil((blockedUntil - now) / 1000), 1) : 0,
  };
}

export const getPinThrottleState = query({
  args: {
    key: v.string(),
    internalApiKey: v.string(),
  },
  returns: v.object({
    isBlocked: v.boolean(),
    blockedUntil: v.optional(v.number()),
    failureCount: v.number(),
    retryAfterSeconds: v.number(),
  }),
  handler: async (ctx, args) => {
    assertInternalApiKey(args.internalApiKey);
    const now = Date.now();
    const key = normalizeThrottleKey(args.key);
    const doc = await ctx.db
      .query("pinLoginThrottle")
      .withIndex("by_key", (q) => q.eq("key", key))
      .unique();
    return toState(now, doc ?? undefined);
  },
});

export const recordPinLoginAttempt = mutation({
  args: {
    key: v.string(),
    succeeded: v.boolean(),
    internalApiKey: v.string(),
  },
  returns: v.object({
    isBlocked: v.boolean(),
    blockedUntil: v.optional(v.number()),
    failureCount: v.number(),
    retryAfterSeconds: v.number(),
  }),
  handler: async (ctx, args) => {
    assertInternalApiKey(args.internalApiKey);
    const now = Date.now();
    const key = normalizeThrottleKey(args.key);
    const existing = await ctx.db
      .query("pinLoginThrottle")
      .withIndex("by_key", (q) => q.eq("key", key))
      .unique();

    if (!existing) {
      const failureCount = args.succeeded ? 0 : 1;
      const blockedUntil = !args.succeeded && failureCount >= PIN_MAX_FAILURES
        ? now + PIN_BLOCK_MS
        : undefined;
      await ctx.db.insert("pinLoginThrottle", {
        key,
        windowStart: now,
        failureCount,
        blockedUntil,
        updatedAt: now,
      });
      return toState(now, { failureCount, blockedUntil });
    }

    if (args.succeeded) {
      await ctx.db.patch(existing._id, {
        windowStart: now,
        failureCount: 0,
        blockedUntil: undefined,
        updatedAt: now,
      });
      return toState(now, { failureCount: 0, blockedUntil: undefined });
    }

    if (existing.blockedUntil && existing.blockedUntil > now) {
      return toState(now, existing);
    }

    const shouldResetWindow = now - existing.windowStart > PIN_WINDOW_MS;
    const windowStart = shouldResetWindow ? now : existing.windowStart;
    const failureCount = shouldResetWindow ? 1 : existing.failureCount + 1;
    const blockedUntil = failureCount >= PIN_MAX_FAILURES ? now + PIN_BLOCK_MS : undefined;

    await ctx.db.patch(existing._id, {
      windowStart,
      failureCount,
      blockedUntil,
      updatedAt: now,
    });

    return toState(now, { failureCount, blockedUntil });
  },
});
