import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  // Better Auth core tables
  user: defineTable({
    email: v.string(),
    emailVerified: v.boolean(),
    name: v.string(),
    image: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_email", ["email"]),

  session: defineTable({
    userId: v.id("user"),
    token: v.string(),
    expiresAt: v.number(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_token", ["token"])
    .index("by_userId", ["userId"]),

  account: defineTable({
    userId: v.id("user"),
    accountId: v.string(),
    providerId: v.string(),
    accessToken: v.optional(v.string()),
    refreshToken: v.optional(v.string()),
    accessTokenExpiresAt: v.optional(v.number()),
    refreshTokenExpiresAt: v.optional(v.number()),
    scope: v.optional(v.string()),
    idToken: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_providerId_and_accountId", ["providerId", "accountId"]),

  verification: defineTable({
    identifier: v.string(),
    value: v.string(),
    expiresAt: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

  invitations: defineTable({
    // 1. SECURITY TOKENS
    qrToken: v.string(),
    shortCode: v.string(),

    // 2. METADATA
    displayName: v.string(),
    isViewed: v.boolean(),
    notes: v.optional(v.string()),

    // 3. LOGISTICS / RSVP
    hasPlusOne: v.boolean(),
    plusOneName: v.optional(v.string()),
    plusOneAttendance: v.optional(v.union(v.literal("yes"), v.literal("no"))),
    attendance: v.optional(v.union(v.literal("yes"), v.literal("no"))),
    answeredForAll: v.optional(v.boolean()),
    answeredForName: v.optional(v.string()),
    transport: v.optional(v.union(v.literal("own"), v.literal("bus"))),
    arrivalDateTime: v.optional(v.string()),
    message: v.optional(v.string()),
    rsvpUpdatedAt: v.optional(v.number()),
  })
    .index("by_token", ["qrToken"])
    .index("by_short_code", ["shortCode"]),

  guests: defineTable({
    invitationId: v.id("invitations"),
    fullName: v.string(),
    relation: v.optional(v.string()),
  }).index("by_invitation", ["invitationId"]),

  settings: defineTable({
    key: v.string(),
    rsvpDeadline: v.string(),
    rsvpGraceDeadline: v.string(),
    updatedAt: v.number(),
  }).index("by_key", ["key"]),
})
