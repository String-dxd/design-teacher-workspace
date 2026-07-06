# Plan 021: Compose bypassed UI onto the shadcn/Base UI primitives

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**:
> `git diff --stat b01d78d..HEAD -- 'src/routes/students_.$id.agency-report.new.tsx' src/routes/forms.new.tsx src/components/students/academic-analytics.tsx src/components/students/attendance-analytics.tsx src/components/heytalia/heytalia-panel.tsx src/components/students/lta-dialog.tsx`
> Plans 018/019 intentionally touch some of these files first — expect their
> hunks. Compare the "Current state" excerpts below against live code; if an
> excerpt's code is GONE (not just shifted lines), STOP.

## Status

- **Priority**: P2
- **Effort**: L (five independent work packages; each is S–M)
- **Risk**: MED (chart-in-dialog re-measure; heytalia popover behavior)
- **Depends on**: 019 (both edit `heytalia-panel.tsx` and
  `attendance-analytics.tsx` — land 019 first, rebase)
- **Category**: tech-debt
- **Planned at**: commit `b01d78d`, 2026-07-02

## Why this matters

Repo policy (CLAUDE.md/AGENTS.md): everything composes from the shadcn +
Base UI primitives in `src/components/ui/`; no parallel hand-rolled versions.
A re-audit found the primitives themselves clean, but six spots where feature
code re-implements a primitive: raw `<select>`/`<textarea>`s, five hand-rolled
`<table>`s, three copy-pasted "expand chart" pseudo-modals (one with no
Escape/focus handling — an accessibility gap), a hand-positioned dropdown, and
raw chat inputs. Each is drift the design system can't reach: token or
primitive changes silently skip them.

## Current state

