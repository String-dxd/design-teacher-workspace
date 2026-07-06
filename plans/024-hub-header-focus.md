# Plan 024: Make the student list the hub's focal point — compact the summary strip and tidy the control row

> **Executor instructions**: Follow step by step; verify each step. On any STOP condition, stop and report. Update this plan's row in `plans/README.md` when done unless a reviewer maintains it.
>
> **Drift check (run first)**: `git diff --stat 85dd742..HEAD -- src/routes/reports.index.tsx`
> On any change since this plan was written, compare the excerpts below to live code; on mismatch, STOP.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: tech-debt (layout / visual hierarchy)
- **Planned at**: commit `85dd742`, 2026-07-06
- **Serves**: critique suggestions #2 and #3; layout-patterns.md #1 (one focal point) & #4 (density by register); catalog SLP-11 (cards only for interactive units)

## Why this matters

On the cycle hub (`/reports`, primary class + `hdp-reports` on), four large bordered metric boxes (Ready / Drafts / Sent / Not started) are the visual heavyweight of the page, but they are *static glance-info*. The student list below — the actual work surface the teacher scans and acts on — reads lighter and sits lower. The eye lands on the metric boxes, not the task (layout-patterns #1). Static content wrapped in card boxes also trips SLP-11 (a card is for an interactive unit; group static content with spacing/type/dividers instead). Compacting the metric strip lets the student list become the focal region. Separately, the control row's labelling is inconsistent (the class selector self-labels via its value, but the term picker carries an extra "Term" label), a small polish.

## Current state

`src/routes/reports.index.tsx`, inside `CycleHub`. Control row + summary strip:
```tsx
<div className="flex flex-wrap items-center justify-between gap-3">
  <div className="space-y-1">
    <Label htmlFor="cycle-term">Term</Label>
    <TermSelector value={term} onValueChange={(v) => v && setTerm(v)} />
  </div>
  <div className="flex flex-wrap items-center gap-2">
    <Button variant="outline" onClick={…}>…{cycle ? 'Edit layout' : 'Set up layout'}</Button>
    <AlertDialog …>{/* Share with parents (N) trigger + dialog */}</AlertDialog>
  </div>
</div>

{/* Cycle summary strip */}
<div className="grid grid-cols-1 gap-4 md:grid-cols-4">
  <div className="rounded-lg border bg-card p-4">
    <div className="text-sm text-muted-foreground">Ready</div>
    <div className="text-2xl font-semibold">{summary.ready} of {summary.total}</div>
  </div>
  <div className="rounded-lg border bg-card p-4">
    <div className="text-sm text-muted-foreground">Drafts</div>
    <div className="text-2xl font-semibold">{summary.drafts}</div>
  </div>
  {/* …Sent, Not started cards, same shape… */}
</div>
```
`summary` is `{ ready, drafts, sent, total }` (numbers). The `ClassSelector` is rendered by the parent `ReportsPage` **above** `CycleHub` and is shared with the legacy view — **out of scope** here (do not move or restructure it).

**Conventions**: Tailwind + shadcn tokens; `text-muted-foreground`, `bg-card`, `border`, spacing from the scale; `TYP` type steps. `bun run check` is repo-wide-destructive — do NOT run it; use targeted commands.

## Commands you will need

| Purpose | Command | Expected |
|---|---|---|
| Typecheck | `bunx tsc --noEmit` | no error in `reports.index`; total ≤ 107 |
| Tests | `bun run test` | `Tests  75 passed (75)` |
| Format (targeted) | `bunx prettier --check src/routes/reports.index.tsx` | clean |
| Lint (targeted) | `bunx eslint src/routes/reports.index.tsx` | exit 0 |
| Browser verify | Step 3 | student list is the focal region; stats read as one compact line |

> ⚠️ Do NOT run `bun run check`, `bun install`, `git checkout`, `git restore`, `rm`.

## Scope

**In scope**: `src/routes/reports.index.tsx` (the `CycleHub` control row + summary strip only).
**Out of scope**: `ClassSelector` and its placement in `ReportsPage`; the legacy (`LegacyReportsView`) branch; the student table component; `plans/*`.

## Steps

### Step 1: Replace the 4 metric cards with one compact inline stat strip

Replace the `grid … md:grid-cols-4` block of four `rounded-lg border bg-card p-4` boxes with a single, low-weight stat line — one row, no per-stat boxes. Target shape (match the repo's token/spacing idiom; keep the same four numbers and labels):
```tsx
{/* Cycle summary — compact, so the student list stays the focal point */}
<div className="text-muted-foreground flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
  <span><span className="text-foreground font-semibold">{summary.ready}</span> of {summary.total} ready</span>
  <span><span className="text-foreground font-semibold">{summary.drafts}</span> drafts</span>
  <span><span className="text-foreground font-semibold">{summary.sent}</span> sent</span>
  <span><span className="text-foreground font-semibold">{summary.notStarted ?? (summary.total - summary.ready - summary.drafts - summary.sent)}</span> not started</span>
</div>
```
Notes:
- Use whatever `summary` fields exist. If `summary` has no `notStarted`, compute it as shown or read the field the code already uses for the "Not started" card (check the current 4th card's expression and reuse it verbatim). Do NOT invent a new field on the summary object unless the current card already derives it inline — mirror the current derivation.
- No `border`, no `bg-card`, no per-stat box — this is the SLP-11 point.

**Verify**: `bunx tsc --noEmit 2>&1 | grep -c "reports.index"` → 0.

### Step 2: Make the two pickers label-consistent

The `ClassSelector` (rendered above, out of scope) self-labels through its displayed value ("Primary 1 · P1-A"); the `TermSelector` shows "Term 2" but also carries a separate `<Label htmlFor="cycle-term">Term</Label>`. Remove that redundant `<Label>` and the wrapping `space-y-1` div so the term picker sits inline as a peer, matching the self-labelling class picker:
```tsx
<TermSelector value={term} onValueChange={(v) => v && setTerm(v)} />
```
(Keep the `id="cycle-term"` on the TermSelector only if plan 020's a11y label work is in place; if the `<Label>` is the only thing referencing it, removing both is fine here.) If removing the label would drop a needed accessible name and plan 020 has NOT landed, leave the label and STOP-note it instead.

**Verify**: control row still renders class picker + term picker + Edit-layout + Share on one wrapping row.

### Step 3: Browser verification (required)

Dev server up, `hdp-reports` on, `/reports` at `P1-A` with a saved layout and ≥1 ready student. Confirm: the four counts read as **one compact line** (no boxes), and the **student list** is now the most prominent region below the controls (squint test — it should win attention over the stat line). Capture a 1280 screenshot for the reviewer.

### Step 4: Confirm scope + gates

`git diff --name-only` → only `src/routes/reports.index.tsx`; targeted prettier `--check` clean; targeted eslint exit 0; `bun run test` → 75.

## Test plan

No unit test (pure presentational change). Verification = gates + the Step 3 browser check (compact stats, student list focal). Confirm the four numbers still match the cycle state (mark one student ready → "1 of N ready").

## Done criteria

- [ ] The 4 metric boxes are gone; the counts render as one inline `text-sm` line with no `border`/`bg-card` boxes
- [ ] Term picker no longer carries a redundant separate label (or, if plan 020 hasn't landed and the label is the only a11y name, it's left with a STOP-note)
- [ ] `bunx tsc --noEmit` → no error in `reports.index`; total ≤ 107
- [ ] `bun run test` → 75; targeted prettier/eslint clean
- [ ] `git diff --name-only` → only `src/routes/reports.index.tsx`
- [ ] Browser: stats compact, student list is the focal region (screenshot attached)

## STOP conditions

- The `summary` object doesn't expose the counts used above (shape drift) → STOP.
- Removing the Term `<Label>` would leave the term picker with no accessible name and plan 020 isn't in place → leave the label, note it, continue with Step 1 only.
- Any file outside `reports.index.tsx` changes, or tests drop below 75 → STOP, do not revert, report.

## Maintenance notes

- The class/term pickers remain a two-tier arrangement (class is page-level, shared with the legacy view; term is hub-level). Fully unifying them into one control cluster would mean lifting term state up to `ReportsPage` — deferred as a larger change; not attempted here.
- Reviewer: confirm the compact stats still communicate progress at a glance and the student list clearly wins the squint test.
