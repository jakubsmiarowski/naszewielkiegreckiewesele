import { v } from "convex/values";
import { mutation, query, type MutationCtx } from "./_generated/server";
import { requireAdminAccess } from "./adminAuth";

const ERROR_EVENT_KIND = v.union(
  v.literal("runtime_error"),
  v.literal("unhandled_rejection"),
  v.literal("rsvp_submit_error"),
);

const ERROR_EVENT_STATUS = v.union(
  v.literal("new"),
  v.literal("investigating"),
  v.literal("resolved"),
);

const RETENTION_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_MESSAGE_LENGTH = 1_000;
const MAX_STACK_LENGTH = 6_000;
const MAX_JSON_LENGTH = 20_000;
const MAX_FINGERPRINT_LENGTH = 160;
const MAX_ROUTE_LENGTH = 240;
const MAX_RELEASE_LENGTH = 120;
const MAX_USER_AGENT_LENGTH = 500;
const MAX_DEVICE_INFO_LENGTH = 2_000;

function trimOptional(value: string | undefined, maxLength: number) {
  const normalized = value?.trim();
  if (!normalized) {
    return undefined;
  }
  return normalized.slice(0, maxLength);
}

function normalizeMessage(value: string) {
  const normalized = value.trim();
  if (!normalized) {
    return "Unknown client error";
  }
  return normalized.slice(0, MAX_MESSAGE_LENGTH);
}

function normalizeFingerprint(value: string | undefined, fallbackMessage: string) {
  const normalized =
    value
      ?.trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9:_./-]/g, "") ?? "";
  if (normalized) {
    return normalized.slice(0, MAX_FINGERPRINT_LENGTH);
  }
  return fallbackMessage
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9:_./-]/g, "")
    .slice(0, MAX_FINGERPRINT_LENGTH);
}

function normalizeJson(value: string | undefined) {
  const normalized = value?.trim();
  if (!normalized) {
    return undefined;
  }
  return normalized.slice(0, MAX_JSON_LENGTH);
}

async function pruneExpiredEvents(ctx: MutationCtx) {
  const cutoff = Date.now() - RETENTION_WINDOW_MS;
  const staleEvents = await ctx.db
    .query("errorEvents")
    .withIndex("by_lastSeenAt", (q) => q.lt("lastSeenAt", cutoff))
    .collect();

  await Promise.all(staleEvents.map((event) => ctx.db.delete(event._id)));
}

export const reportClientError = mutation({
  args: {
    kind: ERROR_EVENT_KIND,
    fingerprint: v.string(),
    route: v.optional(v.string()),
    release: v.optional(v.string()),
    invitationId: v.optional(v.id("invitations")),
    userAgent: v.optional(v.string()),
    deviceInfo: v.optional(v.string()),
    message: v.string(),
    stack: v.optional(v.string()),
    payloadJson: v.optional(v.string()),
    contextJson: v.optional(v.string()),
  },
  returns: v.id("errorEvents"),
  handler: async (ctx, args) => {
    await pruneExpiredEvents(ctx);

    const now = Date.now();
    const message = normalizeMessage(args.message);
    const fingerprint = normalizeFingerprint(args.fingerprint, message);
    const existing = await ctx.db
      .query("errorEvents")
      .withIndex("by_fingerprint", (q) => q.eq("fingerprint", fingerprint))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        kind: args.kind,
        status: existing.status === "resolved" ? "new" : existing.status,
        route: trimOptional(args.route, MAX_ROUTE_LENGTH),
        release: trimOptional(args.release, MAX_RELEASE_LENGTH),
        invitationId: args.invitationId,
        userAgent: trimOptional(args.userAgent, MAX_USER_AGENT_LENGTH),
        deviceInfo: trimOptional(args.deviceInfo, MAX_DEVICE_INFO_LENGTH),
        message,
        stack: trimOptional(args.stack, MAX_STACK_LENGTH),
        payloadJson: normalizeJson(args.payloadJson),
        contextJson: normalizeJson(args.contextJson),
        lastSeenAt: now,
        occurrenceCount: existing.occurrenceCount + 1,
      });
      return existing._id;
    }

    return await ctx.db.insert("errorEvents", {
      kind: args.kind,
      status: "new",
      fingerprint,
      route: trimOptional(args.route, MAX_ROUTE_LENGTH),
      release: trimOptional(args.release, MAX_RELEASE_LENGTH),
      invitationId: args.invitationId,
      userAgent: trimOptional(args.userAgent, MAX_USER_AGENT_LENGTH),
      deviceInfo: trimOptional(args.deviceInfo, MAX_DEVICE_INFO_LENGTH),
      message,
      stack: trimOptional(args.stack, MAX_STACK_LENGTH),
      payloadJson: normalizeJson(args.payloadJson),
      contextJson: normalizeJson(args.contextJson),
      firstSeenAt: now,
      lastSeenAt: now,
      occurrenceCount: 1,
    });
  },
});

