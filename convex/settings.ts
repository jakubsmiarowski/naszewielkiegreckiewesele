import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const DEFAULT_RSVP_DEADLINE = "2026-02-28T23:59";
const DEFAULT_RSVP_GRACE = "2026-03-31T23:59";
const SETTINGS_KEY = "rsvp";

export const getRsvpSettings = query({
  args: {},
  returns: v.object({
    rsvpDeadline: v.string(),
    rsvpGraceDeadline: v.string(),
  }),
  handler: async (ctx) => {
    const settings = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", SETTINGS_KEY))
      .unique();

    if (!settings) {
      return {
        rsvpDeadline: DEFAULT_RSVP_DEADLINE,
        rsvpGraceDeadline: DEFAULT_RSVP_GRACE,
      };
    }

    return {
      rsvpDeadline: settings.rsvpDeadline,
      rsvpGraceDeadline: settings.rsvpGraceDeadline,
    };
  },
});

export const updateRsvpSettings = mutation({
  args: {
    rsvpDeadline: v.string(),
    rsvpGraceDeadline: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", SETTINGS_KEY))
      .unique();

    if (!existing) {
      await ctx.db.insert("settings", {
        key: SETTINGS_KEY,
        rsvpDeadline: args.rsvpDeadline,
        rsvpGraceDeadline: args.rsvpGraceDeadline,
        updatedAt: Date.now(),
      });
      return null;
    }

    await ctx.db.patch(existing._id, {
      rsvpDeadline: args.rsvpDeadline,
      rsvpGraceDeadline: args.rsvpGraceDeadline,
      updatedAt: Date.now(),
    });
    return null;
  },
});
