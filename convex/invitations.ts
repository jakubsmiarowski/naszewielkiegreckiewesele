import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const RSVP_ATTENDANCE = v.union(v.literal("yes"), v.literal("no"));
const RSVP_TRANSPORT = v.union(v.literal("own"), v.literal("bus"));

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
      answeredForAll: v.optional(v.boolean()),
      answeredForName: v.optional(v.string()),
      transport: v.optional(RSVP_TRANSPORT),
      arrivalDateTime: v.optional(v.string()),
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
  args: {},
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
      answeredForAll: v.optional(v.boolean()),
      answeredForName: v.optional(v.string()),
      transport: v.optional(RSVP_TRANSPORT),
      arrivalDateTime: v.optional(v.string()),
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
  handler: async (ctx) => {
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
    attendance: RSVP_ATTENDANCE,
    answeredForAll: v.boolean(),
    answeredForName: v.optional(v.string()),
    transport: v.optional(RSVP_TRANSPORT),
    arrivalDateTime: v.optional(v.string()),
    message: v.optional(v.string()),
    plusOneName: v.optional(v.string()),
    plusOneAttendance: v.optional(RSVP_ATTENDANCE),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const patch: Record<string, unknown> = {
      attendance: args.attendance,
      answeredForAll: args.answeredForAll,
      answeredForName: args.answeredForName,
      message: args.message,
      plusOneName: args.plusOneName,
      plusOneAttendance: args.plusOneAttendance,
      rsvpUpdatedAt: Date.now(),
    };

    if (args.transport !== undefined) {
      patch.transport = args.transport;
    } else {
      patch.transport = undefined;
    }

    if (args.arrivalDateTime !== undefined) {
      patch.arrivalDateTime = args.arrivalDateTime;
    } else {
      patch.arrivalDateTime = undefined;
    }

    await ctx.db.patch(args.invitationId, patch);
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

// Keep this list in sync with docs/lista-gosci.md
const RAW_GUEST_LIST = `
Paweł Ostaszewski
Krystyna Ostaszewska

---

## Katarzyna Śmiarowska +1

---

Artur Śmiarowski
Monika Gałecka

---

## Franek Śmiarowski +1

---

Anna Gołębiewska
Robert Gołębiewski

---

Sylwia Pazgan
Marzena Barchacka

---

Paweł Muszyński
Monika Muszyńska

---

## Magda Muszyńska +1

---

## Marzena Podymska

---

## Michał Muszyński +1

---

Janusz Pazgan
Edyta Pazgan

---

Patrycja Pazgan
Ryan Nietzsche

---

## Karol Muszyński +1

---

Kacper Tyszkiewicz
Marta Żmuchowska

---

Jan Biardzki
Alicja Biardzka

---

Kuba Radolak
Dorota Kruszyńska

---

Mateusz Szymczak
Karolina Szymczak

---

Adam Sajkowski
Ola Sajkowska

---

Wojtek Puczyński
Ewelina Mazurek

---

Dawid Frieske
Gosia Frieske

---

Mikołaj Przychodzki
Martyna Przychodzka

---

Marcin Walczak
Magda Walczak

---

## Konrad Michalski +1

---

Magda Woźniakowska
Paweł Marszałek

---

Agata Woźniakowska
Maciej Sugajski

---

## Krzysztof Batorski +1

---

## Julia Strus +1

---
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
  [normalizeCompare("Mateusz Szymczak"), "swiadek"],
  [normalizeCompare("Magda Woźniakowska"), "swiadkowa"],
  [normalizeCompare("Magda Wożniakowska"), "swiadkowa"],
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
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
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
        answeredForAll: undefined,
        answeredForName: undefined,
        transport: undefined,
        arrivalDateTime: undefined,
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

    return count;
  },
});
