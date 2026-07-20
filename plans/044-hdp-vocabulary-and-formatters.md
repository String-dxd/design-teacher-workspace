# Plan 044: One source of truth for HDP vocabulary labels and shared date/initials formatters

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 41c5962..HEAD -- src/components/hdp src/lib/hdp-draft-compose.ts src/data/insights.ts src/data/hdp.ts src/routes/_guest.hdp-report.\$token.tsx src/routes/_guest.hdp-student.\$token.tsx src/routes/announcements.index.tsx src/routes/announcements-admin.tsx src/routes/attendance.tsx src/components/reports src/routes/holistic-reports.\$id.tsx`
> If in-scope files changed, compare "Current state" excerpts before
> proceeding; on a mismatch, STOP.
>
> **NEVER run `bun run check`** (repo-wide prettier — reformats unrelated
> files). Targeted `bunx prettier --check <file>` / `bunx eslint <file>` only.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: LOW–MED
- **Depends on**: plans/046-dead-code-sweep.md (deletes
  `term-summary-panel.tsx`, which otherwise appears in the replace lists —
  if 046 has not run, simply skip that file's entries)
- **Category**: tech-debt
- **Planned at**: commit `41c5962`, 2026-07-19

## Why this matters

The HDP module's domain vocabulary — four dispositions, five tag contexts —
is copy-pasted as local constant maps in **8+ files**, and the copies have
already drifted into three incompatible casings for the same context
(`'during lesson'` vs `'Lesson'` vs `'lesson'`). Date formatting is
re-implemented as a local `formatDate` in **16 files** with three divergent
output shapes ("17 Jul 2026" vs "17 Jul" vs date-fns `'d MMM'`), and
`getInitials` exists 4× with one forked, subtly buggier copy. Renaming a
disposition or changing date presentation is today a 10-file lockstep edit
that will silently miss copies. This plan creates single tested sources of
truth and repoints every site **without changing any rendered output** —
each site keeps its current casing/shape via the appropriate export.

## Current state

This is a design prototype: TanStack Start + React 19, fixtures in
`src/data/`, localStorage stores in `src/lib/hdp-store.ts`. Domain types live
in `src/types/hdp.ts`:

```ts
// src/types/hdp.ts:6
export type TagContext = 'lesson' | 'marking' | 'cca' | 'form-time' | 'other'
// disposition ids: 'perseverance' | 'curiosity' | 'collaboration' | 'self-direction'
```

`CONTEXT.md` at the repo root is the domain-vocabulary record — read its
Disposition/Context entries before writing labels; the canonical display
strings are the ones already in the code below.

### Duplicated label maps (verified 2026-07-19)

`DISPOSITION_LABELS` — identical `{perseverance: 'Perseverance', curiosity:
'Curiosity', collaboration: 'Collaboration', 'self-direction': 'Self-direction'}`
declared at:

- `src/components/hdp/stream-item.tsx:25`
- `src/components/hdp/disposition-mix-bar.tsx:4`
- `src/components/hdp/pattern-card.tsx:7`
- `src/components/hdp/tag-pill.tsx:4`
- `src/lib/hdp-draft-compose.ts:32`
- `src/data/hdp.ts:1466` (as `SEED_DISPOSITION_LABELS`)

> **Amended 2026-07-20 (executor STOP, verified by advisor)**: `src/data/insights.ts`
> is EXCLUDED from this plan. Its `DISPOSITION_LABELS` (insights.ts:29) is
> lowercase ('perseverance', …), not the Title-case canonical map, and its
> `CONTEXT_LABELS` (insights.ts:36) is a pluralized prose variant
> (`lesson: 'lessons'`, `other: 'other settings'`) — both feed sentence
> templates in `observationLabel`/`patternLabel` and are deliberate
> site-specific prose, not drifted copies. Leave both untouched.

Same data as `DISPOSITIONS` arrays (`Array<{id, label}>`) at
`src/components/hdp/tag-queue-composer.tsx:17` and
`src/components/hdp/broadcast-requests-panel.tsx:67`.

`CONTEXT_LABELS` — **three drifted casings**:

```ts
// src/components/hdp/stream-item.tsx:17  (sentence-position phrases)
lesson: 'during lesson', marking: 'while marking', cca: 'CCA', …
// src/components/hdp/report-story.tsx:78  (title-case chips)
lesson: 'Lesson', marking: 'Marking', …
// src/lib/hdp-draft-compose.ts:24  (bare nouns used in composed sentences)
lesson: 'lesson', marking: 'marking', cca: 'CCA', …
```

Also `src/components/hdp/term-summary-panel.tsx:19` (phrases variant —
deleted by plan 046; skip if already gone). Check for further `CONTEXT_LABELS`
declarations with `grep -rn "CONTEXT_LABELS" src/` and classify each into one
of the three variants before replacing.

### Duplicated `formatDate` (16 copies, three shapes)

Byte-identical `toLocaleDateString('en-SG', {day:'numeric', month:'short',
year:'numeric'})` at: `src/components/hdp/reports-home.tsx:54`,
`release-manager.tsx:50`, `marks-grid.tsx:35`, `report-story.tsx:63`,
`src/routes/_guest.hdp-report.$token.tsx:45`,
`_guest.hdp-student.$token.tsx:40`.

No-year variant (`{day,month}` only) at
`src/components/hdp/broadcast-responder-card.tsx:4` (and
`term-summary-panel.tsx:31` — plan 046 deletes it).

date-fns `format(new Date(iso), 'd MMM')` at
`src/components/hdp/broadcast-composer.tsx:42`; `formatDateShort` at
`src/lib/hdp-draft-compose.ts:39`.

`undefined → '—'` guarded variant at `src/routes/announcements.index.tsx:99`
and `src/routes/announcements-admin.tsx:53`. Additional relatives:
`form-response-table.tsx:53` (`formatDate` with time via `toLocaleString`),
`meetings.new.tsx:90,101` (`formatDateFull`/`formatDateMedium`),
`announcements.$id.tsx:56` (`formatDateTime`). Enumerate the live set with
`grep -rn "function formatDate" src/`.

### Duplicated `getInitials` (4 copies, one forked)

Filtered (correct) version at `src/components/reports/report-preview.tsx:492`,
`src/components/reports/parent-preview-dialog.tsx:16`,
`src/routes/holistic-reports.$id.tsx:41`. **Forked** copy missing
`.filter((part) => part.length > 0)` at `src/routes/attendance.tsx:27`
(breaks on double spaces).

### Conventions

- Pure helpers live in `src/lib/` with colocated `*.test.ts` (exemplars:
  `src/lib/hdp-trends.ts` + `hdp-trends.test.ts`).
- Path alias `@/*` → `src/*`.
- Repo policy (`AGENTS.md`): consolidation of repeated logic is explicitly
  sanctioned; creating *components* is not needed here — these are plain
  modules.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Typecheck | `bunx tsc --noEmit` | 76 pre-existing errors at planning time, 0 new |
| Tests | `bunx vitest run` | 190 pass / 6 fail baseline (flaky `imported-columns.test.ts`); no new failures |
| Build | `bun run build` | exit 0 |
| Targeted format/lint | `bunx prettier --check <files>` / `bunx eslint <files>` | clean |

## Scope

**In scope**:

- Create `src/lib/hdp-labels.ts` + `src/lib/hdp-labels.test.ts`
- Create `src/lib/format.ts` + `src/lib/format.test.ts`
- Every file listed above under the three duplication headings (replace the
  local declarations with imports)

**Out of scope**:

- `src/lib/utils.ts` — leave `cn()` alone; new helpers go in the new files.
- Any change to rendered strings. This is a repoint, not a copy edit — if a
  site currently renders "17 Jul" it must still render "17 Jul".
- The legacy `src/components/reports/` tree beyond the two `getInitials`
  files named (do not refactor other legacy code while there).
- `src/components/hdp/term-summary-panel.tsx` if plan 046 already deleted it.
- Merging `meetings.new.tsx` `formatDateFull/Medium` or
  `announcements.$id.tsx` `formatDateTime` is optional — include only if the
  shared API covers them without new options; otherwise leave and note.

## Git workflow

- Branch: `advisor/044-hdp-vocabulary-formatters`
- Conventional commits, one per step (e.g. `refactor(hdp): single source for disposition/context labels`)
- Do NOT push or open a PR unless instructed.

## Steps

### Step 1: Create `src/lib/hdp-labels.ts`

```ts
import type { TagContext } from '@/types/hdp'
// Use the actual disposition id type — check src/types/hdp.ts for its name
// (DispositionId is imported in disposition-mix-bar.tsx; verify its source).

export const DISPOSITION_LABELS: Record<DispositionId, string> = {
  perseverance: 'Perseverance',
  curiosity: 'Curiosity',
  collaboration: 'Collaboration',
  'self-direction': 'Self-direction',
}

/** Ordered list for pickers (tag composer, request panels). */
export const DISPOSITIONS: Array<{ id: DispositionId; label: string }> = …

