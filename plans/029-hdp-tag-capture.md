# Plan 029: Tag capture — global FAB, Tag Queue overlay, and row-level entry points (F0.1/F0.2/F1)

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 9266c4f..HEAD -- src/routes/__root.tsx src/routes/students.index.tsx src/routes/students.$id.tsx src/components/app-header.tsx`
> Plan 028 must already be merged/applied on your branch (it creates
> `src/components/hdp/`, `src/lib/hdp-store.ts`, `src/data/hdp.ts`,
> `src/types/hdp.ts`). If those files are absent, STOP.

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: MED (global overlay + shell mount; two shared files get small edits)
- **Depends on**: plans/028-hdp-module-foundation.md
- **Category**: direction (new feature)
- **Planned at**: commit `9266c4f`, 2026-07-16

## Why this matters

The whole product bet rides on this surface: teachers will only capture
observations voluntarily if capture costs ~8 seconds from wherever they already
are. This plan ships the four things that make capture ambient: a global
single-purpose FAB, a top-bar `+ Tag` button, the Tag Queue overlay itself, and
quick-tag affordances on student rows. The binding acceptance criteria (from the
approved design contract in `docs/decisions/reports-hdp.md`): FAB → saved tag in
≤3 interactions; the FAB never badges, pulses, or nags; the overlay never mutates
the underlying screen; Esc closes and restores focus.

Read the **Design constraints** section of `plans/028-hdp-module-foundation.md`
before writing any code — it is binding for this plan too (vocabulary, tokens,
type rules, a11y, no-nag).

## Current state

(After plan 028.)

- `src/components/hdp/hdp-shell.tsx` — placeholder `HdpShell` returning null
  unless `useFeatureFlag('reports-hdp')`; mounted in `src/routes/__root.tsx`
  immediately before `<Toaster position="bottom-right" />` (line ~190).
- `src/lib/hdp-store.ts` — `addTag(input)`, `tagsByAuthor`, `logEvent(name,
payload)`; all SSR-guarded. `src/data/hdp.ts` — `CURRENT_TEACHER`
  (`formClassId: '3A'`, `teachingClasses`), `HDP_COLLEAGUES`.
  `src/data/timetable.ts` — `classesForTeacher(teacherId)`.
- `src/types/hdp.ts` — `HdpTag`, `DispositionId`, `TagContext`,
  `TagEntryPoint = 'fab' | 'topbar' | 'row' | 'cmdk'` (cmdk reserved, do not
  implement a ⌘K binding — deferred by explicit decision).
- `src/components/app-header.tsx` — the top bar. Contains a Button using
  `render={<Link>}` (known Base UI `nativeButton` console warning, pre-existing —
  don't fix). Add the `+ Tag` button here.
- `src/routes/students.index.tsx` — the students list. Rows render in a table;
  there is an existing row-actions pattern (hover/overflow). Locate the row
  render before editing; if the structure has no per-row action slot, see STOP
  conditions.
- `src/routes/students.$id.tsx` — builds `headerControls` passed to
  `<StudentProfile student={student} headerControls={headerControls} />`
  (line ~105). The profile header quick-tag button goes into `headerControls`.
- `src/components/ui/dialog.tsx` — Base UI Dialog primitives (use for the
  overlay); `src/components/ui/input.tsx`, `button.tsx`, `label.tsx` exist.
  Base UI convention: triggers use `render={...}` props, never `asChild`.
- Toasts: `sonner`'s `<Toaster position="bottom-right" />` in `__root.tsx` —
  the FAB occupies the same corner; this plan adds a toaster offset.
- Students data: `mockStudents` entries carry `id`, `name`, `class`, and a
  preferred/display name field — check the exact field names in
  `src/data/mock-students.ts` before writing the search.

## Commands you will need

Same table as plan 028 (`bun install`; `bunx tsc --noEmit 2>&1 | grep -c "error TS"` → 82;
`bunx vitest run` → 24 known fails only; `bun run build` → exit 0; targeted
prettier/eslint). NEVER `bun run check`.

## Scope

**In scope**:

- `src/components/hdp/hdp-shell.tsx` (replace placeholder: provider + FAB + overlay mount)
- `src/components/hdp/tag-queue-context.tsx` (create)
- `src/components/hdp/tag-fab.tsx` (create)
- `src/components/hdp/tag-queue-overlay.tsx` (create)
- `src/components/hdp/disposition-chip.tsx` (create)
- `src/components/hdp/row-quick-tag.tsx` (create)
- `src/lib/hdp-search.ts` + `src/lib/hdp-search.test.ts` (create — pure student-search matcher)
- `src/routes/reports.tag.tsx` (create — full-page variant)
- `src/components/hdp/reports-home.tsx` (flip the Tag Queue card to a live link)
- `src/components/app-header.tsx` (add `+ Tag` button)
- `src/routes/students.index.tsx` (row quick-tag affordance)
- `src/routes/students.$id.tsx` (header quick-tag button)
- `src/routes/__root.tsx` (Toaster offset ONLY, one prop)
- `plans/README.md` (status row)

**Out of scope**: everything under `src/components/reports/` and the legacy
`reports.*` routes; `student-profile.tsx` (its Observations section is plan 030);
any ⌘K/command-palette work; evidence attach beyond a mocked chip; groups/search
row entry points (deferred by decision).

## Git workflow

Branch `advisor/029-hdp-tag-capture` (stacked on 028 if unmerged). Commit per
step. No push/PR.

## Steps

### Step 1: Tag Queue context + shell

`tag-queue-context.tsx`: a small React context with
`openTagQueue(prefill?: { studentId?: string; context?: TagContext; entryPoint: TagEntryPoint })`,
`closeTagQueue()`, and state `{ open, prefill }`. Export `TagQueueProvider` and
`useTagQueue()` (throws outside provider).

`hdp-shell.tsx`: when the flag is on, render
`<TagQueueProvider><TagFab /><TagQueueOverlay /></TagQueueProvider>`; null when
off. Suppress the FAB (but keep the provider) on: `/reports/tag`,
`/insight-buddy` (route-local floating bubble there), and any `_guest` route —
use `useLocation()` and a prefix check.

Context pre-fill from route (PRD F0.1.3): derive a default `TagContext` from the
current pathname — `/groups` → `'cca'`, everything else `'lesson'` — inside
`openTagQueue` callers or a helper `contextFromPath(pathname)` in the context
file. Keep it editable in the composer.

**Verify**: `bunx tsc --noEmit 2>&1 | grep -c "error TS"` → 82.

### Step 2: `TagFab`

`tag-fab.tsx`: a fixed button, bottom-right (`fixed bottom-6 right-6 z-40`),
56px (`size-14`), `rounded-full bg-primary text-primary-foreground shadow-md`,
Lucide `Tag` icon, `aria-label="Tag a student"`. `z-40` keeps it under dialogs
(Base UI dialogs are z-50). On click: `openTagQueue({ entryPoint: 'fab' })`.
Focusable, visible focus ring (`focus-visible:ring-2`). NO badge, NO pulse, NO
animation on mount. Hover: `hover:bg-primary/90` only. Respect safe areas:
`style={{ bottom: 'calc(1.5rem + env(safe-area-inset-bottom))', right: 'calc(1.5rem + env(safe-area-inset-right))' }}`.

In `__root.tsx`, change the toaster line to
`<Toaster position="bottom-right" offset={{ bottom: 88 }} />` so toasts stack
above the FAB (one-prop edit; acceptable app-wide because the corner is now a
shared slot). If the installed sonner's `offset` prop type differs, use the form
its types accept (string `'88px'` is fine); if neither exists, STOP.

**Verify**: `bunx tsc --noEmit 2>&1 | grep -c "error TS"` → 82; visual check in
Step 8.

### Step 3: Search matcher (pure, tested)

`src/lib/hdp-search.ts`: `searchAssociatedStudents(query: string, teacherId: string): Array<Student>`
— scope = students in `classesForTeacher(teacherId)` (form + teaching classes);
match case-insensitively on ANY name token (split on spaces, also strip
punctuation) plus the preferred-name field if `mock-students` has one. Must
match Chinese-style names ("Wei Jie" via "jie"), Malay patronymics ("Nur Aisyah
binte Rahman" via "aisyah" or "rahman" — `bin`/`binte` are skipped as tokens),
and Indian names via any token. Return at most 8, ordered: form-class students
first, then alphabetical. Empty query → first 8 associated students (form class
first).

Also export `searchAllStudents(query: string): Array<Student>` — same matcher
over ALL of `mockStudents`, cap 8, alphabetical. **Escape hatch** (UX grill
decision, 2026-07-16): CCA and relief moments involve students outside the
teacher's timetabled classes (CCA is a first-class tag context — the scope must
not contradict it). Overlay behaviour: when the in-scope results are empty and
the query is non-empty, the list shows a quiet divider row "No matches in your
classes — showing all students" followed by `searchAllStudents` results; the
common case (own classes) stays a short, fast list.

**Verify**: `bunx vitest run src/lib/hdp-search.test.ts` → all pass (write the
tests per Test plan first if you prefer TDD).

### Step 4: `DispositionChip` + `TagQueueOverlay`

`disposition-chip.tsx`: `<button type="button" aria-pressed={selected}>` pill —
`rounded-full border px-3 py-1.5 text-xs font-medium` (12px ≥ the 11px floor),
selected: `border-primary bg-primary/10 text-primary` — the selected chip is the
screen's single accent. Mobile target: min height 44px at <640px
(`min-h-9 sm:min-h-0` is NOT enough — use `h-11 sm:h-auto`). Label is the
disposition name in sentence case.

`tag-queue-overlay.tsx` (Base UI `Dialog` from `ui/dialog.tsx`), open state from
`useTagQueue()`:

- Desktop: centered panel `w-[560px] max-w-[calc(100vw-2rem)]`; mobile: full
  sheet (`h-dvh w-full sm:h-auto`). Entrance: opacity+scale 0.98→1, 150ms,
  standard easing, `motion-reduce:transition-none`.
- Stacked layout, top to bottom (never a horizontal cram):
  1. Search: `<Input>` with a visible `<Label>` "Student"; type-ahead list of
     `searchAssociatedStudents` results (row = name, class, term tag count from
     `tagsForStudent`); arrow keys + Enter select; the list is a `<ul>` with
     `role="listbox"`-style semantics via the combobox primitive if
     `ui/combobox.tsx` fits — otherwise a simple filtered list with buttons
     (CMP-1: prefer the existing combobox; if it can't render this shape, add a
     code comment `// ui/combobox does not support async row meta — plain list`
     and proceed).
  2. Selected student summary row (name, class; a "change" ghost button).
  3. Disposition chips (the 4, wrapping, `flex flex-wrap gap-2`), with number
     keys 1–4 as accelerators while the overlay is open (keydown handler on the
     dialog, skipped when focus is in the note/search input).
  4. Optional note `<Textarea>` with visible label "Note (optional)", 140-char
     `maxLength` + live character counter (`aria-live="polite"` off — counter is
     visual only; SR users get the maxLength); microcopy under it, exactly:
     "For concerns about a student's wellbeing, use your school's usual
     channels."
  5. Context (UX grill decision, 2026-07-16 — NOT a closed select): visible
     label "Context" over a single-select row of 5 chips (`<button
aria-pressed>`, same mechanics/sizing as `DispositionChip`, `flex
flex-wrap gap-2`): During lesson / While marking / CCA / Form time /
     Other; pre-selected from the invoking route; one tap to correct.
     Rationale: a mis-stamped context silently poisons forming patterns
     (patterns = same disposition in ≥2 _distinct contexts_), so the stamped
     value must be glanceable before save, never hidden in a closed select.
  6. Mocked evidence chip: a ghost button "Attach evidence" that toggles a
     static "1 attachment (mock)" chip — no file handling.
  7. Actions row: primary Button "Save tag" (disabled until student +
     disposition chosen), ghost "Close".
