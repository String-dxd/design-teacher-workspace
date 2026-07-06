---
plan_id: 2026-05-26-001-feat-404-not-found-page
title: 'feat: Add 404 not-found page'
status: completed
created: 2026-05-26
plan_depth: Lightweight
type: feat
---

# feat: Add 404 not-found page

## Summary

Replace the current "Coming Soon" placeholder rendered by the catch-all route at `src/routes/$.tsx` with a proper **Page not found** experience that matches the app's existing empty-state visual language and gives the user a clear path back to the homepage. Also wire `notFoundComponent` on the root route so programmatic 404s (loader-thrown `notFound()`, internal router 404s) render the same view.

The page renders inside the app shell (sidebar + header) for non-guest routes so the user retains primary navigation while recovering.

---

## Problem Frame

- **What's wrong today:** Any unknown URL lands on `src/routes/$.tsx`, which renders a generic "Coming Soon" page with a construction icon. This is misleading — it implies the page will exist later, when in reality the URL is invalid.
- **Who feels it:** Any user who mistypes a URL, follows a stale bookmark, clicks a broken link, or hits a route whose data loader throws `notFound()`.
- **Why now:** The current placeholder is leftover scaffolding. Now that the app's design language is settled (Shadcn UI + Base UI primitives, centered empty-state pattern with muted-circle icon, single primary CTA), the 404 should reuse those exact conventions.
- **Design intent:** Honest copy, recognizable visual pattern, single clear recovery action. The user should never feel stuck.

---

## Requirements

| ID  | Requirement                                                                                                                                                     |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | Unknown URLs render a "Page not found" view, not "Coming Soon".                                                                                                 |
| R2  | The view reuses the existing `EmptyState` component (no parallel component for the same pattern).                                                               |
| R3  | The view displays an icon inside a muted circle, a title, a description, and one primary CTA — matching the centered layout already used by `src/routes/$.tsx`. |
| R4  | A primary "Back to home" CTA navigates to `/` via the TanStack Router `Link`.                                                                                   |
| R5  | Programmatic 404s (e.g., `throw notFound()` from a loader) render the same view, not the framework default.                                                     |
| R6  | The view renders inside the app shell (sidebar + header) for non-guest routes.                                                                                  |
| R7  | All existing `EmptyState` call sites continue to work unchanged (backward-compatible API).                                                                      |
| R8  | Visual and typographic conventions follow the **frontend-design** skill principles — no AI-slop aesthetics, no unnecessary embellishment.                       |

---

## Scope Boundaries

**In scope**

- Extending `src/components/empty-state.tsx` with optional `icon` and `action` props.
- Replacing the contents of `src/routes/$.tsx` to render the 404 view via the extended `EmptyState`.
- Wiring `notFoundComponent` on the root route in `src/routes/__root.tsx`.

**Out of scope**

- Redesigning the existing empty-state copy or visuals at any other call site (forms, announcements, groups, etc.).
- Building a search-the-app or "Did you mean…?" suggestion feature on the 404 page.
- Telemetry / analytics on 404 hits.
- A dedicated 404 experience for `_guest` routes (those have their own shell and would warrant a separate decision).
- Internationalization of 404 copy.

### Deferred to Follow-Up Work

- If 404 hits become a meaningful metric, add a lightweight analytics event on `NotFound` mount.
- Consider a separate guest-shell 404 view if guest routes start surfacing 404s in practice.

---

## Key Technical Decisions

### D1. Extend `EmptyState` rather than create a new `NotFound` component

**Decision:** Add optional `icon?: React.ReactNode` and `action?: React.ReactNode` props to the existing `EmptyState` component at `src/components/empty-state.tsx`. Use the extended component for the 404 view.

**Why:**

- `CLAUDE.md` explicitly forbids creating new components when an existing one can be adapted.
- The current `$.tsx` markup is already structurally identical to `EmptyState` plus an icon-in-muted-circle and a Button. Extending `EmptyState` unifies the two patterns and benefits other future empty states (e.g., empty announcement list with an "icon + create" CTA).
- Existing call sites pass only `title` and `description`; making the new props optional is fully backward-compatible.