/** Title-case chip labels: 'Lesson', 'Marking', … */
export const CONTEXT_LABELS: Record<TagContext, string> = …

/** Sentence-position phrases: 'during lesson', 'while marking', … */
export const CONTEXT_PHRASES: Record<TagContext, string> = …

/** Bare nouns for composed prose: 'lesson', 'marking', 'CCA', … */
export const CONTEXT_NOUNS: Record<TagContext, string> = …
```

Copy each map's values **verbatim from the current sites** (stream-item →
PHRASES, report-story → LABELS, hdp-draft-compose → NOUNS; compare all copies
of each variant first — if two same-variant copies disagree on any value,
STOP and report the discrepancy instead of picking one).

**Verify**: `bunx tsc --noEmit` → no new errors.

### Step 2: Create `src/lib/format.ts`

```ts
/** '17 Jul 2026' (default) or '17 Jul' with { year: false }; undefined → '—'. */
export function formatDate(
  iso: string | undefined,
  opts?: { year?: boolean },
): string { … } // toLocaleDateString('en-SG', …)

export function getInitials(name: string): string { … } // the FILTERED version
```

Use the filtered `getInitials` implementation from
`src/components/reports/report-preview.tsx:492` verbatim.

**Verify**: `bunx tsc --noEmit` → no new errors.

### Step 3: Repoint label-map sites

For each file in the label-map list: delete the local
`DISPOSITION_LABELS`/`CONTEXT_LABELS`/`DISPOSITIONS`/`SEED_DISPOSITION_LABELS`
declaration and import the matching export from `@/lib/hdp-labels` (rename at
the import site where the local name differs, e.g.
`import { CONTEXT_PHRASES as CONTEXT_LABELS }` is acceptable but prefer
updating usages to the canonical name). `broadcast-composer.tsx` keeps
date-fns only if still used for other calls; otherwise drop the import.

Commit per 3–4 files so a bad replace bisects easily.

**Verify after all**: `grep -rn "const DISPOSITION_LABELS\|const CONTEXT_LABELS\|const SEED_DISPOSITION_LABELS\|const DISPOSITIONS: Array" src/ --include='*.ts*' | grep -v hdp-labels` → 0 matches; `bunx tsc --noEmit` → no new errors.

### Step 4: Repoint `formatDate` and `getInitials` sites

Replace each local `formatDate` with `import { formatDate } from '@/lib/format'`,
passing `{ year: false }` where the site's current copy omits the year, and
nothing where it includes it. The two announcements sites already accept
`undefined` — the shared guard covers them. For `hdp-draft-compose.ts`'s
`formatDateShort` ('d MMM' = day + short month, no year): replace with
`formatDate(iso, { year: false })` **only if the output is byte-identical
for the test fixtures** (run `bunx vitest run src/lib/hdp-draft-compose.test.ts`
— it has determinism tests); otherwise keep the local function and note it.

Replace the 4 `getInitials` copies with the shared import (this *fixes* the
attendance fork — the only intended output change, and only for
whitespace-irregular names).

**Verify**: `grep -rn "function formatDate\b\|function getInitials" src/ | grep -v "src/lib/format.ts"` → only the out-of-scope optional sites remain (meetings/announcements.$id/form-response-table if skipped); `bunx tsc --noEmit` → no new errors.

### Step 5: Tests + gates

Write the tests (below), then run the full gates.

**Verify**: `bunx vitest run` → new tests pass, no new failures; `bun run build` → exit 0; targeted prettier/eslint on all touched files → clean.

## Test plan

- `src/lib/format.test.ts` (model after `src/lib/hdp-trends.test.ts`):
  formatDate with year (fixed ISO input → exact string), without year,
  `undefined → '—'`; getInitials happy path, double-space name, single name,
  lowercase input → uppercase output.
- `src/lib/hdp-labels.test.ts`: each map covers every `TagContext` /
  disposition id (exhaustiveness is enforced by `Record` types, so assert
  representative values instead — e.g. `CONTEXT_PHRASES.lesson === 'during lesson'`,
  `CONTEXT_LABELS.lesson === 'Lesson'` — to pin the casing contract).
- Existing suites are the real safety net: `hdp-draft-compose.test.ts` has
  determinism tests that will catch any accidental casing change in composed
  claims. Run it explicitly after Step 3.

## Done criteria

- [ ] `bunx tsc --noEmit` → no new errors vs baseline
- [ ] `bunx vitest run` → all new tests pass, no new failures (esp.
      `hdp-draft-compose.test.ts` untouched-green)
- [ ] `bun run build` → exit 0
- [ ] Step 3 and Step 4 greps return 0 unexpected matches
- [ ] Visual spot-check (dev server): a river stream item still reads
      "… during lesson", a report-story chip still reads "Lesson", release
      manager dates still show "17 Jul 2026" shape
- [ ] `git status` → only in-scope files modified
- [ ] `plans/README.md` row updated

## STOP conditions

- Two copies of the *same* label variant disagree on a value (pick-one would
  silently change rendered output somewhere).
- `hdp-draft-compose.test.ts` fails after repointing — composed-claim
  provenance strings are load-bearing (P3/P4 guarantees from plan 032);
  do not "fix" the test.
- A `formatDate` call site turns out to feed something other than display
  (e.g. a storage key or comparison) — report it, don't convert it.
- Drift check fails on any in-scope file.

## Maintenance notes

- New HDP surfaces must import from `@/lib/hdp-labels` — a reviewer seeing a
  fresh local `DISPOSITION_LABELS` should reject it.
- If a fifth disposition or sixth context lands, the `Record` types make
  every map fail to compile until updated — that is the point.
- Deferred: unifying `meetings.new.tsx` / `announcements.$id.tsx` datetime
  formatters into `format.ts` (different shapes; do when next touched).
- react-doctor flags ~20 `toLocaleDateString`-in-render sites for
  server-vs-client timezone divergence; centralizing in `format.ts` makes a
  future explicit-`timeZone` fix a one-line change.