Conventions: import primitives from `@/components/ui/*`; Base UI triggers take
`render={<button/>}` (NEVER `asChild` — that's Radix). Exemplars to imitate:
`src/components/comms/recipient-read-table.tsx` (Table usage),
`src/components/notifications/notification-popover.tsx` (Popover composition),
`src/components/forms/form-response-table.tsx` (Table + Badge).

Work packages, all verified at `b01d78d`:

**A. Raw select/textarea** (the only such sites in the repo)

- `src/routes/students_.$id.agency-report.new.tsx:435-447` — share-dialog
  permission picker is a native `<select>` with three `<option>`s
  (`edit`/`comment`/`view`), styled `rounded-md border bg-background px-2 …`;
  it sits beside a correctly-used `<Input>` (line ~428).
- `src/routes/students_.$id.agency-report.new.tsx:455-461` — message
  `<textarea>` hand-styled `min-h-[90px] w-full resize-none rounded-lg border …
focus:ring-1 focus:ring-primary`.
- `src/routes/forms.new.tsx:328-336` — instructions `<textarea
id="instructions" … rows={5} maxLength={2000}` hand-styled with
  `border-input … focus:ring-1 focus:ring-ring`.
- A `Textarea` primitive already exists: `src/components/ui/textarea.tsx`.

**B. Hand-rolled tables** (the only two files in the repo that hand-roll
`<table>`; all other feature tables use `ui/table`)

- `src/components/students/academic-analytics.tsx:1222` — "Subjects taken and
  current grades": `<table className="w-full text-sm">` with
  `<tr className="border-b bg-muted/40">` and `<th className="px-4 py-2.5
text-left text-xs font-medium uppercase tracking-wide
text-muted-foreground">`.
- `src/components/students/academic-analytics.tsx:1793` — cohort table,
  `<table className="w-full table-fixed text-sm">`, headers mapped from
  `['Profile','Name','Class','Score','Grade']`.
- `src/components/students/attendance-analytics.tsx:1485` — same pattern with
  `<th className="w-[96px] h-12 px-4 …">`; another at `:2206`.

**C. Hand-rolled "expand chart" modals** (three copies)

- `src/components/students/attendance-analytics.tsx:1855-1878` — when
  `chartExpanded`: a `fixed inset-0 z-40 bg-foreground/20` backdrop div + a
  `fixed inset-6 z-50 … rounded-xl border bg-card p-6 shadow-2xl` panel with
  manual `role="dialog"`, `aria-modal`, `autoFocus`, `onKeyDown` Escape, and a
  hand-styled close `<button>`. Second copy at `:2103`.
- `src/components/students/academic-analytics.tsx:1281-1298` — same layout but
  with NO role/aria-modal/Escape at all. Each panel body wraps a Recharts
  `<ResponsiveContainer width="100%" height="100%">`.

**D. Hand-positioned dropdown (HeyTalia agent picker)**

- `src/components/heytalia/heytalia-panel.tsx:~500` — a component rendering
  `<div className="absolute left-3 right-3 top-[calc(100%+4px)] z-50
overflow-hidden rounded-xl border bg-white shadow-lg">` with a header
  ("Teacher Assistant" / "Choose an agent to help you") and `AGENTS.map` →
  `<button>` rows, closed via a manual `onClose`. No outside-click/focus/
  collision handling. (Line ~500 at `b01d78d`; 019 edits line ~496 first.)

**E. Raw chat/readonly inputs**

- `src/components/heytalia/heytalia-panel.tsx:~447` — chat `<input
type="text">` with hand styling inside the input footer.
- `src/components/students/lta-dialog.tsx:543` — readonly `<input>` inside a
  hand-built input-group wrapper (`ui/input-group.tsx` exists).

## Commands you will need

| Purpose   | Command             | Expected on success                                                                    |
| --------- | ------------------- | -------------------------------------------------------------------------------------- |
| Typecheck | `bunx tsc --noEmit` | ≤41 pre-existing errors (23×TS2322, 9×TS2345, 3×TS2353, 6 singles); no new codes/files |
| Tests     | `bunx vitest run`   | 37 pass / 16 fail (pre-existing); no new failures                                      |
| Build     | `bun run build`     | exit 0                                                                                 |
| Dev       | `bun run dev`       | port 3000                                                                              |

## Scope

**In scope** (the only files you should modify):

- `src/routes/students_.$id.agency-report.new.tsx` (share dialog + — reviewer
  amendment 2026-07-02 — the FieldRow narrative `<textarea>` at ~1258 and the
  submit-dialog "Note to Principal" `<textarea>` at ~3194; both sit outside
  the PDF-facsimile fence and take the same mechanical Textarea swap. The
  original "share dialog only" carve-out contradicted the plan's own
  zero-textarea done criterion; the criterion was right.)
- `src/routes/forms.new.tsx` (instructions textarea only)
- `src/components/students/academic-analytics.tsx`
- `src/components/students/attendance-analytics.tsx`
- `src/components/heytalia/heytalia-panel.tsx`
- `src/components/students/lta-dialog.tsx`
- `plans/README.md` (status row)

**Out of scope** (do NOT touch):

- `src/components/comms/entity-selector.tsx` — its raw typeahead `<input>`s
  (lines ~908, ~1018) are load-bearing for its combobox open/close/token
  logic; converting them is a separate, carefully-tested task. Explicitly
  deferred.
- `src/components/ui/*` — compose ON the primitives, never modify them here.
- The PDF-facsimile fence in `agency-report.new.tsx` (~1761–2616) and the
  preview mockups in any file.
- Date/time `<input type="date|time">` sites — no primitive exists; plan 019
  standardizes their tokens.

## Git workflow

- Branch: `advisor/021-compose-primitives`
- One commit per work package (A–E), conventional style:
  `refactor(ds): replace raw select/textarea with ui primitives` etc.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1 (A): select → `Select`, textareas → `Textarea`

- In `agency-report.new.tsx` share dialog: replace the native `<select>` with
  `Select`/`SelectTrigger`/`SelectValue`/`SelectContent`/`SelectItem` from
  `@/components/ui/select` (three items: "Can edit"/"Can comment"/"Can view";
  keep the `permission` state and `aria-label="Permission"` on the trigger).
  Replace the message `<textarea>` with `<Textarea id="collab-message" …>`
  keeping value/onChange/placeholder and `min-h-[90px] resize-none` via
  className.
- In `forms.new.tsx`: replace the instructions `<textarea>` with `<Textarea
id="instructions" rows={5} maxLength={2000} …>` keeping props and
  `resize-none`.

**Verify**: `grep -n '<select' src/routes -r` → 0 matches;
`grep -rn '<textarea' src/routes src/components --include='*.tsx' | grep -v components/ui` → 0 matches.
Dev server: open the share dialog on an agency report and `/forms/new`; both
controls work (pick each permission; type instructions, counter still counts).

### Step 2 (B): tables → `ui/table`

Convert the four hand-rolled tables (academic `:1222`, `:1793`; attendance
`:1485`, `:2206`) to `Table/TableHeader/TableBody/TableRow/TableHead/TableCell`
from `@/components/ui/table`, following `recipient-read-table.tsx` as the
pattern. Preserve per-table specifics via className: `table-fixed`, explicit
widths (`w-[96px]`), `tabular-nums`, alignment classes, and the wrapping
`overflow-x-auto rounded-lg border` divs. Do not change any cell content or
data logic.

**Verify**: `grep -n '<table' src/components/students/*.tsx` → 0 matches.
Dev server: on a student profile open the Academic and Attendance analytics
tabs; tables render with the same columns, sticky/fixed behavior, and no
horizontal-scroll regressions.

### Step 3 (C): expand-chart modals → `Dialog`

For each of the three `chartExpanded` blocks: delete the manual backdrop +
panel + Escape/autoFocus plumbing and render instead:

```tsx
<Dialog open={chartExpanded} onOpenChange={setChartExpanded}>
  <DialogContent className="h-[calc(100vh-3rem)] w-[calc(100vw-3rem)] max-w-none p-6 flex flex-col">
    <DialogTitle className="text-sm font-semibold">
      {/* existing heading text */}
    </DialogTitle>
    <div className="min-h-0 flex-1">
      {/* existing <ResponsiveContainer> subtree, unchanged */}
    </div>
  </DialogContent>
</Dialog>
```

Use the existing heading text as `DialogTitle` (a11y requires it); drop the
hand-styled close button (DialogContent has one; if these two files were told
`showCloseButton={false}` anywhere, don't copy that here). Keep the trigger
buttons that set `chartExpanded(true)` as-is.

**Verify**: dev server → expand each of the three charts: chart fills the
dialog (NOT zero-height — see STOP), Escape closes, focus returns to the
trigger, backdrop click closes. `bunx tsc --noEmit` → no new errors.

### Step 4 (D): agent picker → `Popover`

In `heytalia-panel.tsx`, replace the absolutely-positioned agent-picker div
with `Popover`/`PopoverTrigger`/`PopoverContent` from `@/components/ui/popover`
(pattern: `notification-popover.tsx`). The existing trigger element becomes
`PopoverTrigger` via `render={…}`; the header + `AGENTS.map` rows move into
`PopoverContent` (match width to the panel with `w-[var(--anchor-width)]` or a
fixed width consistent with today's `left-3 right-3`). Selecting an agent
keeps calling the existing `onSelect` and closes the popover; remove the
manual `onClose` plumbing that Popover now handles.

**Verify**: dev server → open HeyTalia, open the agent picker: opens anchored
above/below the trigger, closes on outside click and Escape, selection still
switches agent. No new tsc errors.

### Step 5 (E): chat/readonly inputs → `Input`/`InputGroup`

- `heytalia-panel.tsx` chat input: replace the raw `<input>` with `<Input>`
  from `@/components/ui/input`, preserving `ref={inputRef}`, value/onChange/
  onKeyDown, placeholder, and layout classes (Input accepts className;
  visually match the current compact height with e.g. `h-9 border-0
shadow-none focus-visible:ring-0` if the footer already draws the border).
  If matching the existing look requires fighting the primitive with 4+
  override classes, leave the raw input and note it in the report instead —
  a forced conversion that degrades the look is worse than the status quo.
- `lta-dialog.tsx:543`: rebuild the hand-built wrapper on
  `InputGroup`/`InputGroupInput` (see `src/components/ui/input-group.tsx`
  exports), preserving `readOnly`.

**Verify**: dev server → HeyTalia chat still types/sends (Enter works); LTA
dialog renders the readonly field identically. No new tsc errors.

## Test plan

No new unit tests (presentational recomposition; the project has no
component-test harness for these). The regression net: tsc, the vitest
baseline, and the per-step dev-server checks — each step names concrete
interactions to exercise. If the `verify` skill is available in your
environment, run it against the analytics tabs and share dialog flows.

## Done criteria

- [ ] `grep -rn '<select\|<table' src/routes src/components --include='*.tsx' | grep -v components/ui` → 0 matches
- [ ] `grep -rn '<textarea' src/routes src/components --include='*.tsx' | grep -v components/ui` → 0 matches
- [ ] `grep -rn 'role="dialog"' src/components/students/` → 0 matches
- [ ] All five step verifications pass in the dev server
- [ ] `bunx tsc --noEmit` ≤41 pre-existing; `bunx vitest run` no new failures;
      `bun run build` exit 0
- [ ] No files outside the in-scope list modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- A Recharts chart renders zero-height/blank inside `DialogContent` after a
  resize attempt (the `min-h-0 flex-1` wrapper should give
  ResponsiveContainer a measurable box; if it doesn't, this is the known
  chart-re-measure risk — report rather than hacking fixed pixel heights).
- The Popover in step 4 cannot anchor correctly inside the HeyTalia panel
  (clipped by overflow or wrong stacking) after trying `PopoverContent`
  positioning props.
- Step 5's honest-exit clause triggers for the chat input (report it — that
  outcome is acceptable).
- Any change seems to require editing `entity-selector.tsx` or a
  `src/components/ui/*` file.
- Excerpted code in "Current state" is gone (not merely line-shifted).

## Maintenance notes

- Reviewers: check the three dialogs' focus behavior and the analytics tables'
  column widths — those are the two places visual drift can hide.
- `entity-selector.tsx`'s raw inputs remain the one sanctioned bypass;
  converting it onto `ui/combobox` is a candidate future plan (needs its own
  interaction test pass).
- If a date/time-picker primitive is ever added to ui/, sweep the ~11 raw
  `<input type="date|time">` sites onto it.