- Behaviour: Enter saves when saveable (and focus is not in the textarea);
  save calls `addTag({...})` with the entry point from `prefill`, logs
  `logEvent('tag_created', { duration_ms, context, entry_point, has_note,
has_evidence })` (duration = now − overlay-open timestamp), fires
  `toast.success('Tagged {name} · {Disposition}')`. Then, **split by entry
  point** (UX grill decision, 2026-07-16): `entryPoint: 'row'` — a specific
  student was pre-chosen, single-tag intent — CLOSES the overlay on save
  (Base UI restores focus to the invoking row/header button);
  `'fab'`/`'topbar'` RESETS student + note + evidence but KEEPS the overlay
  open for consecutive tags, focus back to the search input. Esc closes
  (Base UI restores focus to the trigger).
  An unsaved note survives close/reopen within the session (keep composer state
  in the provider, not the dialog) — closing never silently destroys typed
  content.
- The overlay must not mutate the underlying screen: no navigation, no route
  state writes on open/close.
- Recent stream: below the actions, "Your recent tags" — up to 5 of
  `tagsByAuthor(CURRENT_TEACHER.id)` newest-first, each with an Edit (reopens
  values into the composer) and Delete button while `editableUntil` is in the
  future. Delete opens `ui/alert-dialog.tsx`: title "Delete this tag?", body
  "This removes your observation of {name} ({Disposition}). This can't be
  undone." Confirm/Cancel (CMP-2).
