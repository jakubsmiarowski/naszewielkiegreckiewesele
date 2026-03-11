import { mutation, query, type MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { getInternalApiKey } from "./adminConfig";
import { requireAdminAccess } from "./adminAuth";
import { writeAuditLog } from "./audit";
import { enforceCarpoolConsistencyAfterInvitationUpdate } from "./carpool";
import { resolveRsvpFlightDateTimes } from "../src/lib/rsvp-flight";

const RSVP_ATTENDANCE = v.union(v.literal("yes"), v.literal("no"));
const RSVP_TRANSPORT = v.union(v.literal("own"), v.literal("bus"));
const RSVP_CHILD_SLEEP_OPTION = v.union(
  v.literal("extraBed"),
  v.literal("crib")
);
const RSVP_ACCOMMODATION_TYPE = v.union(
  v.literal("hostProvided"),
  v.literal("selfArranged")
);
const RSVP_GUEST_ATTENDANCES = v.record(v.string(), RSVP_ATTENDANCE);

function normalizeChildrenCount(value: number | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(3, Math.trunc(value)));
}

function normalizeDateOnly(value: string | undefined) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    throw new Error("Podaj poprawny zakres dat dodatkowego noclegu.");
  }
  const [year, month, day] = trimmed.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    Number.isNaN(date.getTime()) ||
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error("Podaj poprawny zakres dat dodatkowego noclegu.");
  }
  return trimmed;
}

async function generateUniqueQrToken(ctx: MutationCtx) {
  for (let attempt = 0; attempt < 32; attempt += 1) {
    const token = randomToken();
    const existing = await ctx.db
      .query("invitations")
      .withIndex("by_token", (q) => q.eq("qrToken", token))
      .take(1);
    if (existing.length === 0) {
      return token;
    }
  }
  throw new Error("Nie udało się wygenerować unikalnego tokenu zaproszenia.");
}

async function generateUniqueShortCodeFromDb(ctx: MutationCtx) {
  for (let attempt = 0; attempt < 64; attempt += 1) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const existing = await ctx.db
      .query("invitations")
      .withIndex("by_short_code", (q) => q.eq("shortCode", code))
      .take(1);
    if (existing.length === 0) {
      return code;
    }
  }
  throw new Error("Nie udało się wygenerować unikalnego PIN-u zaproszenia.");
}

export const getIdByToken = query({
  args: { token: v.string() },
  returns: v.union(v.id("invitations"), v.null()),
  handler: async (ctx, args) => {
    const invitation = await ctx.db
      .query("invitations")
      .withIndex("by_token", (q) => q.eq("qrToken", args.token))
      .unique();
    return invitation?._id ?? null;
  },
});

export const getIdByShortCode = query({
  args: { shortCode: v.string() },
  returns: v.union(v.id("invitations"), v.null()),
  handler: async (ctx, args) => {
    const invitation = await ctx.db
      .query("invitations")
      .withIndex("by_short_code", (q) => q.eq("shortCode", args.shortCode))
      .unique();
    return invitation?._id ?? null;
  },
});

export const getById = query({
  args: { invitationId: v.id("invitations") },
  returns: v.object({
    invitation: v.object({
      _id: v.id("invitations"),
      _creationTime: v.number(),
      qrToken: v.string(),
      shortCode: v.string(),
      displayName: v.string(),
      isViewed: v.boolean(),
      notes: v.optional(v.string()),
      hasPlusOne: v.boolean(),
      plusOneName: v.optional(v.string()),
      plusOneAttendance: v.optional(RSVP_ATTENDANCE),
      attendance: v.optional(RSVP_ATTENDANCE),
      guestAttendances: v.optional(RSVP_GUEST_ATTENDANCES),
      answeredForAll: v.optional(v.boolean()),
      answeredForName: v.optional(v.string()),
      transport: v.optional(RSVP_TRANSPORT),
      carpoolDriverOptIn: v.optional(v.boolean()),
      arrivalDateTime: v.optional(v.string()),
      departureDateTime: v.optional(v.string()),
      childrenCount: v.optional(v.number()),
      childrenSleepOption: v.optional(RSVP_CHILD_SLEEP_OPTION),
      accommodationType: v.optional(RSVP_ACCOMMODATION_TYPE),
      needsExtraNightsHelp: v.optional(v.boolean()),
      extraNightsFromDate: v.optional(v.string()),
      extraNightsToDate: v.optional(v.string()),
      message: v.optional(v.string()),
      rsvpUpdatedAt: v.optional(v.number()),
    }),
    guests: v.array(
      v.object({
        _id: v.id("guests"),
        _creationTime: v.number(),
        invitationId: v.id("invitations"),
        fullName: v.string(),
        relation: v.optional(v.string()),
      })
    ),
  }),
  handler: async (ctx, args) => {
    const invitation = await ctx.db.get(args.invitationId);
    if (!invitation) {
      throw new Error("Invitation not found");
    }
    const guests = await ctx.db
      .query("guests")
      .withIndex("by_invitation", (q) => q.eq("invitationId", invitation._id))
      .collect();
    return { invitation, guests };
  },
});

