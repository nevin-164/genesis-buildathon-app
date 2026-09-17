import type { Role } from "@/types/contracts";

/**
 * Who may see what, in one table.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * NO `server-only` HERE, and nothing heavier than a type import. `src/proxy.ts`
 * imports this file, and the proxy runs before the React runtime exists.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * The rule used to live in three places — `config.matcher`, `isProtected()` and
 * `isAllowed()` in the proxy, plus a hard-coded role list per page guard in
 * `dal.ts`. Four copies of one decision is four chances to add a route to three
 * of them. Now the proxy and the page guards both read this list, and
 * `config.matcher` is the only literal left (Next requires it to be statically
 * analysable, so it cannot be computed from here — `/dev/checks` asserts the
 * two agree).
 */

export type Access =
  /** Anyone, signed in or not. */
  | { kind: "public" }
  /** Signed-out only. A signed-in visitor is sent to their own dashboard. */
  | { kind: "guest" }
  /** Signed in, and holding one of these roles. */
  | { kind: "roles"; roles: readonly Role[] };

export type RoutePolicy = { prefix: string; access: Access };

/**
 * Ordered — the first matching prefix wins, so the most specific comes first.
 * `/` matches everything and therefore has to be last.
 */
export const ROUTE_POLICY = [
  { prefix: "/admin", access: { kind: "roles", roles: ["admin"] } },
  { prefix: "/faculty", access: { kind: "roles", roles: ["faculty", "admin"] } },
  // Staff read Explore too — it is the whole point of them verifying it — so
  // every signed-in role passes the student area. The controllers still scope
  // what each of them can actually load.
  { prefix: "/student", access: { kind: "roles", roles: ["student", "faculty", "admin"] } },
  { prefix: "/login", access: { kind: "guest" } },
  { prefix: "/register", access: { kind: "guest" } },
  { prefix: "/", access: { kind: "public" } },
] as const satisfies readonly RoutePolicy[];

/**
 * A prefix matches a path segment boundary, never a partial word: `/admin`
 * covers `/admin` and `/admin/users` but must not swallow a future
 * `/administration`.
 */
function matches(pathname: string, prefix: string): boolean {
  if (prefix === "/") return true;
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function policyFor(pathname: string): Access {
  for (const rule of ROUTE_POLICY) {
    if (matches(pathname, rule.prefix)) return rule.access;
  }
  // Unreachable — the "/" rule catches everything. Closed, not open, regardless.
  return { kind: "roles", roles: [] };
}

/**
 * The role list for an area, for the page guards in `dal.ts`. Throws on an
 * unknown prefix rather than returning an empty list, because an empty list
 * silently locks every role out of a page that looked guarded.
 */
export function rolesFor(prefix: string): readonly Role[] {
  const rule = ROUTE_POLICY.find((entry) => entry.prefix === prefix);
  if (!rule || rule.access.kind !== "roles") {
    throw new Error(`route-policy: "${prefix}" is not a role-guarded prefix.`);
  }
  return rule.access.roles;
}

/** Does this path need a session at all? */
export function isProtected(pathname: string): boolean {
  return policyFor(pathname).kind === "roles";
}

/** Coarse, by URL prefix. The page guards and controllers do the real check. */
export function isAllowed(pathname: string, role: Role): boolean {
  const access = policyFor(pathname);
  return access.kind === "roles" ? access.roles.includes(role) : true;
}

/** Every role-guarded prefix — what `config.matcher` has to cover. */
export function protectedPrefixes(): string[] {
  return ROUTE_POLICY.filter((rule) => rule.access.kind === "roles").map((rule) => rule.prefix);
}
