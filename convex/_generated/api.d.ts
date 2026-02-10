/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as adminAuth from "../adminAuth.js";
import type * as adminConfig from "../adminConfig.js";
import type * as adminUsers from "../adminUsers.js";
import type * as adminUsersStore from "../adminUsersStore.js";
import type * as audit from "../audit.js";
import type * as carpool from "../carpool.js";
import type * as guests from "../guests.js";
import type * as invitations from "../invitations.js";
import type * as questions from "../questions.js";
import type * as security from "../security.js";
import type * as settings from "../settings.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  adminAuth: typeof adminAuth;
  adminConfig: typeof adminConfig;
  adminUsers: typeof adminUsers;
  adminUsersStore: typeof adminUsersStore;
  audit: typeof audit;
  carpool: typeof carpool;
  guests: typeof guests;
  invitations: typeof invitations;
  questions: typeof questions;
  security: typeof security;
  settings: typeof settings;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
