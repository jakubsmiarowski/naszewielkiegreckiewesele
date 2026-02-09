import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdminAccess } from "./adminAuth";
import { writeAuditLog } from "./audit";

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
    adminAccessToken: v.string(),
    guestId: v.id("guests"),
    relation: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const admin = await requireAdminAccess(ctx, args.adminAccessToken);
    await ctx.db.patch(args.guestId, {
      relation: args.relation,
    });
    await writeAuditLog(ctx, {
      action: "guest.relation.updated",
      actorType: "admin",
      actorId: admin.email,
      entityType: "guest",
      entityId: args.guestId,
      metadata: { relation: args.relation ?? null },
    });
    return null;
  },
});
