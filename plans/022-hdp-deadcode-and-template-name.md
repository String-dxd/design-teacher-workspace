# Plan 022: Remove dead HDP exports and fix the stale template name

> **Executor instructions**: Follow step by step. Run every verification command
> and confirm the expected result before moving on. If a STOP condition occurs,
> stop and report. Update this plan's row in `plans/README.md` when done unless a
> reviewer says they maintain it.
>
> **Drift check (run first)**: `git diff --stat 077d669..HEAD -- src/data/mock-students.ts src/data/report-layouts.ts src/routes/reports.cycle.layout.tsx`
> On any change since this plan was written, compare the excerpts below to live code before proceeding; on a mismatch, STOP.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: tech-debt
- **Planned at**: commit `077d669`, 2026-07-06

## Why this matters

Three small debts left by the HDP build/cleanup:

1. `classOptions` (`src/data/mock-students.ts:5427`) — a flat class list with **zero references** anywhere (the ClassSelector uses `groupedClassOptions`). Dead export that invites "which list do I use?" confusion.
2. `SECTION_FIELD_DEFS` (`src/data/report-layouts.ts:87`) — an exported map with **zero references** (it was speculative field-level metadata; no consumer exists).
3. The built-in template is named `'P1 Holistic Development'` (`report-layouts.ts:168`), but the reporting-cycle hub now covers **all primary (P1–P6)**. A P3 teacher sees "P1 Holistic Development" — misleading. Two fallback strings in the layout route repeat the stale name.

None change behavior; all reduce confusion.

## Current state

`src/data/mock-students.ts` (~5427):

```ts
export const classOptions: Array<ClassOption> = [
  { value: 'all', label: 'All Classes' },
  { value: '3A', label: 'Secondary 3A' },
  // ... ~10 entries ...
]
```

(There is also a `ClassOption` type/interface it references — check whether anything else uses it before removing it; see Step 1.)

`src/data/report-layouts.ts:87`:

```ts
export const SECTION_FIELD_DEFS: Record< ... > = { ... }
```

`src/data/report-layouts.ts:168` (inside `BUILT_IN_TEMPLATES[0]`):

```ts
    name: 'P1 Holistic Development',
```

`src/routes/reports.cycle.layout.tsx` — two fallback literals repeating the name:

- line ~171: `? 'P1 Holistic Development'`
- line ~221: `{getTemplateById(templateId)?.name ?? 'P1 Holistic Development'}`

## Commands you will need

| Purpose           | Command                                | Expected                                                                                       |
| ----------------- | -------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Typecheck         | `bunx tsc --noEmit`                    | count of `error TS` lines must not increase vs baseline **107**; no error in a file you edited |
| Tests             | `bun run test`                         | `Tests  65 passed (65)`                                                                        |
| Format (targeted) | `bunx prettier --check <edited files>` | clean                                                                                          |
| Lint (targeted)   | `bunx eslint <edited files>`           | exit 0                                                                                         |
| Usage check       | `grep -rn "<symbol>" src`              | as specified per step                                                                          |

> ⚠️ Do NOT run `bun run check` (repo-wide `prettier --write .`). Do NOT `bun install`. Do NOT `git checkout`/`git restore`/`rm -rf`; delete code only by editing the specific files below.

## Scope

**In scope**:

- `src/data/mock-students.ts` (remove `classOptions`, and `ClassOption` only if unused)
- `src/data/report-layouts.ts` (remove `SECTION_FIELD_DEFS`; rename template)
- `src/routes/reports.cycle.layout.tsx` (update the two fallback strings)

**Out of scope**: everything else, `plans/*`.

## Git workflow

- Branch: `advisor/022-hdp-deadcode-template-name`. One commit (`chore(reports): drop dead classOptions/SECTION_FIELD_DEFS exports, rename template to primary-wide`). Do NOT push/PR. (If a reviewer dispatched you and handles commits, leave uncommitted.)

## Steps

### Step 1: Remove `classOptions` (and `ClassOption` if unused)

Confirm dead: `grep -rn "classOptions" src` → the only match should be its definition in `mock-students.ts`. If there is ANY other match, STOP (it's used). Delete the `export const classOptions = [...]` block.
Then `grep -rn "ClassOption\b" src` — if `ClassOption` (the type) now has no references outside its own declaration, delete that declaration too; if it's still referenced (e.g. by other code), LEAVE it.

**Verify**: `grep -rn "classOptions" src` → no matches. `bunx tsc --noEmit 2>&1 | grep -c "error TS"` → ≤ 107.

### Step 2: Remove `SECTION_FIELD_DEFS`

Confirm dead: `grep -rn "SECTION_FIELD_DEFS" src` → only its definition in `report-layouts.ts`. If any other match, STOP. Delete the `export const SECTION_FIELD_DEFS = { ... }` block (and any now-unused local type it alone referenced — check with grep, remove only if unused).

**Verify**: `grep -rn "SECTION_FIELD_DEFS" src` → no matches. tsc error count ≤ 107.

### Step 3: Rename the template to primary-wide

In `src/data/report-layouts.ts:168`, change `name: 'P1 Holistic Development',` → `name: 'Primary Holistic Development',`.
In `src/routes/reports.cycle.layout.tsx`, change both fallback literals `'P1 Holistic Development'` (≈ lines 171 and 221) → `'Primary Holistic Development'`.

**Verify**: `grep -rn "P1 Holistic Development" src` → no matches (comments/docstrings that _describe_ P1 content may remain in report-layouts.ts headers — only the user-facing template NAME strings must change; if a match is a code comment, leave it and note it).

### Step 4: Confirm scope + gates

**Verify**: `git diff --name-only` → only the three in-scope files; targeted prettier `--check` clean on them; targeted eslint exit 0; `bun run test` → `Tests  65 passed (65)`; tsc error count ≤ 107.

## Test plan

No new tests (pure removals + a string rename). Existing suite must stay green (65). If a test references `classOptions`/`SECTION_FIELD_DEFS`/the old name, that's a real usage → STOP (the symbol wasn't dead).

## Done criteria

- [ ] `grep -rn "classOptions" src` → no matches
- [ ] `grep -rn "SECTION_FIELD_DEFS" src` → no matches
- [ ] `grep -rn "'P1 Holistic Development'" src` → no matches (string literals gone; descriptive comments allowed)
- [ ] `bunx tsc --noEmit 2>&1 | grep -c "error TS"` → ≤ 107 (no new errors)
- [ ] `bun run test` → `Tests  65 passed (65)`
- [ ] `git diff --name-only` → only `src/data/mock-students.ts`, `src/data/report-layouts.ts`, `src/routes/reports.cycle.layout.tsx`

## STOP conditions

- Any grep in Steps 1–2 finds a real usage of the "dead" symbol → STOP; it isn't dead.
- Removing a symbol raises the tsc error count above 107 → STOP (something depended on it).
- A file outside the three in scope shows as changed → STOP, do not revert, report.

## Maintenance notes

- If a future feature needs a flat class list or per-section field metadata, reintroduce a _used_ version rather than resurrecting these.
- The template is now "Primary Holistic Development"; if genuinely level-specific templates are later added (e.g. real P3+ grade layouts), revisit `BUILT_IN_TEMPLATES` and the fallback strings together.