- The PRD's desktop side panel ("Your term in numbers") is NOT in this plan —
  Term Summary (plan 030) carries that value; add nothing.

**Verify**: `bunx tsc --noEmit 2>&1 | grep -c "error TS"` → 82;
`bunx prettier --check src/components/hdp/*.tsx` → exit 0.

### Step 5: `/reports/tag` full-page variant

`src/routes/reports.tag.tsx`: `createFileRoute('/reports/tag')`, flag-gated with
the repo's off-state pattern (copy the shape from
`reports.cycle.write.$studentId.tsx:259-274`, but the copy reads: h1 "Reports is
off", body `Turn on “HDP Reports module” to use this page.`, link to `/flags`).
When on: breadcrumbs `Reports → Tag`, `<main>` with h1 "Tag a student" and the
same composer INLINE (extract the composer body from the overlay into
`tag-queue-composer.tsx` if that avoids duplication — allowed within
`src/components/hdp/`). Document title: set via the route's `head`/`meta`
convention if other routes do; otherwise skip (A11Y-9 handled app-wide).

Flip the Tag Queue ToolCard in `reports-home.tsx` to a live `<Link
to="/reports/tag">`, state "Always available".

**Verify**: `bun run build` → exit 0.

### Step 6: Top-bar `+ Tag`

