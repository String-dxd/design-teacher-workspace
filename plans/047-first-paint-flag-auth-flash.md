# Plan 047: Kill the first-paint flag/auth flash — cookie-seeded SSR values

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving on. On
> any STOP condition, stop and report — do not improvise. When done, update
> this plan's row in `plans/README.md` — unless a reviewer dispatched you and
> told you they maintain the index.
>
> **Drift check (run first)**: `git diff --stat 41c5962..HEAD -- src/lib/feature-flags/context.tsx src/lib/auth.tsx src/routes/__root.tsx`
> Plan 043 intentionally edits `context.tsx` first — diff against 043's
> landed state, not the excerpts below, for that file. Other drift → STOP.
>
> **NEVER run `bun run check`.** Targeted `bunx prettier --check <file>` /
> `bunx eslint <file>` only.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED
- **Depends on**: plans/043-feature-flag-hierarchy.md (lands `readEffectiveFlags`
  and the reconcile in `loadFlags`; this plan builds on that file's landed shape)
- **Category**: bug (UX correctness)
- **Planned at**: commit `41c5962`, 2026-07-19

## Why this matters

Both app-wide providers render placeholder state on the server and for the
first client render, then swap in the user's real values in a post-mount
effect. For anyone whose flags differ from registry defaults (every demo
user who toggled anything on `/flags`) the whole chrome renders wrong for a
frame on **every page load** — sidebar items pop in/out, gated sections
flash — and the long-standing "FeatureFlagProvider off-default hydration
warning" noted in prior rounds traces to this swap. The fix: mirror the
stored values into a cookie, read the cookie during SSR in the root route's
loader, and initialize both providers from that loader data so the server
HTML, the first client render, and the post-mount state all agree.
localStorage/sessionStorage remain the client source of truth; the cookie is
a render-seed mirror.

## Current state

- `src/lib/feature-flags/context.tsx` — after plan 043: provider state starts
  at `DEFAULT_FEATURE_FLAGS`; mount effect swaps in `loadFlags()` (localStorage,
  key `'feature_flags'` from `FEATURE_FLAGS_STORAGE_KEY`); a second effect
  persists on change once hydrated; `isEnabled` resolves parent-aware
  effective values; `readEffectiveFlags()` exists for route guards.
- `src/lib/auth.tsx:29-45` — `loadAuth()` reads
  `sessionStorage.getItem(AUTH_STORAGE_KEY) === 'true'`; `AuthProvider`
  initializes `isLoggedIn` to `false` and swaps in a mount effect; `login`
  (line ~47) and `logout` write sessionStorage.
- `src/routes/__root.tsx` — `createRootRoute` with **no loader**; the non-guest
  tree nests `QueryClientProvider → AuthProvider → FeatureFlagProvider →
BreadcrumbProvider → HeyTaliaProvider → HdpCaptureProvider → SidebarProvider`
  (~lines 169–203).
- Server cookie API (verified in `node_modules` at planning time):
  `getCookie(name: string): string | undefined` is exported by
  `@tanstack/start-server-core` and re-exported through
  `@tanstack/react-start/server` (`react-start-server/dist/esm/index.d.ts`
  does `export * from '@tanstack/start-server-core'`). It is **server-only**
  — never import it statically from a file that ships to the client; use a
  dynamic `await import(...)` inside a server-only branch (Step 2).
- TanStack Start dehydrates root-loader data into the client payload, so
  `useLoaderData` on the client returns exactly what the server loader
  computed — this is what makes the seed hydration-safe.
- Known residual recorded in `plans/README.md` (Round 8): "FeatureFlagProvider
  off-default hydration warning (app-wide)" — this plan is that dedicated pass.

## Commands you will need

| Purpose   | Command             | Expected                                                                       |
| --------- | ------------------- | ------------------------------------------------------------------------------ |
| Typecheck | `bunx tsc --noEmit` | 0 new errors vs your recorded baseline (76 at planning)                        |
| Tests     | `bunx vitest run`   | no new failures vs 190-pass/6-fail baseline (flaky `imported-columns.test.ts`) |
| Build     | `bun run build`     | exit 0                                                                         |
| Dev       | `bun run dev`       | port 3000 (SSR dev server)                                                     |

## Scope

**In scope**:

- `src/lib/feature-flags/context.tsx` (cookie mirror + `initialFlags` prop)
- `src/lib/auth.tsx` (cookie mirror + `initialLoggedIn` prop)
- `src/routes/__root.tsx` (loader + prop wiring)
- `src/lib/feature-flags/feature-flags.test.ts` (extend — created by 043)

**Out of scope**:

- The `beforeLoad` guards in `student-analytics.tsx` / `insight-buddy.tsx` —
  043 already routes them through `readEffectiveFlags`; making them
  SSR-aware via the cookie is a natural follow-up, note it, don't do it.
- Any change to flag semantics, the registry, or `/flags` UI.
- Server-side sessions, real auth — this is a prototype mirror, not security.
  The cookie carries the same non-secret demo state localStorage already does.
- The other providers in the stack.

## Git workflow

- Branch: `advisor/047-first-paint-seed`
- Conventional commits, e.g. `fix(app): seed flags/auth from cookie at SSR — no first-paint flash`
- No push/PR unless instructed.

## Steps

### Step 1: Mirror writes to cookies

In `context.tsx`'s `saveFlags` (and anywhere else that persists), after the
localStorage write add:

```ts
document.cookie = `${FEATURE_FLAGS_STORAGE_KEY}=${encodeURIComponent(
  JSON.stringify(flags),
)}; path=/; max-age=31536000; samesite=lax`
```

In `auth.tsx` `login`/`logout`, mirror the boolean with a **session cookie**
(no `max-age`, matching sessionStorage's session lifetime):
`document.cookie = 'auth_session=true; path=/; samesite=lax'` on login;
expire it (`max-age=0`) on logout. Use the existing `AUTH_STORAGE_KEY` value
as the cookie name if it is cookie-safe; otherwise the literal above.
(Nuance to record in the commit message: sessionStorage is per-tab, a session
cookie is per-browser-session — acceptable for this prototype's mock auth.)

**Verify**: `bunx tsc --noEmit` → no new errors. In the browser: toggle a
flag on `/flags`, then `document.cookie` in devtools shows the mirror.

### Step 2: Root loader reads the cookies on the server

In `src/routes/__root.tsx`:

```ts
export const Route = createRootRoute({
  loader: async () => {
    if (typeof document !== 'undefined') return { seed: null }
    const { getCookie } = await import('@tanstack/react-start/server')
    let flags: unknown = null
    try {
      const raw = getCookie(FEATURE_FLAGS_STORAGE_KEY)
      flags = raw ? JSON.parse(decodeURIComponent(raw)) : null
    } catch {
      flags = null
    }
    return {
      seed: {
        flags, // Partial<FeatureFlags> | null
        loggedIn: getCookie('auth_session') === 'true',
      },
    }
  },
  // …existing options unchanged
})
```

(Match the cookie names chosen in Step 1.)

**Verify**: `bunx tsc --noEmit` → no new errors; `bun run build` → exit 0
(this also proves the dynamic import kept the server module out of the
client bundle — a static import would fail the client build).

### Step 3: Providers accept an initial seed

- `FeatureFlagProvider` gains `initialFlags?: unknown`. Initial state becomes
  `() => mergeStoredFlags(initialFlags) ?? DEFAULT_FEATURE_FLAGS`, where
  `mergeStoredFlags` is the existing per-key boolean-validating merge from
  `loadFlags` factored out so both paths share it (including 043's analytics
  reconcile — the seed must go through the same reconcile). Keep the mount
  effect that reads localStorage: it now normally produces the same values
  (no visible change), and it self-heals a stale/absent cookie.
- `AuthProvider` gains `initialLoggedIn?: boolean` (default `false`), used as
  the `useState` initial value; keep the mount effect for the same reason.
- In `__root.tsx`'s component, read the loader data
  (`Route.useLoaderData()`) and pass `seed.flags` / `seed.loggedIn` into the
  two providers. When `seed` is `null` (client-side execution) pass nothing.

**Verify**: `bunx tsc --noEmit` → no new errors; `bunx vitest run` → no new
failures.

### Step 4: Browser verification (the point of the plan)

With `bun run dev`:

1. On `/flags`, turn OFF `posts` and ON `meetings` (both off-default deltas).
2. Hard-reload `/` with devtools console open and "Preserve log" on.
   Expected: **no hydration-mismatch warning**, and no visible sidebar pop
   (Posts absent, Meetings present from the first paint — verify by
   screenshotting or by checking the SSR HTML: `curl -s localhost:3000/ |
grep -c "Meetings"` → ≥1, `grep -c ">Posts<"` → 0).
3. Log in (mock login), hard-reload → header renders the logged-in state
   with no "Sign in" flash.
4. Clear cookies but keep localStorage (devtools → Application) →
   hard-reload → one legacy flash occurs, then the cookie is re-mirrored on
   next flag write; no errors.
5. `resetFlags` on `/flags` → cookie updates (check `document.cookie`).

**Verify**: all five checks pass; record which you ran in the completion
report. If `agent-browser` CLI is available, use it for 2–3 and attach
screenshots; otherwise curl + manual is fine.

## Test plan

Extend `src/lib/feature-flags/feature-flags.test.ts` (from 043):

- `mergeStoredFlags` (the factored merge): valid partial → merged over
  defaults; junk types ignored; analytics reconcile applies to seeded input
  (seed `{ 'student-analytics': true }` → basic true).
- Cookie write/read round-trip is browser-behavior — covered by Step 4, not
  unit tests.

## Done criteria

- [ ] `bunx tsc --noEmit` → no new errors; `bun run build` → exit 0
- [ ] `bunx vitest run` → new merge tests pass; no new failures
- [ ] SSR HTML reflects cookie-stored flags (Step 4.2 curl check)
- [ ] No hydration warning in console with off-default flags
- [ ] `git status` → only the four in-scope files modified
- [ ] `plans/README.md` row updated (and remove/annotate the "known residual:
      FeatureFlagProvider off-default hydration warning" line)

## STOP conditions

- `getCookie` is not importable from `@tanstack/react-start/server` at the
  installed version (it was verified present at planning; a dependency
  refresh may have moved it — check `@tanstack/start-server-core`'s
  `request-response.d.ts` before giving up).
- The root loader does not re-deliver data on client hydration (symptom:
  `useLoaderData` returns `undefined` in the browser) — the seed approach
  assumes dehydration; report rather than hacking around it.
- Adding a loader to the root route changes navigation behavior anywhere
  (e.g. unexpected loader re-runs blocking transitions).
- Plan 043 has not landed (this plan edits the same provider — sequencing
  matters).

## Maintenance notes

- Anything that writes flags/auth outside `setFlag`/`login`/`logout` must
  also update the mirror — keep all persistence going through those
  functions (reviewers: reject direct `localStorage.setItem('feature_flags', …)`).
- Follow-up candidates: make the `student-analytics`/`insight-buddy`
  `beforeLoad` guards SSR-aware using the same cookie; apply the seed pattern
  to other localStorage-backed UI state if it ever gates chrome.
- If real auth ever replaces the mock, delete the auth cookie mirror rather
  than extending it — it is deliberately not a security boundary.
