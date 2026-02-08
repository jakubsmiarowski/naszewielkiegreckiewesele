import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { v } from "convex/values";

const SETTINGS_KEY = "rsvp";
const DEFAULT_CARPOOL_DEADLINE = "2026-10-04T23:59";

const OFFER_STATUS = v.union(
  v.literal("open"),
  v.literal("closed"),
  v.literal("cancelled")
);
const REQUEST_STATUS = v.union(
  v.literal("pending"),
  v.literal("accepted"),
  v.literal("rejected"),
  v.literal("cancelled_by_passenger"),
  v.literal("cancelled_by_driver"),
  v.literal("cancelled_system")
);
const REQUEST_DECISION = v.union(v.literal("accept"), v.literal("reject"));

const ACTIVE_REQUEST_STATUSES = new Set<Doc<"carpoolRequests">["status"]>([
  "pending",
  "accepted",
]);

function parseDateTime(value: string) {
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) {
    throw new Error("Nieprawidłowy format daty.");
  }
  return timestamp;
}

async function getCarpoolDeadline(ctx: QueryCtx | MutationCtx) {
  const settings = await ctx.db
    .query("settings")
    .withIndex("by_key", (q) => q.eq("key", SETTINGS_KEY))
    .unique();
  return settings?.carpoolDeadline ?? DEFAULT_CARPOOL_DEADLINE;
}

function assertBeforeDeadline(carpoolDeadline: string) {
  if (Date.now() > parseDateTime(carpoolDeadline)) {
    throw new Error("Zapisy do car pool są już zamknięte.");
  }
}

function normalizeOptional(value?: string) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function ensurePositiveInteger(value: number, field: string) {
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`Pole ${field} musi być dodatnią liczbą całkowitą.`);
  }
}

function isPassengerEligible(invitation: Doc<"invitations">) {
  return invitation.attendance === "yes";
}

function isDriverEligible(invitation: Doc<"invitations">) {
  return (
    invitation.attendance === "yes" &&
    invitation.transport === "own" &&
    invitation.carpoolDriverOptIn === true
  );
}

async function getInvitationOrThrow(
  ctx: QueryCtx | MutationCtx,
  invitationId: Id<"invitations">
) {
  const invitation = await ctx.db.get(invitationId);
  if (!invitation) {
    throw new Error("Nie znaleziono zaproszenia.");
  }
  return invitation;
}

async function getAcceptedSeatsForOffer(
  ctx: QueryCtx | MutationCtx,
  offerId: Id<"carpoolOffers">
) {
  const requests = await ctx.db
    .query("carpoolRequests")
    .withIndex("by_offer", (q) => q.eq("offerId", offerId))
    .collect();
  return requests
    .filter((request) => request.status === "accepted")
    .reduce((sum, request) => sum + request.seatsRequested, 0);
}

async function hasPendingRequestForPassenger(
  ctx: QueryCtx | MutationCtx,
  invitationId: Id<"invitations">
) {
  const requests = await ctx.db
    .query("carpoolRequests")
    .withIndex("by_passengerInvitation", (q) =>
      q.eq("passengerInvitationId", invitationId)
    )
    .collect();
  return requests.some((request) => request.status === "pending");
}

async function getPassengerSeatLimit(
  ctx: QueryCtx | MutationCtx,
  invitation: Doc<"invitations">
) {
  const guests = await ctx.db
    .query("guests")
    .withIndex("by_invitation", (q) => q.eq("invitationId", invitation._id))
    .collect();
  const plusOneCount =
    invitation.hasPlusOne && invitation.plusOneAttendance === "yes" ? 1 : 0;
  return Math.max(1, guests.length + plusOneCount);
}

async function getPassengerRequiredSeats(
  ctx: QueryCtx | MutationCtx,
  invitation: Doc<"invitations">
) {
  const plusOneCount =
    invitation.hasPlusOne && invitation.plusOneAttendance === "yes" ? 1 : 0;

  if (invitation.answeredForAll === false) {
    return Math.max(1, 1 + plusOneCount);
  }

  const guests = await ctx.db
    .query("guests")
    .withIndex("by_invitation", (q) => q.eq("invitationId", invitation._id))
    .collect();
  return Math.max(1, guests.length + plusOneCount);
}