export const listForAdmin = query({
  args: {
    adminAccessToken: v.string(),
  },
  returns: v.array(
    v.object({
      _id: v.id("errorEvents"),
      _creationTime: v.number(),
      kind: ERROR_EVENT_KIND,
      status: ERROR_EVENT_STATUS,
      fingerprint: v.string(),
      occurrenceCount: v.number(),
      firstSeenAt: v.number(),
      lastSeenAt: v.number(),
      lastMessage: v.string(),
      lastRoute: v.optional(v.string()),
      invitationId: v.optional(v.id("invitations")),
      release: v.optional(v.string()),
      userAgent: v.optional(v.string()),
    }),
  ),
  handler: async (ctx, args) => {
    await requireAdminAccess(ctx, args.adminAccessToken);
    const cutoff = Date.now() - RETENTION_WINDOW_MS;
    const events = await ctx.db.query("errorEvents").collect();

    return events
      .filter((event) => event.lastSeenAt >= cutoff)
      .slice()
      .sort((a, b) => b.lastSeenAt - a.lastSeenAt)
      .map((event) => ({
        _id: event._id,
        _creationTime: event._creationTime,
        kind: event.kind,
        status: event.status,
        fingerprint: event.fingerprint,
        occurrenceCount: event.occurrenceCount,
        firstSeenAt: event.firstSeenAt,
        lastSeenAt: event.lastSeenAt,
        lastMessage: event.message,
        lastRoute: event.route,
        invitationId: event.invitationId,
        release: event.release,
        userAgent: event.userAgent,
      }));
  },
});

export const getErrorEvent = query({
  args: {
    adminAccessToken: v.string(),
    errorEventId: v.id("errorEvents"),
  },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("errorEvents"),
      _creationTime: v.number(),
      kind: ERROR_EVENT_KIND,
      status: ERROR_EVENT_STATUS,
      fingerprint: v.string(),
      occurrenceCount: v.number(),
      firstSeenAt: v.number(),
      lastSeenAt: v.number(),
      message: v.string(),
      route: v.optional(v.string()),
      release: v.optional(v.string()),
      invitationId: v.optional(v.id("invitations")),
      userAgent: v.optional(v.string()),
      deviceInfo: v.optional(v.string()),
      stack: v.optional(v.string()),
      payloadJson: v.optional(v.string()),
      contextJson: v.optional(v.string()),
    }),
  ),
  handler: async (ctx, args) => {
    await requireAdminAccess(ctx, args.adminAccessToken);
    const errorEvent = await ctx.db.get(args.errorEventId);
    if (!errorEvent) {
      return null;
    }
    const cutoff = Date.now() - RETENTION_WINDOW_MS;
    if (errorEvent.lastSeenAt < cutoff) {
      return null;
    }

    return {
      _id: errorEvent._id,
      _creationTime: errorEvent._creationTime,
      kind: errorEvent.kind,
      status: errorEvent.status,
      fingerprint: errorEvent.fingerprint,
      occurrenceCount: errorEvent.occurrenceCount,
      firstSeenAt: errorEvent.firstSeenAt,
      lastSeenAt: errorEvent.lastSeenAt,
      message: errorEvent.message,
      route: errorEvent.route,
      release: errorEvent.release,
      invitationId: errorEvent.invitationId,
      userAgent: errorEvent.userAgent,
      deviceInfo: errorEvent.deviceInfo,
      stack: errorEvent.stack,
      payloadJson: errorEvent.payloadJson,
      contextJson: errorEvent.contextJson,
    };
  },
});

export const setErrorStatus = mutation({
  args: {
    adminAccessToken: v.string(),
    errorEventId: v.id("errorEvents"),
    status: ERROR_EVENT_STATUS,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdminAccess(ctx, args.adminAccessToken);
    const errorEvent = await ctx.db.get(args.errorEventId);
    if (!errorEvent) {
      throw new Error("Nie znaleziono zgłoszenia błędu.");
    }

    await ctx.db.patch(args.errorEventId, {
      status: args.status,
    });

    return null;
  },
});
