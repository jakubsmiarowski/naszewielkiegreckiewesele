import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getByInvitation = query({
  args: { invitationId: v.id("invitations") },
  returns: v.array(
    v.object({
      _id: v.id("guests"),
      _creationTime: v.number(),
      invitationId: v.id("invitations"),
      fullName: v.string(),
      relation: v.optional(v.string()),
    })
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("guests")
      .withIndex("by_invitation", (q) => q.eq("invitationId", args.invitationId))
      .collect();
  },
});

export const updateGuestRelation = mutation({
  args: {
    guestId: v.id("guests"),
    relation: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.guestId, {
      relation: args.relation,
    });
    return null;
  },
});
