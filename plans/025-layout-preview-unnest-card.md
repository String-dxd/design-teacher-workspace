# Plan 025: Remove the nested card in the layout-stage preview (SLP-4)

> **Executor instructions**: Follow step by step; verify each step. On any STOP condition, stop and report. Update this plan's row in `plans/README.md` when done unless a reviewer maintains it.
>
> **Drift check (run first)**: `git diff --stat 85dd742..HEAD -- src/routes/reports.cycle.layout.tsx src/components/reports/report-preview.tsx`
> On any change since this plan was written, compare the excerpts below to live code; on mismatch, STOP.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: tech-debt (visual — SLP-4)
- **Planned at**: commit `85dd742`, 2026-07-06
- **Serves**: critique suggestion #4; catalog SLP-4 ("no nested cards; flatten with spacing, typography, and dividers")

## Why this matters

On the layout stage (`/reports/cycle/layout`), the live preview wraps the whole report document in a bordered card, and inside that card the "Term at a glance" hero is _another_ bordered card — a card inside a card. SLP-4 forbids nested cards (flatten with spacing/dividers instead). The nesting exists only on this preview surface: the parent guest view and the layout-aware detail page render the same `ReportPreview` **without** an outer card, so the hero's border is the single frame there and is correct. So the fix belongs on the preview wrapper, not the hero.

## Current state

`src/routes/reports.cycle.layout.tsx` — the preview section (around line 257):

```tsx
<section aria-label="Live preview" className="w-full flex-1">
  <div className="bg-card rounded-xl border p-6 shadow-sm">
    <p className="text-muted-foreground mb-4 text-xs">
      {sampleStudent
        ? `Previewing with ${sampleStudent.name}’s data`
        : 'Live preview'}
    </p>
    {previewReport && (
      <ReportPreview
        report={previewReport}
        blocks={blocks}
        comments={previewReport.teacherComments ?? ''}
      />
    )}
  </div>
</section>
```

`src/components/reports/report-preview.tsx` — `TermAtAGlance` (around line 65) is itself a bordered card and must **not** change (it's the single frame in the un-wrapped parent/detail contexts):

```tsx
<div className="bg-card flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center sm:gap-6">
  {/* attendance ring + attendance + conduct */}
</div>
```

**Conventions**: shadcn tokens; the outer card uses `bg-card rounded-xl border p-6 shadow-sm`. `bun run check` is repo-wide-destructive — do NOT run it; use targeted commands.

## Commands you will need

| Purpose           | Command                                                       | Expected                                                             |
| ----------------- | ------------------------------------------------------------- | -------------------------------------------------------------------- |
| Typecheck         | `bunx tsc --noEmit`                                           | no error in `reports.cycle.layout`; total ≤ 107                      |
| Tests             | `bun run test`                                                | `Tests  75 passed (75)`                                              |
| Format (targeted) | `bunx prettier --check "src/routes/reports.cycle.layout.tsx"` | clean                                                                |
| Lint (targeted)   | `bunx eslint "src/routes/reports.cycle.layout.tsx"`           | exit 0                                                               |
| Browser verify    | Step 2                                                        | preview shows one level of framing (hero only), not a card-in-a-card |

> ⚠️ Do NOT run `bun run check`, `bun install`, `git checkout`, `git restore`, `rm`.

## Scope

**In scope**: `src/routes/reports.cycle.layout.tsx` — the preview wrapper only.
**Out of scope**: `report-preview.tsx` / `TermAtAGlance` (the hero border is correct in the un-wrapped contexts — do NOT touch it, or you'll flatten the parent/detail hero too). `plans/*`.

## Steps

### Step 1: Flatten the outer preview wrapper

Remove the outer card's framing so the hero is the only bordered element inside the preview. Drop `rounded-xl border shadow-sm` (and `bg-card`) from the wrapper `<div>`, keeping the padding and the "Previewing with …" caption. Target:

```tsx
<section aria-label="Live preview" className="w-full flex-1">
  <div className="p-6">
    <p className="text-muted-foreground mb-4 text-xs">
      {sampleStudent
        ? `Previewing with ${sampleStudent.name}’s data`
        : 'Live preview'}
    </p>
    {previewReport && (
      <ReportPreview
        report={previewReport}
        blocks={blocks}
        comments={previewReport.teacherComments ?? ''}
      />
    )}
  </div>
</section>
```

(If a subtle boundary between the controls column and the preview is still wanted, a single left divider — `lg:border-l lg:pl-6` on the section — is acceptable and cheaper than a full card; use it only if the preview otherwise floats. Prefer the plain version first.)

**Verify**: `bunx tsc --noEmit 2>&1 | grep -c "reports.cycle.layout"` → 0.

### Step 2: Browser verification (required)

Dev server up, `hdp-reports` on, open `/reports/cycle/layout?classId=P1-A&term=Term%202`. Confirm the preview now shows **one** level of framing — the "Term at a glance" hero card — with the surrounding document content flat (no outer card border around the whole preview). Capture a 1280 screenshot. Also open the parent view (`/report-view/<id>` for a shared P1 report) and confirm the hero there is unchanged (still bordered) — proving `TermAtAGlance` was not touched.

### Step 3: Confirm scope + gates

`git diff --name-only` → only `src/routes/reports.cycle.layout.tsx`; targeted prettier `--check` clean; eslint exit 0; `bun run test` → 75.

## Test plan

No unit test (presentational). Verification = gates + the Step 2 browser check (one frame in the preview; parent-view hero unchanged).

## Done criteria

- [ ] The preview wrapper no longer has `border`/`shadow-sm` (no outer card); the hero remains the single framed element
- [ ] `report-preview.tsx` is unchanged (`git diff --name-only` does not list it)
- [ ] `bunx tsc --noEmit` → no error in the edited file; total ≤ 107
- [ ] `bun run test` → 75; targeted prettier/eslint clean
- [ ] Browser: layout preview = one frame; parent-view hero still bordered

## STOP conditions

- The preview wrapper markup differs from the excerpt (drift) → STOP.
- You find yourself editing `report-preview.tsx`/`TermAtAGlance` → STOP (that would flatten the hero in the parent/detail views too — out of scope).
- Any file outside `reports.cycle.layout.tsx` changes, or tests drop below 75 → STOP, report.

## Maintenance notes

- The section list on the left (each section in its own bordered row) is a separate density question, deliberately left alone here — those rows are interactive (toggle/reorder), so SLP-11 permits the framing.
- Reviewer: confirm the parent guest view's hero is visually identical before/after (the change must not reach it).
