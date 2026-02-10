import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdminAccess } from "./adminAuth";
import { getConfiguredAdminEmails, getInternalApiKey } from "./adminConfig";
import {
  assertValidAdminEmail,
  countActiveAdmins,
  findAdminByEmail,
  hasAnyAdminUsers,
  isActiveAdminEmail,
  toAdminUserResult,
} from "./adminUsersStore";
import { writeAuditLog } from "./audit";

function assertInternalApiKey(value: string) {
  if (value !== getInternalApiKey()) {
    throw new Error("Brak uprawnień do operacji administracyjnej.");
  }
}

export const isEmailAdmin = query({
  args: {
    email: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    return await isActiveAdminEmail(ctx, args.email);
  },
});

export const listForAdmin = query({
  args: {
    adminAccessToken: v.string(),
  },
  returns: v.array(
    v.object({
      _id: v.id("adminUsers"),
      _creationTime: v.number(),
      email: v.string(),
      isActive: v.boolean(),
      addedBy: v.optional(v.string()),
      deactivatedBy: v.optional(v.string()),
      deactivatedAt: v.optional(v.number()),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    await requireAdminAccess(ctx, args.adminAccessToken);
    const users = await ctx.db.query("adminUsers").collect();
    return users
      .slice()
      .sort((a, b) => a.email.localeCompare(b.email))
      .map((doc) => toAdminUserResult(doc));
  },
});

export const addAdmin = mutation({
  args: {
    adminAccessToken: v.string(),
    email: v.string(),
  },
  returns: v.object({
    _id: v.id("adminUsers"),
    _creationTime: v.number(),
    email: v.string(),
    isActive: v.boolean(),
    addedBy: v.optional(v.string()),
    deactivatedBy: v.optional(v.string()),
    deactivatedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),
  handler: async (ctx, args) => {
    const actor = await requireAdminAccess(ctx, args.adminAccessToken);
    const email = assertValidAdminEmail(args.email);
    const now = Date.now();
    const existing = await findAdminByEmail(ctx, email);

    if (!existing) {
      const insertedId = await ctx.db.insert("adminUsers", {
        email,
        isActive: true,
        addedBy: actor.email,
        deactivatedBy: undefined,
        deactivatedAt: undefined,
        createdAt: now,
        updatedAt: now,
      });
      const created = await ctx.db.get(insertedId);
      if (!created) {
        throw new Error("Nie udało się dodać administratora.");
      }
      await writeAuditLog(ctx, {
        action: "admin.granted",
        actorType: "admin",
        actorId: actor.email,
        entityType: "adminUser",
        entityId: insertedId,
        metadata: { email },
      });
      return toAdminUserResult(created);
    }

    if (!existing.isActive) {
      await ctx.db.patch(existing._id, {
        isActive: true,
        addedBy: existing.addedBy ?? actor.email,
        deactivatedBy: undefined,
        deactivatedAt: undefined,
        updatedAt: now,
      });
      const updated = await ctx.db.get(existing._id);
      if (!updated) {
        throw new Error("Nie udało się zaktualizować administratora.");
      }
      await writeAuditLog(ctx, {
        action: "admin.reactivated",
        actorType: "admin",
        actorId: actor.email,
        entityType: "adminUser",
        entityId: existing._id,
        metadata: { email },
      });
      return toAdminUserResult(updated);
    }

    return toAdminUserResult(existing);
  },
});

export const setAdminStatus = mutation({
  args: {
    adminAccessToken: v.string(),
    email: v.string(),
    isActive: v.boolean(),
  },
  returns: v.object({
    _id: v.id("adminUsers"),
    _creationTime: v.number(),
    email: v.string(),
    isActive: v.boolean(),
    addedBy: v.optional(v.string()),
    deactivatedBy: v.optional(v.string()),
    deactivatedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),
  handler: async (ctx, args) => {
    const actor = await requireAdminAccess(ctx, args.adminAccessToken);
    const email = assertValidAdminEmail(args.email);
    const existing = await findAdminByEmail(ctx, email);
    if (!existing) {
      throw new Error("Nie znaleziono administratora.");
    }

    if (!args.isActive && existing.email === actor.email) {
      throw new Error("Nie możesz odebrać uprawnień samemu sobie.");
    }

    if (!args.isActive && existing.isActive) {
      const activeCount = await countActiveAdmins(ctx);
      if (activeCount <= 1) {
        throw new Error("Musi pozostać co najmniej jeden aktywny administrator.");
      }
    }

    const now = Date.now();
    if (args.isActive) {
      await ctx.db.patch(existing._id, {
        isActive: true,
        deactivatedBy: undefined,
        deactivatedAt: undefined,
        updatedAt: now,
      });
    } else {
      await ctx.db.patch(existing._id, {
        isActive: false,
        deactivatedBy: actor.email,
        deactivatedAt: now,
        updatedAt: now,
      });
    }

    const updated = await ctx.db.get(existing._id);
    if (!updated) {
      throw new Error("Nie udało się zaktualizować administratora.");
    }

    await writeAuditLog(ctx, {
      action: args.isActive ? "admin.reactivated" : "admin.revoked",
      actorType: "admin",
      actorId: actor.email,
      entityType: "adminUser",
      entityId: existing._id,
      metadata: { email, isActive: args.isActive },
    });

    return toAdminUserResult(updated);
  },
});

export const bootstrapFromEnv = mutation({
  args: {
    email: v.string(),
    internalApiKey: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    assertInternalApiKey(args.internalApiKey);
    const email = assertValidAdminEmail(args.email);
    const configuredAdmins = getConfiguredAdminEmails();
    if (!configuredAdmins.has(email)) {
      return false;
    }

    const existing = await findAdminByEmail(ctx, email);
    if (existing?.isActive) {
      return true;
    }

    if (existing && !existing.isActive) {
      await ctx.db.patch(existing._id, {
        isActive: true,
        deactivatedBy: undefined,
        deactivatedAt: undefined,
        updatedAt: Date.now(),
      });
      return true;
    }

    const hasAdmins = await hasAnyAdminUsers(ctx);
    if (hasAdmins) {
      return false;
    }

    const now = Date.now();
    await ctx.db.insert("adminUsers", {
      email,
      isActive: true,
      addedBy: "bootstrap:env",
      deactivatedBy: undefined,
      deactivatedAt: undefined,
      createdAt: now,
      updatedAt: now,
    });
    return true;
  },
});

export const seedAdmins = mutation({
  args: {
    emails: v.array(v.string()),
    internalApiKey: v.string(),
  },
  returns: v.object({
    inserted: v.number(),
    reactivated: v.number(),
    alreadyActive: v.number(),
    totalProcessed: v.number(),
  }),
  handler: async (ctx, args) => {
    assertInternalApiKey(args.internalApiKey);
    const uniqueEmails = Array.from(
      new Set(args.emails.map((email) => assertValidAdminEmail(email))),
    );

    let inserted = 0;
    let reactivated = 0;
    let alreadyActive = 0;
    const now = Date.now();

    for (const email of uniqueEmails) {
      const existing = await findAdminByEmail(ctx, email);
      if (!existing) {
        const id = await ctx.db.insert("adminUsers", {
          email,
          isActive: true,
          addedBy: "seed:script",
          deactivatedBy: undefined,
          deactivatedAt: undefined,
          createdAt: now,
          updatedAt: now,
        });
        inserted += 1;
        await writeAuditLog(ctx, {
          action: "admin.seed.granted",
          actorType: "system",
          actorId: "seed:script",
          entityType: "adminUser",
          entityId: id,
          metadata: { email },
        });
        continue;
      }

      if (!existing.isActive) {
        await ctx.db.patch(existing._id, {
          isActive: true,
          deactivatedBy: undefined,
          deactivatedAt: undefined,
          updatedAt: now,
        });
        reactivated += 1;
        await writeAuditLog(ctx, {
          action: "admin.seed.reactivated",
          actorType: "system",
          actorId: "seed:script",
          entityType: "adminUser",
          entityId: existing._id,
          metadata: { email },
        });
        continue;
      }

      alreadyActive += 1;
    }

    return {
      inserted,
      reactivated,
      alreadyActive,
      totalProcessed: uniqueEmails.length,
    };
  },
});