Context reach: plan 028 mounted `<HdpShell />` as a _sibling_ of
`<SidebarInset>` in `__root.tsx`, so a provider living inside `HdpShell` cannot
reach `AppHeader` (which renders inside `SidebarInset`). Restructure once, in
this plan:

1. In `hdp-shell.tsx`, export `HdpCaptureProvider` (= `TagQueueProvider` +
   composer session state) separately; `HdpShell` keeps only the FAB + overlay
   and consumes the context.
2. In `__root.tsx`, wrap `<HdpCaptureProvider>` around the existing
   `<SidebarProvider>…</SidebarProvider>` block. This is this plan's sanctioned
   `__root.tsx` edit (beyond the toaster offset in Step 2). Final shape:

```tsx
<HdpCaptureProvider>
  <SidebarProvider>
    …
    <HdpShell /> {/* FAB + overlay, uses the context */}
    <Toaster position="bottom-right" offset={{ bottom: 88 }} />…
  </SidebarProvider>
</HdpCaptureProvider>
```

`HdpCaptureProvider` renders children directly (no flag check — the flag gates
the FAB/overlay/buttons, and `openTagQueue` no-ops when the flag is off so a
stale caller can't open a dead overlay).

Then in `src/components/app-header.tsx`: when `useFeatureFlag('reports-hdp')`,
render a secondary (outline) Button labelled `+ Tag` (text, not icon-only) that
calls `openTagQueue({ entryPoint: 'topbar' })`.

**Verify**: `bunx tsc --noEmit 2>&1 | grep -c "error TS"` → 82; the `+ Tag`
button opens the overlay in the browser.

### Step 7: Row-level entry points

1. `row-quick-tag.tsx`: a small ghost icon-button (Lucide `Tag`,
   `aria-label="Tag {name}"`, min target 24px) calling
   `openTagQueue({ studentId, entryPoint: 'row' })`.
2. `src/routes/students.index.tsx`: render `<RowQuickTag>` in each student row,
   visible on row hover/focus-within on desktop (`opacity-0
group-hover:opacity-100 focus-visible:opacity-100 group-focus-within:opacity-100`
   — the row needs the `group` class) and always visible under 640px. Gate the
   whole affordance on `useFeatureFlag('reports-hdp')`. Find the row's existing
   trailing cell/action slot and add there — do NOT restructure the table.
3. `src/routes/students.$id.tsx`: add to `headerControls` a secondary Button
   "Tag this student" (same gate) calling
   `openTagQueue({ studentId: student.id, entryPoint: 'row' })`.

**Verify**: `bunx tsc --noEmit 2>&1 | grep -c "error TS"` → 82; with flag OFF,
`git stash`-free visual diff of `/students` shows no change.

### Step 8: Browser verification (the contract's acceptance criteria)

With the flag on, in a real browser:

1. **≤3 interactions**: FAB click → type 2–3 chars and click a student (or Enter
   on the top result) → click a chip → Enter. Count: FAB(1) + student(2) +
   chip(3) + Enter(–) — if your flow needs more than 3 pointer/keyboard
   interactions after the FAB, simplify (e.g. Enter selects top search hit)
   until it doesn't.
2. FAB/top-bar entry: overlay persists after save; toast appears bottom-right
   ABOVE the FAB; search refocused; consecutive second tag saved in ≤5s.
   Row entry (`/students` hover action): overlay CLOSES on save, focus returns
   to the row's tag button.
   2b. Context renders as 5 chips with the route value pre-selected; one tap
   switches it. Typing a name with no in-scope match shows the "showing all
   students" divider + school-wide results (escape hatch).
3. Esc closes; focus returns to the FAB; typed-but-unsaved note reappears on
   reopen.
4. Keys 1–4 toggle chips; chips expose `aria-pressed`; overlay traps focus; all
   fields have visible labels.
5. The underlying page (e.g. `/students` scroll position, filters) is untouched
   after open/close.
6. FAB absent on `/reports/tag`, `/insight-buddy`, and guest routes; identical
   on every other route; no badge/pulse anywhere.
7. `prefers-reduced-motion: reduce` (devtools emulation): overlay appears
   without scale animation.
8. Delete-tag flow shows the consequence dialog; canceling preserves the tag.

Capture `docs/decisions/assets/029-tag-queue.png` (overlay open, chip selected)
if a capture tool is available.

## Test plan

`src/lib/hdp-search.test.ts` (MemoryStorage stub not needed — pure function; no
localStorage):

1. Matches any name token case-insensitively ("jie" → "Tan Wei Jie").
2. Matches Malay names on personal or family token, never on "binte"/"bin".
3. Scopes to the teacher's associated classes only (a 4D student never returned
   for `CURRENT_TEACHER` from `searchAssociatedStudents`).