export const listForAdmin = query({
  args: {
    adminAccessToken: v.optional(v.string()),
    internalApiKey: v.optional(v.string()),
  },
  returns: v.array(
    v.object({
      _id: v.id("invitations"),
      _creationTime: v.number(),
      qrToken: v.string(),
      shortCode: v.string(),
      displayName: v.string(),
      isViewed: v.boolean(),
      notes: v.optional(v.string()),
      hasPlusOne: v.boolean(),
      plusOneName: v.optional(v.string()),
      plusOneAttendance: v.optional(RSVP_ATTENDANCE),
      attendance: v.optional(RSVP_ATTENDANCE),
      guestAttendances: v.optional(RSVP_GUEST_ATTENDANCES),
      answeredForAll: v.optional(v.boolean()),
      answeredForName: v.optional(v.string()),
      transport: v.optional(RSVP_TRANSPORT),
      carpoolDriverOptIn: v.optional(v.boolean()),
      arrivalDateTime: v.optional(v.string()),
      departureDateTime: v.optional(v.string()),
      childrenCount: v.optional(v.number()),
      childrenSleepOption: v.optional(RSVP_CHILD_SLEEP_OPTION),
      accommodationType: v.optional(RSVP_ACCOMMODATION_TYPE),
      needsExtraNightsHelp: v.optional(v.boolean()),
      extraNightsFromDate: v.optional(v.string()),
      extraNightsToDate: v.optional(v.string()),
      message: v.optional(v.string()),
      rsvpUpdatedAt: v.optional(v.number()),
      guests: v.array(
        v.object({
          _id: v.id("guests"),
          _creationTime: v.number(),
          invitationId: v.id("invitations"),
          fullName: v.string(),
          relation: v.optional(v.string()),
        })
      ),
    })
  ),
  handler: async (ctx, args) => {
    const hasInternalAccess =
      typeof args.internalApiKey === "string" && args.internalApiKey === getInternalApiKey();
    if (!hasInternalAccess) {
      await requireAdminAccess(ctx, args.adminAccessToken ?? "");
    }
    const invitations = await ctx.db.query("invitations").collect();
    const guests = await ctx.db.query("guests").collect();

    const guestsByInvitation = new Map<string, typeof guests>();
    for (const guest of guests) {
      const list = guestsByInvitation.get(guest.invitationId) ?? [];
      list.push(guest);
      guestsByInvitation.set(guest.invitationId, list);
    }

    return invitations.map((invitation) => ({
      ...invitation,
      guests: guestsByInvitation.get(invitation._id) ?? [],
    }));
  },
});