async function cancelOfferAndRequests(
  ctx: MutationCtx,
  offerId: Id<"carpoolOffers">,
  requestStatus: Doc<"carpoolRequests">["status"]
) {
  const now = Date.now();
  const offer = await ctx.db.get(offerId);
  if (!offer || offer.status === "cancelled") {
    return;
  }

  await ctx.db.patch(offerId, {
    status: "cancelled",
    updatedAt: now,
  });

  const requests = await ctx.db
    .query("carpoolRequests")
    .withIndex("by_offer", (q) => q.eq("offerId", offerId))
    .collect();

  for (const request of requests) {
    if (!ACTIVE_REQUEST_STATUSES.has(request.status)) {
      continue;
    }
    await ctx.db.patch(request._id, {
      status: requestStatus,
      respondedAt: now,
      updatedAt: now,
    });
  }
}

async function cancelPassengerActiveRequests(
  ctx: MutationCtx,
  invitationId: Id<"invitations">,
  requestStatus: Doc<"carpoolRequests">["status"]
) {
  const now = Date.now();
  const requests = await ctx.db
    .query("carpoolRequests")
    .withIndex("by_passengerInvitation", (q) =>
      q.eq("passengerInvitationId", invitationId)
    )
    .collect();

  for (const request of requests) {
    if (!ACTIVE_REQUEST_STATUSES.has(request.status)) {
      continue;
    }
    await ctx.db.patch(request._id, {
      status: requestStatus,
      respondedAt: now,
      updatedAt: now,
    });
  }
}

export async function enforceCarpoolConsistencyAfterInvitationUpdate(
  ctx: MutationCtx,
  invitationId: Id<"invitations">
) {
  const invitation = await ctx.db.get(invitationId);
  if (!invitation) {
    return;
  }

  const driverEligible = isDriverEligible(invitation);
  const passengerEligible = isPassengerEligible(invitation);

  if (!driverEligible) {
    const offers = await ctx.db
      .query("carpoolOffers")
      .withIndex("by_driverInvitation", (q) =>
        q.eq("driverInvitationId", invitationId)
      )
      .collect();

    for (const offer of offers) {
      if (offer.status !== "cancelled") {
        await cancelOfferAndRequests(ctx, offer._id, "cancelled_system");
      }
    }
  }

  if (!passengerEligible) {
    await cancelPassengerActiveRequests(ctx, invitationId, "cancelled_system");
  }
}