**Alternative considered:** Inline the markup in two places (`$.tsx` and `notFoundComponent`). Rejected — duplicates the layout and copy across two files, creating drift risk.

### D2. Use both `$.tsx` catch-all **and** root `notFoundComponent`

**Decision:** Keep `src/routes/$.tsx` (TanStack Router's file-based catch-all for unmatched URL segments) **and** add `notFoundComponent` to the root route in `src/routes/__root.tsx`. Both render the same content.

**Why:**

- `$.tsx` handles URL paths that don't match any defined route (the common case for mistyped URLs and stale links).
- `notFoundComponent` handles programmatic 404s — e.g., a loader calling `throw notFound()` when an entity ID isn't found, or framework-internal not-found dispatches.
- The two paths are complementary, not redundant. Both should land on the same view.

### D3. Render inside the app shell for non-guest routes

**Decision:** Keep the 404 view inside the existing app shell (sidebar + header) for non-guest routes. The current `$.tsx` already does this because `__root.tsx` wraps it in `SidebarProvider`/`SidebarInset`/`AppHeader` for non-guest paths.

**Why:** A logged-in user mistyping a URL benefits from seeing the sidebar and header — they can recover via nav. Guest-route 404s are deferred (see Scope Boundaries).

### D4. Single primary CTA: "Back to home"

**Decision:** One primary CTA ("Back to home" → `/`). No secondary "Go back" button, no search box, no suggestions list.

**Why:** Honors `make-interfaces-feel-better` and `frontend-design` principles — one clear recovery path beats a cluttered "helpful" 404. The sidebar (when visible) already provides full navigation.

### D5. Icon choice

**Recommendation:** `Compass` from `lucide-react`. Conveys the navigation/orientation metaphor (helping a lost user find their way) without the cliché of a question mark or "broken page" iconography.

**Acceptable alternatives:** `MapPinOff`, `SearchX`. Avoid the existing `Construction` icon — it implies the page will exist later.

### D6. Copy

- **Title:** `Page not found`
- **Description:** `We couldn't find the page you're looking for. It may have moved, or the link might be broken.`
- **CTA:** `Back to home`

Plain, honest, no apology theatre. Mirrors the tone used elsewhere in the app.

---

## High-Level Design

> Directional sketch — not implementation. The component contract below illustrates the intended `EmptyState` shape after extension.

```tsx
// Conceptual contract, not final code
interface EmptyStateProps {
  title: string
  description: string
  icon?: React.ReactNode // rendered inside muted-circle, optional
  action?: React.ReactNode // rendered below description, optional
}
```

Layout (post-extension), mirroring the existing `$.tsx` structure:

```
main (flex-1, centered)
└─ div (flex-col, items-center, gap-6, text-center)
   ├─ icon-circle (size-20, rounded-full, bg-muted)    ← only when icon is provided
   │  └─ {icon}
   ├─ div (flex-col, gap-2)
   │  ├─ h2 (text-2xl, font-semibold, text-foreground)
   │  └─ p (max-w-md, text-muted-foreground)
   └─ {action}                                          ← only when action is provided
```

---

## Implementation Units

### U1. Extend `EmptyState` with optional `icon` and `action`

**Goal:** Allow `EmptyState` to render an optional icon inside a muted circle and an optional action node below the description, so the 404 page can reuse it without parallel markup.

**Requirements:** R2, R3, R7, R8

**Dependencies:** none

**Files:**

- `src/components/empty-state.tsx` (modify)

**Approach:**

- Add optional `icon?: React.ReactNode` and `action?: React.ReactNode` props.
- When `icon` is provided, render it inside a `flex size-20 items-center justify-center rounded-full bg-muted` wrapper (the exact pattern from `src/routes/$.tsx:14`).
- When `action` is provided, render it as the last child of the centered column.
- Change the outer wrapper to `flex flex-col items-center gap-6 text-center`, with title/description nested in a `flex flex-col gap-2` group (matches `$.tsx:13-25`).
- Preserve the existing `flex flex-1 items-center justify-center` outer container so existing call sites that rely on full-height centering keep working.
- Keep all existing prop names and behavior intact — current callers pass only `title` and `description`.

**Patterns to follow:**

- Muted-circle icon wrapper: `src/routes/$.tsx:14-16`
- Typography: `text-2xl font-semibold text-foreground` (title) and `text-muted-foreground` (description), already used in both files.
- `cn()` for any conditional class composition if needed: `src/lib/utils.ts`.

**Test scenarios:**

- Renders title and description when only those props are passed (existing behavior; verifies backward compatibility for current callers in `forms.index.tsx`, `announcements.index.tsx`, `groups.index.tsx`, etc.).
- Renders the icon inside a muted circle when `icon` is provided.
- Does not render the muted-circle wrapper when `icon` is omitted (no empty `div` artifact in the DOM).
- Renders the action node when `action` is provided, and omits it otherwise.
- Layout is centered horizontally and vertically inside its parent.

**Verification:** All existing `EmptyState` consumers (`forms.index.tsx`, `announcements.index.tsx`, `groups.index.tsx`, `reports/report-table.tsx`, `groups.$groupId.tsx`, `insight-buddy.tsx`) render unchanged. Manual smoke: visit `/announcements` with no announcements, confirm the empty state still looks the same.

---

### U2. Replace catch-all route with the 404 page

**Goal:** Repurpose `src/routes/$.tsx` to render a "Page not found" view via the extended `EmptyState`.

**Requirements:** R1, R3, R4, R6, R8

**Dependencies:** U1

**Files:**

- `src/routes/$.tsx` (modify)

**Approach:**

- Keep the `createFileRoute('/$')` declaration.
- Replace `ComingSoonPage` with a `NotFoundPage` component that returns `<EmptyState icon={<Compass className="size-10 text-muted-foreground" />} title="Page not found" description="..." action={<Button render={<Link to="/" />}>Back to home</Button>} />`.
- Import `Compass` from `lucide-react` (replacing `Construction`).
- Update copy to match D6.
- Keep the outer `<main className="flex flex-1 items-center justify-center">` if `EmptyState` doesn't already provide it after U1; otherwise drop it.

**Patterns to follow:**

- Button + Link composition: existing `src/routes/$.tsx:26-28` (`<Button variant="outline" render={<Link to="/" />}>...</Button>`).
- Lucide icon sizing inside muted circles: `size-10 text-muted-foreground` (matches `$.tsx:15`).
- `frontend-design` skill principles for any visual polish at execution time — no shadows, gradients, or embellishment beyond the existing pattern.

**Test scenarios:**

- Visiting any unknown URL (e.g., `/this-does-not-exist`, `/announcements/garbage`, `/a/b/c`) renders the 404 view.
- The view renders inside the app shell — sidebar visible, header visible (verifies `__root.tsx` non-guest branch still applies).
- Clicking "Back to home" navigates to `/`.
- The view uses the new `Compass` icon, not `Construction`.
- Copy reads "Page not found" (not "Coming Soon").

**Verification:** `bun run dev`, visit `/does-not-exist`, confirm rendering matches design intent. Run `bun run check` to confirm format + lint pass.

---

### U3. Wire `notFoundComponent` on the root route

**Goal:** Ensure programmatic and router-internal 404s render the same `NotFoundPage` view.

**Requirements:** R5

**Dependencies:** U2

**Files:**

- `src/routes/__root.tsx` (modify)

**Approach:**

- In `createRootRoute({...})`, add a `notFoundComponent` option that returns the same `EmptyState`-based markup used by `$.tsx`.
- Reuse the same icon + copy + CTA so the two paths are visually identical.
- To avoid duplicating the JSX between `$.tsx` and `__root.tsx`, prefer one of:
  - **Option A (recommended):** Define a tiny shared `NotFoundPage` render function inside `src/routes/$.tsx` and `export` it; import it from `__root.tsx` as the `notFoundComponent`. No new component file, no new directory — just a named export from the existing route.
  - **Option B:** Inline the same `EmptyState` props at both call sites. Acceptable if Option A causes routing-import issues; document the duplication in a one-line comment if used.
- Do **not** create a new top-level component file unless Option A is blocked.

**Patterns to follow:**

- TanStack Router `notFoundComponent` option syntax — refer to the version of `@tanstack/react-router` already in use (verify in `package.json` at execution time).

**Test scenarios:**

- Triggering a programmatic `throw notFound()` from any route loader renders the 404 view (write a temporary loader-throwing route during local testing if needed, then remove it).
- Visual parity: programmatic 404 looks identical to the `$.tsx` catch-all 404.
- No regression on existing routes — visiting `/`, `/announcements`, `/forms`, `/groups`, etc. still renders normally.

**Verification:** Manual: stage a loader that throws `notFound()`, confirm 404 page renders. Remove the test loader before committing.

---

## System-Wide Impact

| Surface                          | Impact                                                                                 |
| -------------------------------- | -------------------------------------------------------------------------------------- |
| `src/components/empty-state.tsx` | API extended with two optional props. All existing callers unaffected.                 |
| `src/routes/$.tsx`               | Behavior changes from "Coming Soon" to "Page not found". This is the intended outcome. |
| `src/routes/__root.tsx`          | Gains a `notFoundComponent` config. No effect on the happy path.                       |
| Other `EmptyState` consumers     | No code change required, no visual regression expected. Confirm via local smoke test.  |

---

## Risks & Mitigations

| Risk                                                                                                                         | Likelihood | Mitigation                                                                                                                               |
| ---------------------------------------------------------------------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Extending `EmptyState` causes a subtle layout regression at one of its 6+ call sites.                                        | Low        | Keep the outer `flex flex-1 items-center justify-center` wrapper intact; smoke-test each consumer page locally before declaring U1 done. |
| `notFoundComponent` and `$.tsx` catch-all conflict in unexpected ways (e.g., one shadows the other for certain path shapes). | Low        | TanStack Router treats them as complementary. Verify by triggering both a URL miss and a loader `notFound()` during U3 testing.          |
| The 404 page renders without the app shell (e.g., outside `SidebarProvider`).                                                | Low        | `$.tsx` is already mounted under the non-guest shell branch of `__root.tsx`. Visual smoke test confirms.                                 |
| Icon choice (`Compass`) feels off in context.                                                                                | Low        | `D5` lists acceptable alternatives. Pick during execution if `Compass` doesn't read right.                                               |

---

## Verification (End-to-End)

1. `bun run dev` — start the dev server.
2. Visit `/this-does-not-exist` — confirm:
   - "Page not found" title.
   - Description copy from D6.
   - `Compass` icon (or chosen alternative) in muted circle.
   - "Back to home" CTA.
   - Sidebar and header are visible.
3. Click "Back to home" — confirm landing on `/`.
4. Visit `/announcements`, `/forms`, `/groups` — confirm empty-state regions still render correctly (no layout regression from U1).
5. Stage a temporary loader-throwing route (e.g., in a scratch file), trigger it, confirm the same 404 view renders. Remove the scratch route.
6. `bun run check` — confirm prettier + eslint pass.
7. `bun run test` — confirm existing tests pass and any new `empty-state` test additions pass.

---

## Open Questions (Deferred to Implementation)

- Final icon choice: `Compass` vs. `MapPinOff` vs. `SearchX`. Default to `Compass`; pick at execution time after seeing it rendered.
- Whether to export `NotFoundPage` from `$.tsx` (Option A) or inline at both call sites (Option B). Default to A; fall back to B only if import shape causes friction.
- Whether to add a test file for `EmptyState`. If the project doesn't currently test presentational components, skip; if it does, add one matching the existing convention.