export const updateRsvp = mutation({
  args: {
    invitationId: v.id("invitations"),
    guestAttendances: RSVP_GUEST_ATTENDANCES,
    transport: v.optional(RSVP_TRANSPORT),
    carpoolDriverOptIn: v.optional(v.boolean()),
    arrivalDateTime: v.optional(v.string()),
    departureDateTime: v.optional(v.string()),
    childrenCount: v.optional(v.number()),
    childrenSleepOption: v.optional(RSVP_CHILD_SLEEP_OPTION),
    accommodationType: v.optional(RSVP_ACCOMMODATION_TYPE),
    needsExtraNightsHelp: v.optional(v.boolean()),
    extraNightsFromDate: v.optional(v.string()),
    extraNightsToDate: v.optional(v.string()),
    message: v.optional(v.string()),
    plusOneName: v.optional(v.string()),
    plusOneAttendance: v.optional(RSVP_ATTENDANCE),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const invitation = await ctx.db.get(args.invitationId);
    if (!invitation) {
      throw new Error("Invitation not found");
    }

    const guests = await ctx.db
      .query("guests")
      .withIndex("by_invitation", (q) => q.eq("invitationId", args.invitationId))
      .collect();
    const normalizedGuests = guests
      .map((guest) => ({ _id: guest._id, fullName: guest.fullName.trim() }))
      .filter((guest) => guest.fullName.length > 0);
    if (normalizedGuests.length === 0) {
      throw new Error("Brak gości przypisanych do zaproszenia.");
    }

    const allowedGuestIds = new Set(normalizedGuests.map((guest) => guest._id));
    const providedGuestIds = Object.keys(args.guestAttendances).filter(Boolean);
    for (const guestId of providedGuestIds) {
      if (!allowedGuestIds.has(guestId as typeof normalizedGuests[number]["_id"])) {
        throw new Error("Wybierz osobę z listy zaproszenia.");
      }
    }

    const nextGuestAttendances: Record<string, "yes" | "no"> = {};
    for (const guest of normalizedGuests) {
      const attendance = args.guestAttendances[guest._id];
      if (attendance !== "yes" && attendance !== "no") {
        throw new Error("Wybierz odpowiedź dla każdej osoby na zaproszeniu.");
      }
      nextGuestAttendances[guest._id] = attendance;
    }

    const hasAnyYes = normalizedGuests.some(
      (guest) => nextGuestAttendances[guest._id] === "yes"
    );
    const aggregateAttendance: "yes" | "no" = hasAnyYes ? "yes" : "no";

    const patch: Record<string, unknown> = {
      attendance: aggregateAttendance,
      guestAttendances: nextGuestAttendances,
      answeredForAll: true,
      answeredForName: undefined,
      message: args.message?.trim(),
      rsvpUpdatedAt: Date.now(),
    };

    if (aggregateAttendance !== "yes") {
      patch.transport = undefined;
      patch.arrivalDateTime = undefined;
      patch.departureDateTime = undefined;
      patch.carpoolDriverOptIn = false;
      patch.plusOneName = undefined;
      patch.plusOneAttendance = undefined;
      patch.childrenCount = undefined;
      patch.childrenSleepOption = undefined;
      patch.accommodationType = undefined;
      patch.needsExtraNightsHelp = undefined;
      patch.extraNightsFromDate = undefined;
      patch.extraNightsToDate = undefined;
    } else {
      if (args.transport !== undefined) {
        patch.transport = args.transport;
      }

      const effectiveTransport = args.transport ?? invitation.transport;
      if (effectiveTransport !== "own") {
        patch.carpoolDriverOptIn = false;
      } else if (args.carpoolDriverOptIn !== undefined) {
        patch.carpoolDriverOptIn = args.carpoolDriverOptIn === true;
      }

      const flightDateTimes = resolveRsvpFlightDateTimes({
        arrivalDateTime: args.arrivalDateTime,
        departureDateTime: args.departureDateTime,
      });
      patch.arrivalDateTime = flightDateTimes.arrivalDateTime;
      patch.departureDateTime = flightDateTimes.departureDateTime;
      if (args.plusOneAttendance !== undefined) {
        patch.plusOneAttendance = args.plusOneAttendance;
      }
      if (args.plusOneName !== undefined) {
        patch.plusOneName = args.plusOneName.trim();
      }

      if (args.childrenCount !== undefined) {
        if (
          !Number.isInteger(args.childrenCount) ||
          args.childrenCount < 0 ||
          args.childrenCount > 3
        ) {
          throw new Error("Liczba dzieci musi być od 0 do 3.");
        }
      }

      const effectiveChildrenCount = normalizeChildrenCount(
        args.childrenCount ?? invitation.childrenCount
      );
      patch.childrenCount = effectiveChildrenCount;
      if (effectiveChildrenCount > 0) {
        const effectiveSleepOption =
          args.childrenSleepOption ?? invitation.childrenSleepOption;
        if (effectiveSleepOption !== "extraBed" && effectiveSleepOption !== "crib") {
          throw new Error("Wybierz dostawkę lub łóżeczko dla dzieci.");
        }
        patch.childrenSleepOption = effectiveSleepOption;
      } else {
        patch.childrenSleepOption = undefined;
      }

      const effectiveAccommodationType =
        args.accommodationType ?? invitation.accommodationType;
      if (
        effectiveAccommodationType !== "hostProvided" &&
        effectiveAccommodationType !== "selfArranged"
      ) {
        throw new Error("Wybierz opcję noclegu.");
      }
      patch.accommodationType = effectiveAccommodationType;
      if (effectiveAccommodationType === "hostProvided") {
        const needsExtraNightsHelp =
          args.needsExtraNightsHelp ?? invitation.needsExtraNightsHelp ?? false;
        patch.needsExtraNightsHelp = needsExtraNightsHelp;
        if (needsExtraNightsHelp) {
          const extraNightsFromDate = normalizeDateOnly(
            args.extraNightsFromDate ?? invitation.extraNightsFromDate
          );
          const extraNightsToDate = normalizeDateOnly(
            args.extraNightsToDate ?? invitation.extraNightsToDate
          );
          if (!extraNightsFromDate || !extraNightsToDate) {
            throw new Error("Wybierz daty Od i Do dla dodatkowego noclegu.");
          }
          if (extraNightsToDate < extraNightsFromDate) {
            throw new Error("Data Do dodatkowego noclegu nie może być wcześniejsza niż Od.");
          }
          patch.extraNightsFromDate = extraNightsFromDate;
          patch.extraNightsToDate = extraNightsToDate;
        } else {
          patch.extraNightsFromDate = undefined;
          patch.extraNightsToDate = undefined;
        }
      } else {
        patch.needsExtraNightsHelp = false;
        patch.extraNightsFromDate = undefined;
        patch.extraNightsToDate = undefined;
      }
    }

    await ctx.db.patch(args.invitationId, patch);
    await enforceCarpoolConsistencyAfterInvitationUpdate(ctx, args.invitationId);
    await writeAuditLog(ctx, {
      action: "rsvp.updated",
      actorType: "invitation",
      actorId: String(args.invitationId),
      entityType: "invitation",
      entityId: args.invitationId,
      metadata: {
        aggregateAttendance,
        transport: patch.transport ?? invitation.transport,
        carpoolDriverOptIn: patch.carpoolDriverOptIn ?? invitation.carpoolDriverOptIn,
        arrivalDateTime: patch.arrivalDateTime ?? invitation.arrivalDateTime,
        departureDateTime: patch.departureDateTime ?? invitation.departureDateTime,
        childrenCount: Object.prototype.hasOwnProperty.call(
          patch,
          "childrenCount"
        )
          ? patch.childrenCount
          : invitation.childrenCount,
        accommodationType: Object.prototype.hasOwnProperty.call(
          patch,
          "accommodationType"
        )
          ? patch.accommodationType
          : invitation.accommodationType,
        needsExtraNightsHelp: Object.prototype.hasOwnProperty.call(
          patch,
          "needsExtraNightsHelp"
        )
          ? patch.needsExtraNightsHelp
          : invitation.needsExtraNightsHelp,
        extraNightsFromDate: Object.prototype.hasOwnProperty.call(
          patch,
          "extraNightsFromDate"
        )
          ? patch.extraNightsFromDate
          : invitation.extraNightsFromDate,
        extraNightsToDate: Object.prototype.hasOwnProperty.call(
          patch,
          "extraNightsToDate"
        )
          ? patch.extraNightsToDate
          : invitation.extraNightsToDate,
      },
    });
    return null;
  },
});

