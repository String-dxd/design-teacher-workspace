# Plan 029: HDP copy & voice pass — sentence case, consistent tone, clean typography

> **Executor instructions**: Follow step by step; verify each step. On any STOP condition, stop and report. Update this plan's row in `plans/README.md` when done.
>
> **Drift check (run first)**: `git diff --stat 3aa0371..HEAD -- src/components/reports/report-preview.tsx src/routes/reports.index.tsx src/routes/holistic-reports.index.tsx src/components/reports/pg-report-preview-dialog.tsx`

## Status

- **Priority**: P2 (do after 027/028 so copy edits land on the cleaned-up markup)
- **Effort**: S
- **Risk**: LOW (string changes only)
- **Planned at**: commit `3aa0371`, 2026-07-13
- **Execute via**: `tfx:copy` (TFX voice & tone, sentence-case convention, anti-AI-writing rules).
- **Baseline gates**: tsc 81 / vitest 98-24 / build 0.

## Why this matters

The app's copy convention is **sentence case** for UI labels/headings and a calm, parent-respecting voice on parent-facing surfaces. The HDP area mixes Title Case and sentence case within single pages, has one casual interjection in an otherwise formal report, and uses inconsistent apostrophe glyphs. `tfx:copy` owns TFX voice/tone + capitalization + the anti-slop rules; this plan feeds it the concrete sites.

## Step 1 — Title Case → sentence case (UI labels)

Confirmed sites (both hub routes carry these; they are legacy/secondary metric-card labels + Select option labels):

- `reports.index.tsx` and `holistic-reports.index.tsx`: metric-card labels `Total Reports` → `Total reports`, `Pending Review` → `Pending review`, `Not Sent` → `Not sent`. Also the `not_sent: 'Not Sent'` status-label maps and the `<SelectItem>` "Not Sent" option labels → `Not sent`.
- `pg-report-preview-dialog.tsx:185`: `Issued Date:` → `Issued date:`.

Note: the live P1-A cycle hub already uses sentence case ("in review", "approved", "sent", "awaiting results"). These fixes bring the legacy branch + stale twin route into line with it.

## Step 2 — Voice: drop the casual interjection

`report-preview.tsx:590` — `Good job!` sits inside an otherwise formal, parent-facing report as casual encouragement to the teacher. Remove it, or replace with a neutral, parent-appropriate descriptor consistent with the surrounding attendance microcopy. Use `tfx:copy` judgment; the surrounding line is the "Days present / Days late" attendance summary — the replacement (if any) should describe, not cheer.

## Step 3 — Typography: consistent apostrophes

`report-preview.tsx` mixes curly `’` (e.g. lines ~361, ~461) and straight `'` (heading descriptors ~798, ~863, ~948) apostrophes. Pick the curly `’` (already dominant in the parent-facing prose) and normalize the straight ones in user-visible strings. Do NOT touch apostrophes inside code (identifiers, object keys).

## Step 4 — Sweep for AI-writing tells + heading/descriptor voice

Run the `tfx:copy` anti-slop checks over the HDP section headings and their one-line descriptors (`report-preview.tsx` section descriptors, the write-page and layout-page subtitles, dialog descriptions). Confirm each descriptor speaks to the reader (parent on the document; teacher on the hub/write/layout), sentence case, no em-dash overuse, no rule-of-three padding, no vague attributions.

## Gates + bookkeeping

- `bunx tsc --noEmit` = 81 (0 new). `bunx vitest run` = 98/24. `bun run build` exit 0.
- Targeted prettier + eslint on touched files.
- Browser: spot-check the corrected labels render (metric cards on a legacy/secondary class or `holistic-reports`, PG dialog "Issued date", the report document where "Good job!" was).
- Update this plan's row in `plans/README.md`.

## STOP conditions

- A string is referenced as a key/value in logic (not just displayed) — changing it would break a lookup → STOP and report (change the display label only, not the key).
- A "Title Case" term is a proper noun / official MOE programme name (e.g. "Values in Action", "Parents Gateway", "Student Insights") → leave it; those are names, not sentence-case candidates.
