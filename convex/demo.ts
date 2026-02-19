import type { Id } from "./_generated/dataModel";
import { mutation, query, type MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { requireAdminAccess } from "./adminAuth";
import { getInternalApiKey } from "./adminConfig";
import { writeAuditLog } from "./audit";

const DEMO_SETTINGS = {
  key: "rsvp",
  rsvpDeadline: "2026-06-30T23:59",
  rsvpGraceDeadline: "2026-07-07T23:59",
  carpoolDeadline: "2026-09-25T23:59",
};

const DEMO_INVITATIONS = [
  {
    key: "pair_complete",
    shortCode: "111111",
    qrToken: "demo-guest-complete",
    displayName: "Emma & Noah",
    guests: ["Emma Carter", "Noah Carter"],
    hasPlusOne: false,
    relation: "rodzina",
    rsvpPreset: "complete" as const,
    transport: "own" as const,
    carpoolDriverOptIn: true,
    arrivalDateTime: "2026-10-01T10:25",
    departureDateTime: "2026-10-05T17:40",
    message: "We have two free seats from the airport.",
  },
  {
    key: "pair_pending",
    shortCode: "222222",
    qrToken: "demo-guest-pending",
    displayName: "Mia & Liam",
    guests: ["Mia Walker", "Liam Walker"],
    hasPlusOne: false,
    relation: "znajomi",
    rsvpPreset: "pending" as const,
    transport: undefined,
    carpoolDriverOptIn: undefined,
    arrivalDateTime: undefined,
    departureDateTime: undefined,
    message: undefined,
  },
  {
    key: "carpool_mediation",
    shortCode: "333333",
    qrToken: "demo-guest-mediation",
    displayName: "Olivia +1",
    guests: ["Olivia Reed"],
    hasPlusOne: true,
    relation: "znajomi",
    rsvpPreset: "mediation" as const,
    transport: "bus" as const,
    carpoolDriverOptIn: false,
    arrivalDateTime: "2026-10-01T12:10",
    departureDateTime: "2026-10-05T12:30",
    message: "We are looking for transport for two people.",
  },
];

async function clearTable(ctx: MutationCtx, tableName: Parameters<MutationCtx["db"]["query"]>[0]) {
  const docs = await ctx.db.query(tableName).collect();
  for (const doc of docs) {
    await ctx.db.delete(doc._id);
  }
  return docs.length;
}

async function assertDemoResetAccess(
  ctx: MutationCtx,
  args: {
    adminAccessToken?: string;
    internalApiKey?: string;
  },
) {
  const token = args.adminAccessToken?.trim();
  if (token) {
    const admin = await requireAdminAccess(ctx, token);
    return {
      actorType: "admin" as const,
      actorId: admin.email,
    };
  }

  if (args.internalApiKey && args.internalApiKey === getInternalApiKey()) {
    return {
      actorType: "system" as const,
      actorId: "demo:script",
    };
  }

  throw new Error("Brak uprawnień do resetu środowiska demo.");
}

export const hasSeedData = query({
  args: {},
  returns: v.object({
    hasSeedData: v.boolean(),
  }),
  handler: async (ctx) => {
    const invitations = await ctx.db.query("invitations").take(1);
    return {
      hasSeedData: invitations.length > 0,
    };
  },
});

export const resetDemoEnvironment = mutation({
  args: {
    adminAccessToken: v.optional(v.string()),
    internalApiKey: v.optional(v.string()),
  },
  returns: v.object({
    removed: v.object({
      invitations: v.number(),
      guests: v.number(),
      carpoolOffers: v.number(),
      carpoolRequests: v.number(),
      qaQuestions: v.number(),
      pinLoginThrottle: v.number(),
      settings: v.number(),
    }),
    seeded: v.object({
      invitations: v.number(),
      guests: v.number(),
      carpoolOffers: v.number(),
      carpoolRequests: v.number(),
      qaQuestions: v.number(),
    }),
    demoShortCodes: v.array(v.string()),
    resetAt: v.number(),
  }),
  handler: async (ctx, args) => {
    const actor = await assertDemoResetAccess(ctx, args);

    const removed = {
      carpoolRequests: await clearTable(ctx, "carpoolRequests"),
      carpoolOffers: await clearTable(ctx, "carpoolOffers"),
      qaQuestions: await clearTable(ctx, "qaQuestions"),
      pinLoginThrottle: await clearTable(ctx, "pinLoginThrottle"),
      guests: await clearTable(ctx, "guests"),
      invitations: await clearTable(ctx, "invitations"),
      settings: await clearTable(ctx, "settings"),
    };

    const now = Date.now();
    await ctx.db.insert("settings", {
      ...DEMO_SETTINGS,
      updatedAt: now,
    });

    const invitationIds = new Map<string, Id<"invitations">>();
    let seededGuests = 0;

    for (const seed of DEMO_INVITATIONS) {
      const invitationId = await ctx.db.insert("invitations", {
        qrToken: seed.qrToken,
        shortCode: seed.shortCode,
        displayName: seed.displayName,
        isViewed: false,
        notes: seed.rsvpPreset === "pending" ? "Pending RSVP scenario" : undefined,
        hasPlusOne: seed.hasPlusOne,
        plusOneName:
          seed.rsvpPreset === "mediation" ? "Ethan Reed" : undefined,
        plusOneAttendance: seed.rsvpPreset === "mediation" ? "yes" : undefined,
        attendance: seed.rsvpPreset === "pending" ? undefined : "yes",
        guestAttendances: undefined,
        answeredForAll: seed.rsvpPreset === "pending" ? undefined : true,
        answeredForName: undefined,
        transport: seed.transport,
        carpoolDriverOptIn: seed.carpoolDriverOptIn,
        arrivalDateTime: seed.arrivalDateTime,
        departureDateTime: seed.departureDateTime,
        childrenCount: seed.rsvpPreset === "pending" ? undefined : 0,
        childrenSleepOption: undefined,
        accommodationType:
          seed.rsvpPreset === "pending" ? undefined : "hostProvided",
        needsExtraNightsHelp: false,
        extraNightsFromDate: undefined,
        extraNightsToDate: undefined,
        message: seed.message,
        rsvpUpdatedAt: seed.rsvpPreset === "pending" ? undefined : now,
      });

      const guestIds: Id<"guests">[] = [];
      for (const guestName of seed.guests) {
        const guestId = await ctx.db.insert("guests", {
          invitationId,
          fullName: guestName,
          relation: seed.relation,
        });
        guestIds.push(guestId);
        seededGuests += 1;
      }

      if (seed.rsvpPreset !== "pending") {
        const attendances: Record<string, "yes"> = {};
        for (const guestId of guestIds) {
          attendances[guestId] = "yes";
        }
        await ctx.db.patch(invitationId, {
          guestAttendances: attendances,
        });
      }

      invitationIds.set(seed.key, invitationId);
    }

    const driverInvitationId = invitationIds.get("pair_complete");
    const passengerInvitationId = invitationIds.get("carpool_mediation");
    if (!driverInvitationId || !passengerInvitationId) {
      throw new Error("Nie udało się zbudować scenariuszy demo.");
    }

    const offerId = await ctx.db.insert("carpoolOffers", {
      driverInvitationId,
      pickupPoint: "Santorini Airport (JTR)",
      dropoffPoint: "Imerovigli",
      departureDateTime: "2026-10-01T13:00",
      seatsTotal: 3,
      notes: "Departure right after baggage pickup.",
      status: "open",
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("carpoolRequests", {
      offerId,
      passengerInvitationId,
      seatsRequested: 2,
      message: "We are on the same flight. Could you pick us up at arrivals?",
      mediationRequested: true,
      mediationResolvedAt: undefined,
      status: "pending",
      respondedAt: undefined,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("qaQuestions", {
      invitationId: invitationIds.get("pair_pending"),
      askerDisplayName: "Mia & Liam",
      question: "Until when should we confirm our flight details?",
      answer: undefined,
      status: "pending",
      createdAt: now,
      answeredAt: undefined,
    });

    await ctx.db.insert("qaQuestions", {
      invitationId: invitationIds.get("pair_complete"),
      askerDisplayName: "Emma & Noah",
      question: "Is parking near the ceremony venue paid?",
      answer: "No, guest parking near the venue is free.",
      status: "answered",
      createdAt: now,
      answeredAt: now,
    });

    await writeAuditLog(ctx, {
      action: "demo.environment.reset",
      actorType: actor.actorType,
      actorId: actor.actorId,
      entityType: "demo",
      metadata: {
        shortCodes: DEMO_INVITATIONS.map((item) => item.shortCode),
      },
    });

    return {
      removed: {
        invitations: removed.invitations,
        guests: removed.guests,
        carpoolOffers: removed.carpoolOffers,
        carpoolRequests: removed.carpoolRequests,
        qaQuestions: removed.qaQuestions,
        pinLoginThrottle: removed.pinLoginThrottle,
        settings: removed.settings,
      },
      seeded: {
        invitations: DEMO_INVITATIONS.length,
        guests: seededGuests,
        carpoolOffers: 1,
        carpoolRequests: 1,
        qaQuestions: 2,
      },
      demoShortCodes: DEMO_INVITATIONS.map((item) => item.shortCode),
      resetAt: now,
    };
  },
});