4. Form-class students rank before teaching-class students.
5. Caps at 8 results; empty query returns form-class students first.
6. `searchAllStudents` finds a 4D student by token (the escape hatch), still
   capped at 8.

Structural pattern: any pure-function test in `src/lib/` (e.g.
`hdp-report-commit.test.ts` style: describe/it, plain asserts).

`bunx vitest run` → all new pass, 24 known fails unchanged.

## Done criteria

- [ ] `bunx tsc --noEmit 2>&1 | grep -c "error TS"` → 82
- [ ] `bunx vitest run` → 24 failed (unchanged), passes ≥ baseline + 5
- [ ] `bun run build` → exit 0
- [ ] Browser checks 1–8 in Step 8 all hold
- [ ] `grep -rn "animate-pulse\|animate-bounce" src/components/hdp/` → no matches (no-nag, no-bounce)
- [ ] `grep -rn "uppercase\|dangerouslySetInnerHTML" src/components/hdp/ src/routes/reports.tag.tsx` → no matches
- [ ] Flag OFF: `/students`, `/reports`, header, and toasts behave byte-identically to before (visual check + no new console output)
- [ ] `plans/README.md` status row updated

## STOP conditions

- Plan 028's files are missing or its Done criteria don't hold on your branch.
- `students.index.tsx` rows have no clean per-row action slot (restructuring the
  table is out of scope — report the actual row structure instead).
- sonner's Toaster accepts no offset prop in the installed version.
- ~~The Base UI Dialog cannot restore focus to the FAB on close (focus restoration
  is an L0-adjacent requirement here — report rather than hand-rolling a dialog).~~
  **Resolved by reviewer decision 2026-07-16** (executor STOPped here, correctly):
  Base UI's focus restore requires `<Dialog.Trigger>` descendants of the same
  Root — structurally impossible for a global overlay with decoupled triggers
  (FAB, header, rows). Authorized fix: context-level restore — `openTagQueue()`
  captures `document.activeElement` in a ref; on overlay close, focus it back
  (deferred a frame, only if still connected to the DOM); clear the ref after.
  The dialog itself stays Base UI — only the restore is context-managed.
- Any change to `students.index.tsx`/`app-header.tsx` visible with the flag off.

## Maintenance notes

- `'cmdk'` stays an unused `TagEntryPoint` variant — a future ⌘K plan wires it.
- Groups/search-results row entry points were deferred by decision; when added,
  reuse `RowQuickTag` unchanged.
- The composer keeps per-session unsaved state in the provider — if the module
  ever gains real multi-tab sync, revisit.
- Reviewer scrutiny: the `__root.tsx` provider wrap (smallest possible diff),
  flag-off no-op-ness of the two shared-file edits, and the ≤3-interaction path.