export const markViewed = mutation({
  args: { invitationId: v.id("invitations") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.invitationId, { isViewed: true });
    return null;
  },
});

export const createSingleInvitation = mutation({
  args: {
    adminAccessToken: v.optional(v.string()),
    internalApiKey: v.optional(v.string()),
    guests: v.array(v.string()),
    hasPlusOne: v.optional(v.boolean()),
    notes: v.optional(v.string()),
  },
  returns: v.object({
    invitationId: v.id("invitations"),
    displayName: v.string(),
    shortCode: v.string(),
    qrToken: v.string(),
    guests: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    const hasInternalAccess =
      typeof args.internalApiKey === "string" && args.internalApiKey === getInternalApiKey();
    let actorId = "system:internal-api-key";
    if (!hasInternalAccess) {
      const admin = await requireAdminAccess(ctx, args.adminAccessToken ?? "");
      actorId = admin.email;
    }

    const normalizedGuests = args.guests
      .map((guest) => guest.trim())
      .filter((guest) => guest.length > 0);
    const deduplicatedGuests = Array.from(new Set(normalizedGuests));
    if (deduplicatedGuests.length === 0) {
      throw new Error("Podaj przynajmniej jednego gościa do zaproszenia.");
    }

    const qrToken = await generateUniqueQrToken(ctx);
    const shortCode = await generateUniqueShortCodeFromDb(ctx);
    const displayName = buildDisplayName(deduplicatedGuests);
    const notes = args.notes?.trim();
    const invitationId = await ctx.db.insert("invitations", {
      qrToken,
      shortCode,
      displayName,
      isViewed: false,
      notes: notes && notes.length > 0 ? notes : undefined,
      hasPlusOne: args.hasPlusOne === true,
      plusOneName: undefined,
      plusOneAttendance: undefined,
      attendance: undefined,
      guestAttendances: undefined,
      answeredForAll: undefined,
      answeredForName: undefined,
      transport: undefined,
      arrivalDateTime: undefined,
      departureDateTime: undefined,
      childrenCount: undefined,
      childrenSleepOption: undefined,
      accommodationType: undefined,
      needsExtraNightsHelp: undefined,
      extraNightsFromDate: undefined,
      extraNightsToDate: undefined,
      message: undefined,
      rsvpUpdatedAt: undefined,
    });

    for (const guestName of deduplicatedGuests) {
      await ctx.db.insert("guests", {
        invitationId,
        fullName: guestName,
        relation: RELATION_BY_NAME.get(normalizeCompare(guestName)),
      });
    }

    await writeAuditLog(ctx, {
      action: "invitation.created",
      actorType: hasInternalAccess ? "system" : "admin",
      actorId,
      entityType: "invitation",
      entityId: String(invitationId),
      metadata: {
        guests: deduplicatedGuests,
        hasPlusOne: args.hasPlusOne === true,
      },
    });

    return {
      invitationId,
      displayName,
      shortCode,
      qrToken,
      guests: deduplicatedGuests,
    };
  },
});

// Demo-safe invitation seed list (fictional data).
const RAW_GUEST_LIST = `
Marek Cichocki
Zofia Cichocka

---

## Julia Wrona +1

---

Adam Wolski
Ewa Wolska

---

## Wojciech Ryba +1

---

Aneta Lis
Robert Lis

---

Paulina Łukasik
Marcin Łukasik

---

Piotr Kurek
Iwona Kurek

---

## Natalia Nita +1

---

## Alicja Chmura

---

## Michał Kania +1

---

Damian Mrozowski
Agnieszka Mrozowska

---

Magdalena Chojnacka
Mateusz Chojnacki

---

## Karol Tarnowski +1

---

Tomasz Bratek
Joanna Bratek

---

Jan Rytel
Alicja Rytel

---

Karol Raczyński
Dorota Raczyńska

---

Leon Błaszczyk
Nadia Błaszczyk

---

Igor Chaberski
Olga Chaberska

---

Wojciech Mróz
Ewelina Mróz

---

Dawid Kos
Gosia Kos

---

Mikołaj Pytel
Martyna Pytel

---

Marcin Baran
Magda Baran

---

## Konrad Sarnowski +1

---

Magda Ptak
Paweł Ptak

---

Agata Ogonowska
Maciej Ogonowski

---

## Krzysztof Dunal +1

---

## Julia Rudnik +1
`;

function normalizeName(line: string) {
  return line.replace(/^##\s*/, "").trim();
}

function extractGuestsFromBlock(block: string) {
  const lines = block
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const guests: string[] = [];
  let hasPlusOne = false;

  for (const line of lines) {
    const cleaned = normalizeName(line);
    if (!cleaned) continue;
    if (cleaned.includes("+1")) {
      hasPlusOne = true;
      guests.push(cleaned.replace("+1", "").trim());
    } else {
      guests.push(cleaned);
    }
  }

  return { guests, hasPlusOne };
}

function buildDisplayName(guestNames: string[]) {
  const firstNames = guestNames.map((name) => name.split(" ")[0]).filter(Boolean);
  if (firstNames.length === 0) return "Goście";
  if (firstNames.length === 1) return firstNames[0];
  return `${firstNames.slice(0, -1).join(", ")} i ${firstNames.at(-1)}`;
}

function normalizeCompare(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

const RELATION_BY_NAME = new Map<string, string>([
  [normalizeCompare("Mateusz Chojnacki"), "swiadek"],
  [normalizeCompare("Magda Ptak"), "swiadkowa"],
]);

function randomToken() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}

function randomShortCode(existing: Set<string>) {
  let code = "";
  do {
    code = Math.floor(100000 + Math.random() * 900000).toString();
  } while (existing.has(code));
  existing.add(code);
  return code;
}

export const seedInvitations = mutation({
  args: {
    adminAccessToken: v.string(),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    const admin = await requireAdminAccess(ctx, args.adminAccessToken);
    const existing = await ctx.db.query("invitations").take(1);
    if (existing.length > 0) {
      throw new Error("Zaproszenia już istnieją. Usuń je przed seedem.");
    }

    const blocks = RAW_GUEST_LIST.split(/\n-{3,}\n/g)
      .map((block) => block.trim())
      .filter(Boolean);

    const shortCodes = new Set<string>();
    let count = 0;

    for (const block of blocks) {
      const { guests, hasPlusOne } = extractGuestsFromBlock(block);
      if (guests.length === 0) continue;

      const invitationId = await ctx.db.insert("invitations", {
        qrToken: randomToken(),
        shortCode: randomShortCode(shortCodes),
        displayName: buildDisplayName(guests),
        isViewed: false,
        notes: undefined,
        hasPlusOne,
        plusOneName: undefined,
        plusOneAttendance: undefined,
        attendance: undefined,
        guestAttendances: undefined,
        answeredForAll: undefined,
        answeredForName: undefined,
        transport: undefined,
        arrivalDateTime: undefined,
        departureDateTime: undefined,
        childrenCount: undefined,
        childrenSleepOption: undefined,
        accommodationType: undefined,
        needsExtraNightsHelp: undefined,
        extraNightsFromDate: undefined,
        extraNightsToDate: undefined,
        message: undefined,
        rsvpUpdatedAt: undefined,
      });

      for (const guestName of guests) {
        await ctx.db.insert("guests", {
          invitationId,
          fullName: guestName,
          relation: RELATION_BY_NAME.get(normalizeCompare(guestName)),
        });
      }

      count += 1;
    }

    await writeAuditLog(ctx, {
      action: "invitations.seeded",
      actorType: "admin",
      actorId: admin.email,
      entityType: "invitations",
      metadata: { count },
    });

    return count;
  },
});

export const resetRsvpForAllInvitations = mutation({
  args: {
    adminAccessToken: v.string(),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    const admin = await requireAdminAccess(ctx, args.adminAccessToken);
    const invitations = await ctx.db.query("invitations").collect();

    for (const invitation of invitations) {
      await ctx.db.patch(invitation._id, {
        plusOneName: undefined,
        plusOneAttendance: undefined,
        attendance: undefined,
        guestAttendances: undefined,
        answeredForAll: undefined,
        answeredForName: undefined,
        transport: undefined,
        carpoolDriverOptIn: undefined,
        arrivalDateTime: undefined,
        departureDateTime: undefined,
        childrenCount: undefined,
        childrenSleepOption: undefined,
        accommodationType: undefined,
        needsExtraNightsHelp: undefined,
        extraNightsFromDate: undefined,
        extraNightsToDate: undefined,
        message: undefined,
        rsvpUpdatedAt: undefined,
      });
      await enforceCarpoolConsistencyAfterInvitationUpdate(ctx, invitation._id);
    }

    await writeAuditLog(ctx, {
      action: "invitations.rsvp_reset_all",
      actorType: "admin",
      actorId: admin.email,
      entityType: "invitations",
      metadata: { count: invitations.length },
    });

    return invitations.length;
  },
});