export const getCarpoolTabData = query({
  args: {
    invitationId: v.id("invitations"),
  },
  returns: v.object({
    carpoolDeadline: v.string(),
    isBeforeDeadline: v.boolean(),
    canCreateOffer: v.boolean(),
    canRequestRide: v.boolean(),
    hasPendingRequest: v.boolean(),
    passengerRequiredSeats: v.number(),
    passengerSeatLimit: v.number(),
    myOffers: v.array(
      v.object({
        _id: v.id("carpoolOffers"),
        pickupPoint: v.optional(v.string()),
        dropoffPoint: v.optional(v.string()),
        departureDateTime: v.string(),
        seatsTotal: v.number(),
        notes: v.optional(v.string()),
        status: OFFER_STATUS,
        createdAt: v.number(),
        updatedAt: v.number(),
        seatsAccepted: v.number(),
        seatsAvailable: v.number(),
        requests: v.array(
          v.object({
            _id: v.id("carpoolRequests"),
            passengerInvitationId: v.id("invitations"),
            passengerDisplayName: v.string(),
            seatsRequested: v.number(),
            message: v.optional(v.string()),
            mediationRequested: v.boolean(),
            mediationResolvedAt: v.optional(v.number()),
            status: REQUEST_STATUS,
            respondedAt: v.optional(v.number()),
            createdAt: v.number(),
            updatedAt: v.number(),
          })
        ),
      })
    ),
    openOffers: v.array(
      v.object({
        _id: v.id("carpoolOffers"),
        driverInvitationId: v.id("invitations"),
        driverDisplayName: v.string(),
        driverArrivalDateTime: v.optional(v.string()),
        pickupPoint: v.optional(v.string()),
        dropoffPoint: v.optional(v.string()),
        departureDateTime: v.string(),
        seatsTotal: v.number(),
        notes: v.optional(v.string()),
        status: OFFER_STATUS,
        seatsAccepted: v.number(),
        seatsAvailable: v.number(),
        myRequestId: v.optional(v.id("carpoolRequests")),
        myRequestStatus: v.optional(REQUEST_STATUS),
        myRequestSeats: v.optional(v.number()),
      })
    ),
    myRequests: v.array(
      v.object({
        _id: v.id("carpoolRequests"),
        offerId: v.id("carpoolOffers"),
        seatsRequested: v.number(),
        message: v.optional(v.string()),
        mediationRequested: v.boolean(),
        mediationResolvedAt: v.optional(v.number()),
        status: REQUEST_STATUS,
        respondedAt: v.optional(v.number()),
        createdAt: v.number(),
        updatedAt: v.number(),
        driverDisplayName: v.string(),
        offer: v.object({
          _id: v.id("carpoolOffers"),
          pickupPoint: v.optional(v.string()),
          dropoffPoint: v.optional(v.string()),
          departureDateTime: v.string(),
          seatsTotal: v.number(),
          status: OFFER_STATUS,
        }),
      })
    ),
  }),
  handler: async (ctx, args) => {
    const invitation = await getInvitationOrThrow(ctx, args.invitationId);
    const carpoolDeadline = await getCarpoolDeadline(ctx);
    const isBeforeDeadline = Date.now() <= parseDateTime(carpoolDeadline);
    const passengerRequiredSeats = await getPassengerRequiredSeats(ctx, invitation);

    const myRequestsDocs = await ctx.db
      .query("carpoolRequests")
      .withIndex("by_passengerInvitation", (q) =>
        q.eq("passengerInvitationId", args.invitationId)
      )
      .collect();
    const hasPendingRequest = myRequestsDocs.some(
      (request) => request.status === "pending"
    );

    const myRequestsByOffer = new Map<string, (typeof myRequestsDocs)[number]>();
    for (const request of myRequestsDocs) {
      myRequestsByOffer.set(request.offerId, request);
    }

    const myOffersDocs = await ctx.db
      .query("carpoolOffers")
      .withIndex("by_driverInvitation", (q) =>
        q.eq("driverInvitationId", args.invitationId)
      )
      .collect();

    const myOffers = await Promise.all(
      myOffersDocs
        .slice()
        .sort((a, b) => parseDateTime(a.departureDateTime) - parseDateTime(b.departureDateTime))
        .map(async (offer) => {
          const requests = await ctx.db
            .query("carpoolRequests")
            .withIndex("by_offer", (q) => q.eq("offerId", offer._id))
            .collect();

          const requestRows = await Promise.all(
            requests
              .slice()
              .sort((a, b) => b.createdAt - a.createdAt)
              .map(async (request) => {
                const passenger = await ctx.db.get(request.passengerInvitationId);
                return {
                  _id: request._id,
                  passengerInvitationId: request.passengerInvitationId,
                  passengerDisplayName: passenger?.displayName ?? "Gość",
                  seatsRequested: request.seatsRequested,
                  message: request.message,
                  mediationRequested: request.mediationRequested,
                  mediationResolvedAt: request.mediationResolvedAt,
                  status: request.status,
                  respondedAt: request.respondedAt,
                  createdAt: request.createdAt,
                  updatedAt: request.updatedAt,
                };
              })
          );

          const seatsAccepted = requestRows
            .filter((request) => request.status === "accepted")
            .reduce((sum, request) => sum + request.seatsRequested, 0);
          const seatsAvailable = Math.max(offer.seatsTotal - seatsAccepted, 0);

          return {
            _id: offer._id,
            pickupPoint: offer.pickupPoint,
            dropoffPoint: offer.dropoffPoint,
            departureDateTime: offer.departureDateTime,
            seatsTotal: offer.seatsTotal,
            notes: offer.notes,
            status: offer.status,
            createdAt: offer.createdAt,
            updatedAt: offer.updatedAt,
            seatsAccepted,
            seatsAvailable,
            requests: requestRows,
          };
        })
    );

    const openOfferDocs = await ctx.db
      .query("carpoolOffers")
      .withIndex("by_status_departure", (q) => q.eq("status", "open"))
      .collect();

    const openOffers = await Promise.all(
      openOfferDocs
        .filter((offer) => offer.driverInvitationId !== args.invitationId)
        .slice()
        .sort((a, b) => parseDateTime(a.departureDateTime) - parseDateTime(b.departureDateTime))
        .map(async (offer) => {
          const driver = await ctx.db.get(offer.driverInvitationId);
          const seatsAccepted = await getAcceptedSeatsForOffer(ctx, offer._id);
          const seatsAvailable = Math.max(offer.seatsTotal - seatsAccepted, 0);
          const ownRequest = myRequestsByOffer.get(offer._id);

          return {
            _id: offer._id,
            driverInvitationId: offer.driverInvitationId,
            driverDisplayName: driver?.displayName ?? "Gość",
            driverArrivalDateTime: driver?.arrivalDateTime,
            pickupPoint: offer.pickupPoint,
            dropoffPoint: offer.dropoffPoint,
            departureDateTime: offer.departureDateTime,
            seatsTotal: offer.seatsTotal,
            notes: offer.notes,
            status: offer.status,
            seatsAccepted,
            seatsAvailable,
            myRequestId: ownRequest?._id,
            myRequestStatus: ownRequest?.status,
            myRequestSeats: ownRequest?.seatsRequested,
          };
        })
    );

    const myRequests = await Promise.all(
      myRequestsDocs
        .slice()
        .sort((a, b) => b.createdAt - a.createdAt)
        .map(async (request) => {
          const offer = await ctx.db.get(request.offerId);
          if (!offer) {
            return null;
          }
          const driver = await ctx.db.get(offer.driverInvitationId);
          return {
            _id: request._id,
            offerId: request.offerId,
            seatsRequested: request.seatsRequested,
            message: request.message,
            mediationRequested: request.mediationRequested,
            mediationResolvedAt: request.mediationResolvedAt,
            status: request.status,
            respondedAt: request.respondedAt,
            createdAt: request.createdAt,
            updatedAt: request.updatedAt,
            driverDisplayName: driver?.displayName ?? "Gość",
            offer: {
              _id: offer._id,
              pickupPoint: offer.pickupPoint,
              dropoffPoint: offer.dropoffPoint,
              departureDateTime: offer.departureDateTime,
              seatsTotal: offer.seatsTotal,
              status: offer.status,
            },
          };
        })
    );

    return {
      carpoolDeadline,
      isBeforeDeadline,
      canCreateOffer: isDriverEligible(invitation),
      canRequestRide: isPassengerEligible(invitation),
      hasPendingRequest,
      passengerRequiredSeats,
      passengerSeatLimit: await getPassengerSeatLimit(ctx, invitation),
      myOffers,
      openOffers,
      myRequests: myRequests.filter((row): row is NonNullable<typeof row> => row !== null),
    };
  },
});

