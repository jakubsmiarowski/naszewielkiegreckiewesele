---
trigger: always_on
---

---

name: convex-rules
description: Convex coding rules and patterns for generating correct Convex code. YOU MUST USE THIS SKILL WHENEVER YOU DEAL WITH CONVEX CODE.

---

This file is for LLMs generating Convex code.
To dive deeper into any topic, USE THE CONVEX-DOCS SKILL to get official documentation links.

## Core Model

- Convex is a reactive, transactional database + TypeScript function runtime.
- Backend code lives in `convex/`. Client code typically in `src/`.
- NO SQL, NO ORMs. All reads/writes go through `ctx.db` inside functions.
- File-based routing: file path + export name => function reference.

## Files And Ownership

- `convex/schema.ts`: schema and indexes.
- `convex/http.ts`: HTTP endpoints.
- `convex/crons.ts`: scheduled jobs.
- `convex/_generated/*`: AUTO-GENERATED, NEVER EDIT.

## Function Definition (MANDATORY PATTERN)

ALWAYS use args and returns validators for EVERY function type.

```ts
import { query } from "./_generated/server";
import { v } from "convex/values";

export const greet = query({
  args: { name: v.string() },
  returns: v.string(),
  handler: async (ctx, args) => "Hello " + args.name,
});
```

Rules:

- ALWAYS set `args` (use `args: {}` if none).
- ALWAYS set `returns` (use `returns: v.null()` for void).
- `undefined` is NOT a valid Convex value. If a function returns nothing, the client gets `null`.

## Public vs Internal

- Public: `query`, `mutation`, `action` => `api.file.fn`.
- Internal: `internalQuery`, `internalMutation`, `internalAction` => `internal.file.fn`.
- NEVER expose sensitive logic as public functions.
- You CANNOT register functions via `api` or `internal` objects.

## Calling Other Functions

- Use `ctx.runQuery`, `ctx.runMutation`, `ctx.runAction` with FunctionReferences.
- NEVER pass a raw function to `ctx.run*`.
- When calling a function in the SAME FILE, add explicit type annotation to avoid TS circularity.

Example:

```ts
const result: string = await ctx.runQuery(api.users.getName, { id });
```

## Validators And Types

- Use `v.int64()` for 64-bit integers. DO NOT use `v.bigint()`.
- Use `v.record()` for records. `v.map()` and `v.set()` are NOT supported.
- Use `v.id("table")` and `Id<"table">` instead of raw `string` IDs.
- `v.null()` is REQUIRED when returning null.
- Object field names must be nonempty and must NOT start with `_` or `$`.
- Record keys must be ASCII, nonempty, and must NOT start with `_` or `$`.
- Arrays max 8192 items, objects max 1024 fields.
- System fields auto-added: `_id`, `_creationTime`.

## Schema And Indexes

- Define schema in `convex/schema.ts` using `defineSchema` and `defineTable`.
- Index names MUST include all indexed fields: `by_field1_and_field2`.
- Index order matters. Query fields in the SAME order as defined.

## Database Access

- ALWAYS pass table name explicitly for `get`, `patch`, `replace`, `delete`.

```ts
await ctx.db.get("users", userId);
await ctx.db.patch("users", userId, { name: "Ada" });
```

## Querying Rules

- DO NOT use `.filter()` on large tables. Use `.withIndex()`.
- Default order is ascending `_creationTime`. Use `.order("asc"|"desc")`.
- `.unique()` returns a single doc and throws if multiple match.
- Queries do NOT support `.delete()`. Collect results and delete by `_id`.
- For large or streaming reads, use `for await (const row of query)` instead of `.collect()` or `.take()`.
- Queries must be deterministic. NO external fetch in queries. Use actions for that.

## Pagination

- Use `paginationOptsValidator` and `.paginate(opts)`.
- Pagination results include extra internal fields; use `returns: v.any()` or omit returns.
- `paginationOpts`: `{ numItems: number, cursor: string | null }`.
- Result: `{ page, isDone, continueCursor }`.

## Mutations

- Use `ctx.db.patch` for partial updates, `ctx.db.replace` for full replace.
- Keep mutations focused; avoid touching thousands of documents in one mutation.

## Actions

- Use for external APIs or long-running work.
- Actions CANNOT access `ctx.db` directly. Use `ctx.runQuery`/`ctx.runMutation`.
- Add `"use node";` at the top when using Node built-ins.
- Add `@types/node` to `package.json` when using Node built-ins.
- Only call actions from actions if crossing runtimes (V8 <-> Node).

## HTTP Endpoints

- Define in `convex/http.ts` using `httpRouter` + `httpAction`.
- `path` is the EXACT URL path.

## Crons

- Define in `convex/crons.ts` using `cronJobs()`.
- Use ONLY `crons.interval` or `crons.cron` (NOT hourly/daily/weekly helpers).
- Cron targets MUST be FunctionReferences.
- If a cron calls an internal function, import `internal` from `_generated/api` even if same file.

## File Storage

- `ctx.storage.getUrl(fileId)` returns a signed URL or `null`.
- `ctx.storage.getMetadata()` is DEPRECATED.
- Use `ctx.db.system.get("_storage", fileId)` to read metadata.
- Storage values are Blobs; convert to/from ArrayBuffer as needed.

## Search

- Use `.withSearchIndex()` for full text search.

## TypeScript Usage

- Prefer helper functions for shared logic instead of extra Convex functions.
- Use `as const` for discriminated union string literals.

## Non-Negotiables

1. ALWAYS use new function syntax with args + returns validators.
2. NEVER edit `_generated/*`.
3. NEVER use `ctx.db` inside actions.
4. ALWAYS use `api.*` or `internal.*` references, NEVER raw functions.
5. ALWAYS use indexes for scalable queries; avoid `.filter()`.
