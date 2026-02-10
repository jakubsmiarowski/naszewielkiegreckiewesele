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
    guestAttendances: v.optional(
      v.record(v.string(), v.union(v.literal("yes"), v.literal("no")))
    ),
    answeredForAll: v.optional(v.boolean()),
    answeredForName: v.optional(v.string()),
    transport: v.optional(v.union(v.literal("own"), v.literal("bus"))),
    carpoolDriverOptIn: v.optional(v.boolean()),
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
    carpoolDeadline: v.optional(v.string()),
    updatedAt: v.number(),
  }).index("by_key", ["key"]),

  carpoolOffers: defineTable({
    driverInvitationId: v.id("invitations"),
    pickupPoint: v.optional(v.string()),
    dropoffPoint: v.optional(v.string()),
    departureDateTime: v.string(),
    seatsTotal: v.number(),
    notes: v.optional(v.string()),
    status: v.union(
      v.literal("open"),
      v.literal("closed"),
      v.literal("cancelled")
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_driverInvitation", ["driverInvitationId"])
    .index("by_status_departure", ["status", "departureDateTime"]),

  carpoolRequests: defineTable({
    offerId: v.id("carpoolOffers"),
    passengerInvitationId: v.id("invitations"),
    seatsRequested: v.number(),
    message: v.optional(v.string()),
    mediationRequested: v.boolean(),
    mediationResolvedAt: v.optional(v.number()),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("rejected"),
      v.literal("cancelled_by_passenger"),
      v.literal("cancelled_by_driver"),
      v.literal("cancelled_system")
    ),
    respondedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_offer", ["offerId"])
    .index("by_passengerInvitation", ["passengerInvitationId"])
    .index("by_status", ["status"])
    .index("by_mediation", ["mediationRequested", "mediationResolvedAt"]),

  qaQuestions: defineTable({
    invitationId: v.optional(v.id("invitations")),
    askerDisplayName: v.optional(v.string()),
    question: v.string(),
    answer: v.optional(v.string()),
    status: v.union(v.literal("pending"), v.literal("answered")),
    createdAt: v.number(),
    answeredAt: v.optional(v.number()),
  })
    .index("by_status", ["status"])
    .index("by_createdAt", ["createdAt"]),

  pinLoginThrottle: defineTable({
    key: v.string(),
    windowStart: v.number(),
    failureCount: v.number(),
    blockedUntil: v.optional(v.number()),
    updatedAt: v.number(),
  }).index("by_key", ["key"]),

  auditLogs: defineTable({
    action: v.string(),
    actorType: v.union(v.literal("admin"), v.literal("invitation"), v.literal("system")),
    actorId: v.optional(v.string()),
    entityType: v.string(),
    entityId: v.optional(v.string()),
    metadata: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_createdAt", ["createdAt"]),

  adminUsers: defineTable({
    email: v.string(),
    isActive: v.boolean(),
    addedBy: v.optional(v.string()),
    deactivatedBy: v.optional(v.string()),
    deactivatedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_active", ["isActive"]),
})