export const createOffer = mutation({
  args: {
    invitationId: v.id("invitations"),
    pickupPoint: v.optional(v.string()),
    dropoffPoint: v.optional(v.string()),
    departureDateTime: v.string(),
    seatsTotal: v.number(),
    notes: v.optional(v.string()),
  },
  returns: v.id("carpoolOffers"),
  handler: async (ctx, args) => {
    const invitation = await getInvitationOrThrow(ctx, args.invitationId);
    if (!isDriverEligible(invitation)) {
      throw new Error("Nie możesz utworzyć oferty przejazdu.");
    }

    const carpoolDeadline = await getCarpoolDeadline(ctx);
    assertBeforeDeadline(carpoolDeadline);
    parseDateTime(args.departureDateTime);
    ensurePositiveInteger(args.seatsTotal, "seatsTotal");

    const now = Date.now();
    return await ctx.db.insert("carpoolOffers", {
      driverInvitationId: args.invitationId,
      pickupPoint: normalizeOptional(args.pickupPoint),
      dropoffPoint: normalizeOptional(args.dropoffPoint),
      departureDateTime: args.departureDateTime,
      seatsTotal: args.seatsTotal,
      notes: normalizeOptional(args.notes),
      status: "open",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateOffer = mutation({
  args: {
    invitationId: v.id("invitations"),
    offerId: v.id("carpoolOffers"),
    pickupPoint: v.optional(v.string()),
    dropoffPoint: v.optional(v.string()),
    departureDateTime: v.optional(v.string()),
    seatsTotal: v.optional(v.number()),
    notes: v.optional(v.string()),
    status: v.optional(OFFER_STATUS),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const offer = await ctx.db.get(args.offerId);
    if (!offer) {
      throw new Error("Nie znaleziono oferty.");
    }
    if (offer.driverInvitationId !== args.invitationId) {
      throw new Error("Nie możesz edytować tej oferty.");
    }

    const carpoolDeadline = await getCarpoolDeadline(ctx);
    assertBeforeDeadline(carpoolDeadline);

    if (args.status === "cancelled") {
      await cancelOfferAndRequests(ctx, offer._id, "cancelled_by_driver");
      return null;
    }

    const acceptedSeats = await getAcceptedSeatsForOffer(ctx, offer._id);
    if (args.seatsTotal !== undefined) {
      ensurePositiveInteger(args.seatsTotal, "seatsTotal");
      if (args.seatsTotal < acceptedSeats) {
        throw new Error(
          "Nie można ustawić liczby miejsc poniżej liczby zaakceptowanych pasażerów."
        );
      }
    }
    if (args.departureDateTime !== undefined) {
      parseDateTime(args.departureDateTime);
    }

    const patch: Partial<Doc<"carpoolOffers">> = {
      updatedAt: Date.now(),
    };
    if (args.pickupPoint !== undefined) {
      patch.pickupPoint = normalizeOptional(args.pickupPoint);
    }
    if (args.dropoffPoint !== undefined) {
      patch.dropoffPoint = normalizeOptional(args.dropoffPoint);
    }
    if (args.departureDateTime !== undefined) {
      patch.departureDateTime = args.departureDateTime;
    }
    if (args.seatsTotal !== undefined) {
      patch.seatsTotal = args.seatsTotal;
    }
    if (args.notes !== undefined) {
      patch.notes = normalizeOptional(args.notes);
    }
    if (args.status !== undefined) {
      patch.status = args.status;
    }

    await ctx.db.patch(args.offerId, patch);
    return null;
  },
});

export const cancelOffer = mutation({
  args: {
    invitationId: v.id("invitations"),
    offerId: v.id("carpoolOffers"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const offer = await ctx.db.get(args.offerId);
    if (!offer) {
      throw new Error("Nie znaleziono oferty.");
    }
    if (offer.driverInvitationId !== args.invitationId) {
      throw new Error("Nie możesz anulować tej oferty.");
    }

    const carpoolDeadline = await getCarpoolDeadline(ctx);
    assertBeforeDeadline(carpoolDeadline);

    await cancelOfferAndRequests(ctx, offer._id, "cancelled_by_driver");
    return null;
  },
});

export const createRequest = mutation({
  args: {
    invitationId: v.id("invitations"),
    offerId: v.id("carpoolOffers"),
    seatsRequested: v.number(),
    message: v.optional(v.string()),
    mediationRequested: v.boolean(),
  },
  returns: v.id("carpoolRequests"),
  handler: async (ctx, args) => {
    const invitation = await getInvitationOrThrow(ctx, args.invitationId);
    if (!isPassengerEligible(invitation)) {
      throw new Error("Możesz zgłosić się do przejazdu tylko przy RSVP = tak.");
    }

    const carpoolDeadline = await getCarpoolDeadline(ctx);
    assertBeforeDeadline(carpoolDeadline);

    if (await hasPendingRequestForPassenger(ctx, args.invitationId)) {
      throw new Error("Masz już jedno oczekujące zgłoszenie.");
    }

    const offer = await ctx.db.get(args.offerId);
    if (!offer) {
      throw new Error("Nie znaleziono oferty.");
    }
    if (offer.driverInvitationId === args.invitationId) {
      throw new Error("Nie możesz zgłosić się do własnej oferty.");
    }
    if (offer.status !== "open") {
      throw new Error("Ta oferta nie przyjmuje już zgłoszeń.");
    }
    const driverInvitation = await ctx.db.get(offer.driverInvitationId);
    if (!driverInvitation || !isDriverEligible(driverInvitation)) {
      throw new Error("Ta oferta nie jest już dostępna.");
    }

    ensurePositiveInteger(args.seatsRequested, "seatsRequested");
    const passengerSeatLimit = await getPassengerSeatLimit(ctx, invitation);
    if (args.seatsRequested > passengerSeatLimit) {
      throw new Error("Przekroczono limit miejsc dla tego zaproszenia.");
    }

    const existingForOffer = await ctx.db
      .query("carpoolRequests")
      .withIndex("by_offer", (q) => q.eq("offerId", args.offerId))
      .collect();
    const ownActiveInOffer = existingForOffer.find(
      (request) =>
        request.passengerInvitationId === args.invitationId &&
        ACTIVE_REQUEST_STATUSES.has(request.status)
    );
    if (ownActiveInOffer) {
      throw new Error("Masz już aktywne zgłoszenie do tej oferty.");
    }

    const acceptedSeats = existingForOffer
      .filter((request) => request.status === "accepted")
      .reduce((sum, request) => sum + request.seatsRequested, 0);
    const seatsAvailable = offer.seatsTotal - acceptedSeats;
    if (args.seatsRequested > seatsAvailable) {
      throw new Error("Brak wystarczającej liczby wolnych miejsc.");
    }

    const now = Date.now();
    return await ctx.db.insert("carpoolRequests", {
      offerId: args.offerId,
      passengerInvitationId: args.invitationId,
      seatsRequested: args.seatsRequested,
      message: normalizeOptional(args.message),
      mediationRequested: args.mediationRequested,
      mediationResolvedAt: undefined,
      status: "pending",
      respondedAt: undefined,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const respondToRequest = mutation({
  args: {
    invitationId: v.id("invitations"),
    requestId: v.id("carpoolRequests"),
    decision: REQUEST_DECISION,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId);
    if (!request) {
      throw new Error("Nie znaleziono zgłoszenia.");
    }
    if (request.status !== "pending") {
      throw new Error("To zgłoszenie zostało już obsłużone.");
    }

    const offer = await ctx.db.get(request.offerId);
    if (!offer) {
      throw new Error("Nie znaleziono oferty.");
    }
    if (offer.driverInvitationId !== args.invitationId) {
      throw new Error("Nie możesz obsłużyć tego zgłoszenia.");
    }
    if (offer.status !== "open") {
      throw new Error("Ta oferta nie jest otwarta na nowe zgłoszenia.");
    }

    const carpoolDeadline = await getCarpoolDeadline(ctx);
    assertBeforeDeadline(carpoolDeadline);

    const now = Date.now();
    if (args.decision === "accept") {
      const acceptedSeats = await getAcceptedSeatsForOffer(ctx, offer._id);
      if (acceptedSeats + request.seatsRequested > offer.seatsTotal) {
        throw new Error("Brak miejsc na zaakceptowanie tego zgłoszenia.");
      }

      await ctx.db.patch(request._id, {
        status: "accepted",
        respondedAt: now,
        updatedAt: now,
      });

      if (acceptedSeats + request.seatsRequested >= offer.seatsTotal) {
        await ctx.db.patch(offer._id, {
          status: "closed",
          updatedAt: now,
        });
      }

      const passengerRequests = await ctx.db
        .query("carpoolRequests")
        .withIndex("by_passengerInvitation", (q) =>
          q.eq("passengerInvitationId", request.passengerInvitationId)
        )
        .collect();

      for (const otherRequest of passengerRequests) {
        if (
          otherRequest._id !== request._id &&
          otherRequest.status === "pending"
        ) {
          await ctx.db.patch(otherRequest._id, {
            status: "cancelled_system",
            respondedAt: now,
            updatedAt: now,
          });
        }
      }
    } else {
      await ctx.db.patch(request._id, {
        status: "rejected",
        respondedAt: now,
        updatedAt: now,
      });
    }

    return null;
  },
});

export const cancelRequest = mutation({
  args: {
    invitationId: v.id("invitations"),
    requestId: v.id("carpoolRequests"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId);
    if (!request) {
      throw new Error("Nie znaleziono zgłoszenia.");
    }
    if (request.passengerInvitationId !== args.invitationId) {
      throw new Error("Nie możesz anulować tego zgłoszenia.");
    }

    const carpoolDeadline = await getCarpoolDeadline(ctx);
    assertBeforeDeadline(carpoolDeadline);

    if (request.status !== "pending" && request.status !== "accepted") {
      throw new Error("To zgłoszenie nie może zostać anulowane.");
    }

    await ctx.db.patch(request._id, {
      status: "cancelled_by_passenger",
      respondedAt: Date.now(),
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const listMediationAlertsForAdmin = query({
  args: {},
  returns: v.array(
    v.object({
      requestId: v.id("carpoolRequests"),
      status: REQUEST_STATUS,
      seatsRequested: v.number(),
      createdAt: v.number(),
      passengerInvitationId: v.id("invitations"),
      passengerDisplayName: v.string(),
      driverInvitationId: v.id("invitations"),
      driverDisplayName: v.string(),
      offerId: v.id("carpoolOffers"),
      pickupPoint: v.optional(v.string()),
      dropoffPoint: v.optional(v.string()),
      departureDateTime: v.string(),
    })
  ),
  handler: async (ctx) => {
    const requests = await ctx.db
      .query("carpoolRequests")
      .withIndex("by_mediation", (q) =>
        q.eq("mediationRequested", true).eq("mediationResolvedAt", undefined)
      )
      .collect();

    const active = requests.filter(
      (request) => request.status === "pending" || request.status === "accepted"
    );

    const rows = await Promise.all(
      active.map(async (request) => {
        const offer = await ctx.db.get(request.offerId);
        if (!offer) return null;

        const passenger = await ctx.db.get(request.passengerInvitationId);
        const driver = await ctx.db.get(offer.driverInvitationId);

        return {
          requestId: request._id,
          status: request.status,
          seatsRequested: request.seatsRequested,
          createdAt: request.createdAt,
          passengerInvitationId: request.passengerInvitationId,
          passengerDisplayName: passenger?.displayName ?? "Gość",
          driverInvitationId: offer.driverInvitationId,
          driverDisplayName: driver?.displayName ?? "Gość",
          offerId: offer._id,
          pickupPoint: offer.pickupPoint,
          dropoffPoint: offer.dropoffPoint,
          departureDateTime: offer.departureDateTime,
        };
      })
    );

    return rows
      .filter((row): row is NonNullable<typeof row> => row !== null)
      .sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const resolveMediationAlert = mutation({
  args: {
    requestId: v.id("carpoolRequests"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId);
    if (!request || !request.mediationRequested) {
      throw new Error("Nie znaleziono alertu mediacji.");
    }
    if (request.mediationResolvedAt) {
      return null;
    }

    await ctx.db.patch(args.requestId, {
      mediationResolvedAt: Date.now(),
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const getAdminCarpoolOverview = query({
  args: {},
  returns: v.object({
    offers: v.array(
      v.object({
        _id: v.id("carpoolOffers"),
        driverInvitationId: v.id("invitations"),
        driverDisplayName: v.string(),
        driverArrivalDateTime: v.optional(v.string()),
        pickupPoint: v.optional(v.string()),
        dropoffPoint: v.optional(v.string()),
        departureDateTime: v.string(),
        seatsTotal: v.number(),
        status: OFFER_STATUS,
        seatsAccepted: v.number(),
        seatsAvailable: v.number(),
      })
    ),
    pendingRequests: v.array(
      v.object({
        _id: v.id("carpoolRequests"),
        offerId: v.id("carpoolOffers"),
        passengerDisplayName: v.string(),
        seatsRequested: v.number(),
        createdAt: v.number(),
      })
    ),
  }),
  handler: async (ctx) => {
    const offers = await ctx.db.query("carpoolOffers").collect();
    const pendingRequests = await ctx.db
      .query("carpoolRequests")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    const offerRows = await Promise.all(
      offers
        .slice()
        .sort((a, b) => parseDateTime(a.departureDateTime) - parseDateTime(b.departureDateTime))
        .map(async (offer) => {
          const driver = await ctx.db.get(offer.driverInvitationId);
          const seatsAccepted = await getAcceptedSeatsForOffer(ctx, offer._id);
          return {
            _id: offer._id,
            driverInvitationId: offer.driverInvitationId,
            driverDisplayName: driver?.displayName ?? "Gość",
            driverArrivalDateTime: driver?.arrivalDateTime,
            pickupPoint: offer.pickupPoint,
            dropoffPoint: offer.dropoffPoint,
            departureDateTime: offer.departureDateTime,
            seatsTotal: offer.seatsTotal,
            status: offer.status,
            seatsAccepted,
            seatsAvailable: Math.max(offer.seatsTotal - seatsAccepted, 0),
          };
        })
    );

    const requestRows = await Promise.all(
      pendingRequests
        .slice()
        .sort((a, b) => b.createdAt - a.createdAt)
        .map(async (request) => {
          const passenger = await ctx.db.get(request.passengerInvitationId);
          return {
            _id: request._id,
            offerId: request.offerId,
            passengerDisplayName: passenger?.displayName ?? "Gość",
            seatsRequested: request.seatsRequested,
            createdAt: request.createdAt,
          };
        })
    );

    return {
      offers: offerRows,
      pendingRequests: requestRows,
    };
  },
});
