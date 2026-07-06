# Plan 020: Associate labels with the term picker and the comments editor (a11y)

> **Executor instructions**: Follow step by step, verifying each step. STOP on any
> STOP condition. Update this plan's row in `plans/README.md` when done unless a
> reviewer maintains it.
>
> **Drift check (run first)**: `git diff --stat 077d669..HEAD -- src/components/reports/term-selector.tsx src/components/comms/rich-text-editor.tsx src/routes/reports.index.tsx src/components/reports/report-preview.tsx`
> On any change since this plan was written, compare excerpts to live code; on mismatch, STOP.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW (additive optional props; no behavior change for existing callers)
- **Depends on**: none
- **Category**: bug (a11y — WCAG 1.3.1 Info & Relationships)
- **Planned at**: commit `077d669`, 2026-07-06

## Why this matters

Two form controls in the cycle hub / Write stage render a visible `<Label htmlFor="…">` whose target `id` is **never applied to the control**, so screen readers announce the control without its label:

1. Hub term picker: `<Label htmlFor="cycle-term">Term</Label>` (`reports.index.tsx:820`) but `TermSelector` doesn't accept/forward an `id` — its `SelectTrigger` has no id.
2. Write-stage comments: `<Label htmlFor="ft-comments">Form-teacher comments</Label>` (`report-preview.tsx:255`) but `RichTextEditor` doesn't forward an id, and its editable region is a Tiptap **contenteditable `div`** — which `<label for>` cannot associate with anyway (only labelable form elements). It needs `aria-label`/`aria-labelledby`.

## Current state

`src/components/reports/term-selector.tsx` — props `{ value, onValueChange }`; renders `<SelectTrigger className="w-[140px]">`. No `id`.

`reports.index.tsx:820-821`:
```tsx
<Label htmlFor="cycle-term">Term</Label>
<TermSelector value={term} onValueChange={(v) => v && setTerm(v)} />
```

`src/components/comms/rich-text-editor.tsx` — `RichTextEditorProps` = `{ value, onChange, placeholder?, className?, onBlur?, minHeight?, toolbar? }`. The contenteditable is configured via `useEditor({ ..., editorProps: { attributes: { class: '…' } } })` (around lines 116-131). No accessible name is set.

`report-preview.tsx:255-256`:
```tsx
<Label htmlFor="ft-comments">Form-teacher comments</Label>
<RichTextEditor value={comments} onChange={...} toolbar="simple" placeholder="…" />
```

**Conventions**: optional props with sensible defaults; the SelectTrigger is a shared `ui/select` primitive that already spreads props; two-space indent.

## Commands you will need

| Purpose | Command | Expected |
|---|---|---|
| Typecheck | `bunx tsc --noEmit` | no error in the 4 edited files; total ≤ baseline 107 |
| Tests | `bun run test` | `Tests  65 passed (65)` |
| Format (targeted) | `bunx prettier --check <edited files>` | clean |
| Lint (targeted) | `bunx eslint <edited files>` | exit 0 |

> ⚠️ Do NOT run `bun run check` (repo-wide `prettier --write .`). Do NOT `bun install`, `git checkout`, `git restore`, or `rm`.

## Scope

**In scope**:
- `src/components/reports/term-selector.tsx` (add optional `id` prop → SelectTrigger)
- `src/routes/reports.index.tsx` (pass `id="cycle-term"`)
- `src/components/comms/rich-text-editor.tsx` (add optional `ariaLabel` prop → editor's contenteditable `aria-label`)
- `src/components/reports/report-preview.tsx` (pass `ariaLabel="Form-teacher comments"`)

**Out of scope**: `ui/select.tsx` and other RichTextEditor call sites (the new props are optional; existing callers are unaffected — do not change them). `plans/*`.

## Git workflow

Branch `advisor/020-hdp-form-label-associations`. One commit (`fix(a11y): associate term picker and comments editor with their labels`). Do NOT push/PR. (If a reviewer dispatched you and handles commits, leave uncommitted.)

## Steps

### Step 1: TermSelector accepts and forwards `id`
Add `id?: string` to `TermSelectorProps`; destructure it; pass to `<SelectTrigger id={id} className="w-[140px]">`. (SelectTrigger is a button — a labelable element, so `htmlFor` will now bind.)
**Verify**: `bunx tsc --noEmit 2>&1 | grep -c "term-selector"` → 0.

### Step 2: Pass the id at the hub
In `reports.index.tsx` (~line 821), change to `<TermSelector id="cycle-term" value={term} onValueChange={(v) => v && setTerm(v)} />`.

### Step 3: RichTextEditor accepts an accessible name
Add `ariaLabel?: string` to `RichTextEditorProps`; destructure it in the component; inject it into the contenteditable via the editor's `editorProps.attributes` — add `'aria-label': ariaLabel` (only when set) alongside the existing `class`. Concretely, `attributes: { class: '…', ...(ariaLabel ? { 'aria-label': ariaLabel } : {}) }`.
**Verify**: `bunx tsc --noEmit 2>&1 | grep -c "rich-text-editor"` → 0.

### Step 4: Pass the accessible name at the comments editor
In `report-preview.tsx` (~line 256), add `ariaLabel="Form-teacher comments"` to the `<RichTextEditor .../>` used for form-teacher comments. (Leave the visible `<Label>` as-is — it's still a useful visible heading; the `htmlFor` is now redundant but harmless. Optionally drop the `htmlFor` since it can't bind a contenteditable — but do NOT remove the visible label text.)

### Step 5: Confirm scope + gates
**Verify**: `git diff --name-only` → only the 4 in-scope files; targeted prettier `--check` clean; targeted eslint exit 0; `bun run test` → 65 pass.

## Test plan

No unit test framework for a11y here. Verification is the gates above + a **reviewer browser check**: on the hub, the term `Select` trigger exposes the accessible name "Term" (via the now-bound label); in the Write stage, the comments editor's contenteditable exposes accessible name "Form-teacher comments" (`aria-label`). Reviewer confirms via the accessibility tree / `getComputedAccessibleName`.

## Done criteria

- [ ] `TermSelector` has an optional `id` prop applied to `SelectTrigger`; hub passes `id="cycle-term"`
- [ ] `RichTextEditor` has an optional `ariaLabel` prop applied to the contenteditable's `aria-label`; comments editor passes `ariaLabel="Form-teacher comments"`
- [ ] `bunx tsc --noEmit` → no error in the 4 files; total ≤ 107
- [ ] `bun run test` → `Tests  65 passed (65)`
- [ ] targeted prettier `--check` clean; targeted eslint exit 0
- [ ] `git diff --name-only` → exactly the 4 in-scope files

## STOP conditions

- `TermSelector`/`RichTextEditor` signatures differ from the excerpts → STOP (drift).
- Adding `aria-label` to `editorProps.attributes` breaks the editor render/types → STOP and report (do not restructure the editor).
- Any file outside the 4 in scope shows changed → STOP, do not revert, report.

## Maintenance notes

- The new props are optional and additive — other `RichTextEditor`/`TermSelector` call sites are unaffected. If a11y is later systematized, consider making `ariaLabel` required for editors that lack a bound `<label>`.
- **Deferred (not in this plan)**: moving focus to the student heading and announcing via `aria-live` on Write-stage student navigation. Since plan 019 made the Write body remount per student (`key={studentId}`), that is now best done as a focus-on-mount + a polite live region inside `CycleWriteBody`; specify and verify it separately with a screen-reader/AT pass.
