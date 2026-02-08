# Wedding App Architecture Specification

## 1. Project Overview

Building a wedding RSVP and information application.
**Core Philosophy:** Frictionless, passwordless authentication using physical invitations.
**Key Concept:** "Group Identity" - Authentication is tied to an **Invitation** (a physical envelope), not an individual user. One Invitation controls access for multiple Guests (e.g., a couple or a family).

## 2. Tech Stack

- **Framework:** TanStack Start (React, SSR, Server Actions)
- **Backend/Database:** Convex (Real-time database, backend functions)
- **Language:** TypeScript
- **Styling:** Tailwind CSS

---

## 3. Database Schema (Convex)

The schema must support the "One Invitation -> Many Guests" relationship and the hybrid authentication method (QR Token + Backup Short Code).

### File: `convex/schema.ts`

```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Represents a physical invitation (Group)
  invitations: defineTable({
    // 1. SECURITY TOKENS
    qrToken: v.string(), // UUID/Nanoid (Long, secure, for QR URLs)
    shortCode: v.string(), // 6 char PIN (e.g., "123456", for manual entry, each invitation has its own unique short code)

    // 2. METADATA
    displayName: v.string(), // Friendly name (e.g., "Ciocia Krysia i Wujek Staszek")
    isViewed: v.boolean(), // Analytics: has this code been scanned?

    // 3. LOGISTICS
    notes: v.optional(v.string()), // Internal notes from the bride/groom
  })
    .index("by_token", ["qrToken"]) // Fast lookup for QR scans
    .index("by_short_code", ["shortCode"]), // Fast lookup for manual login

  // Represents an individual person
  guests: defineTable({
    invitationId: v.id("invitations"),
    fullName: v.string(),

    // RSVP Status
    isConfirmed: v.boolean(), // Will they come?
    isDeclined: v.boolean(), // Did they say no?

    // Details
    dietaryRestrictions: v.optional(v.string()), // e.g., "Vegan", "Nut allergy"
    accommodationNeeded: v.boolean(), // Do they need a hotel?
    isChild: v.optional(v.boolean()), // For menu planning
  }).index("by_invitation", ["invitationId"]),
});
```

## 4. Authentication Flow (Hybrid)

We need persistent sessions (long-lived cookies) so users don't need to re-scan the code if they lose the paper invitation.

Method A: QR Code Scan (Primary)
User Action: Scans QR code printed on the invitation.

URL: https://app.com/auth/verify?token=LONG_UUID_HERE

Loader Logic:

Validates token against invitations table (index by_token).

If valid: Sets a secure HTTP-only cookie with invitationId.

Redirects to /dashboard.

Method B: Manual PIN Entry (Fallback)
User Action: User loses invitation, goes to https://app.com/login.

UI: Simple form asking for "Kod z zaproszenia" (Short Code).

Server Action:

Queries invitations table using index by_short_code.

If valid: Sets the same cookie as Method A.

Redirects to /dashboard.

Session Policy
Cookie Lifetime: 90 days (effectively "forever" for the context of a wedding).

Middleware: Checks for invitationId cookie on protected routes.

## 5. UI Structure & Routes

/auth/verify (API Route / Loader)
Endpoint specifically for handling QR code redirects.

Param: ?token=...

Logic: Validate -> Set Cookie -> Redirect.

/login (Public)
Fallback page.

Contains the "Enter PIN" form.

Design: Clean, elegant, wedding theme.

/ (Dashboard - Protected)
Loader: Requires invitationId cookie. Fetches Invitation + Guests list.

Header: "Witamy, {invitation.displayName}!"

## 6. Implementation Plan for Agent

Database: Copy the schema.ts provided above into convex/schema.ts.

Seeding: Create a convex/seed.ts script to populate the DB with invitations from @lista-gosci.md. people are separated by --- this means they are different invitations. example Mateusz Szymczak Karolina Szymczak is one invitation, but if there is --- between them it means they are different invitations. if there is +1 it means there is one guest more and we need ask for their name. if there is no +1 it means there is only one guest like Marzena Podymska.

Backend Queries: Implement convex/invitations.ts (getByToken, getByShortCode) and convex/guests.ts (updateStatus).

Auth Layer: Implement the TanStack Start Server Functions to handle cookie setting.

Frontend: Build the Dashboard (/) first to visualize the guest list.

## 7. Cleanup

Right now we have Google login which we don't need really. We should remove it and use only our custom authentication.
