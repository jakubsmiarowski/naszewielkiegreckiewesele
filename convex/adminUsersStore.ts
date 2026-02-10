import type { Doc } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";

type DbCtx = QueryCtx | MutationCtx;

export function normalizeAdminEmail(email: string) {
  return email.trim().toLowerCase();
}

export function assertValidAdminEmail(email: string) {
  const normalized = normalizeAdminEmail(email);
  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
  if (!isValid) {
    throw new Error("Podaj poprawny adres e-mail.");
  }
  return normalized;
}

export async function findAdminByEmail(ctx: DbCtx, email: string) {
  const normalized = normalizeAdminEmail(email);
  if (!normalized) {
    return null;
  }

  const matches = await ctx.db
    .query("adminUsers")
    .withIndex("by_email", (q) => q.eq("email", normalized))
    .collect();

  if (matches.length === 0) {
    return null;
  }

  return matches
    .slice()
    .sort((a, b) => b.updatedAt - a.updatedAt || b._creationTime - a._creationTime)[0];
}

export async function isActiveAdminEmail(ctx: DbCtx, email: string) {
  const admin = await findAdminByEmail(ctx, email);
  return Boolean(admin?.isActive);
}

export async function hasAnyAdminUsers(ctx: DbCtx) {
  const anyAdmin = await ctx.db.query("adminUsers").first();
  return Boolean(anyAdmin);
}

export async function countActiveAdmins(ctx: DbCtx) {
  const activeAdmins = await ctx.db
    .query("adminUsers")
    .withIndex("by_active", (q) => q.eq("isActive", true))
    .collect();
  return activeAdmins.length;
}

export function toAdminUserResult(doc: Doc<"adminUsers">) {
  return {
    _id: doc._id,
    _creationTime: doc._creationTime,
    email: doc.email,
    isActive: doc.isActive,
    addedBy: doc.addedBy,
    deactivatedBy: doc.deactivatedBy,
    deactivatedAt: doc.deactivatedAt,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}
