# Plan 008: Remove HeyTalia's purple identity — neutralize to slate/primary, retire the `twpurple` alias, and move stray Tailwind-violet badges onto Radix violet

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 9eb7dee..HEAD -- src/styles.css src/components/heytalia/heytalia-panel.tsx src/routes/announcements.index.tsx src/components/reports/hdp-data-step.tsx`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition. **If plan 007 has landed, `styles.css`
> line numbers below will have shifted — match by content, not line number.**

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED (recolors a visible, interactive AI panel; visual review required)
- **Depends on**: plan 007 *recommended first* (both edit `src/styles.css`; see
  "Coordination"). Not a hard code dependency.
- **Category**: tech-debt / design
- **Planned at**: commit `9eb7dee`, 2026-06-26

## Why this matters

HeyTalia (the in-app AI assistant panel) is the only surface in the app with a
**purple** brand identity (`twpurple`, a 1:1 alias of Radix `violet`). Every other
surface uses **T&S Blue** (`twblue` / the `--primary` token) plus slate neutrals —
even HeyTalia's own "Beta" badge already uses `twblue`. The maintainer's decision:
**remove the purple and match the rest of the UI** — recolor HeyTalia to neutral
slate, with the brand `--primary` (blue) used only on the primary action buttons.
The mascot SVG/logo artwork stays as-is (it is a brand mark).

Because HeyTalia is the only consumer of `twpurple`, once it is recolored the
`twpurple` scale becomes dead and is deleted. Separately, two files still use
**Tailwind's default `violet` palette** (`violet-50/200/600`) for category badges;
per the "use Radix colors, not Tailwind defaults" decision, those move onto the
Radix `violet` scale (which this plan registers as Tailwind utilities).

After this lands: no purple in the HeyTalia chrome, `twpurple` is gone, and the
only `violet` in the app is the Radix scale used by the two badges.

## Current state

### `src/components/heytalia/heytalia-panel.tsx` — every `twpurple` site (20 refs, verified complete)

The component centralizes some colors in an `HT` constant object (used via inline
`style={}`) and uses Tailwind classes elsewhere.

**`HT` color constants** (lines 28–35):

```tsx
const HT = {
  primary: 'var(--twpurple-9)',     // user message bubble bg (line 763); Info icon color (line 854)
  hover: 'var(--twpurple-10)',      // DEFINED BUT UNUSED (verified)
  ultraLight: 'var(--twpurple-2)',  // draft title-bar bg (826); warning box bg (847)
  light: 'var(--twpurple-3)',       // title pill bg (833); [For input] pill bg (970)
  border: 'var(--twpurple-5)',      // draft card border (821, 826); warning border (849)
  text: 'var(--twpurple-11)',       // title pill text (833); warning text (849); [For input] text (970)
} as const
```

**Tailwind-class sites** (line → current → intent):

| Line | Current classes | Role |
|---|---|---|
| 466 | `group-active:bg-twpurple-9` | resize-handle active indicator |
| 585 | `bg-twpurple-9 text-white` | **send-message button** (primary action) |
| 740 | `bg-twpurple-3` | AI avatar chip bg |
| 787 | `border-twpurple-5 bg-twpurple-3 ... text-twpurple-11 ... hover:bg-twpurple-4` | suggestion chips |
| 895 | `border-twpurple-9 bg-white ... text-twpurple-9 hover:bg-twpurple-2` | "Send email" (secondary/outline action) |
| 902 | `bg-twpurple-9 ... text-white` | **"Use draft" button** (primary action) |
| 946 | `bg-twpurple-9 text-white` | draft icon-button **active** state |
| 991 | `bg-twpurple-3` | typing-indicator avatar chip bg |
| 1002 | `bg-twpurple-9` | typing-indicator bouncing dots |

The mascot SVG (`HeyTaliaLogo`, lines 46–155) hardcodes `#9575CD` (purple) and
the `AGENTS` array has `color: '#9575CD'` (line 286). **Leave these untouched** —
the logo/agent artwork is out of scope (maintainer decision).

### `src/styles.css` — `twpurple` definitions to DELETE (at `9eb7dee`)

- `:root` lines 51–63 (comment + `--twpurple-1..12: var(--violet-1..12)`).
- `.dark` lines 197–208 (`--twpurple-1..12: var(--violet-dark-1..12)`).
- `@theme inline` lines 244–255 (`--color-twpurple-1..12: var(--twpurple-1..12)`).

The raw Radix `violet` is already imported (`src/styles.css:16-17`,
`@radix-ui/colors/violet.css` + `violet-dark.css`) but `violet` is NOT yet exposed
as a Tailwind utility (no `--color-violet-*` in `@theme inline`) and the raw
`--violet-*` is NOT dark-swapped in `.dark` (only `twpurple` was). The other Radix
scales' dark swaps end at the `--amber-12: var(--amber-dark-12);` line (line 170).

### Stray Tailwind-default `violet` (to migrate → Radix `violet`)

- `src/components/reports/hdp-data-step.tsx:47` — `text-violet-600`
- `src/components/reports/hdp-data-step.tsx:48` — `iconBg: 'bg-violet-50'`
- `src/routes/announcements.index.tsx:612` — `bg-violet-50 ... text-violet-600 ring-1 ring-inset ring-violet-200`

Radix equivalents (Radix step semantics: 3 = subtle bg, 6 = border, 11 = low-contrast text):
`bg-violet-50 → bg-violet-3`, `ring-violet-200 → ring-violet-6`,
`text-violet-600 → text-violet-11`.

### Repo conventions

- Tailwind v4, CSS-first config in `src/styles.css`. A color utility (`bg-violet-3`)
  exists only if the step is registered in `@theme inline` (same mechanism that
  makes `bg-twblue-9` work). The semantic tokens you'll reuse — `--primary`,
  `--muted`, `--border`, `--secondary`, `--foreground`, `--muted-foreground`,
  `--accent` — are all defined and exposed already.
- Conventional commits. `bun` runtime. `src/routeTree.gen.ts` not touched.

## Commands you will need

| Purpose   | Command            | Expected on success |
|-----------|--------------------|---------------------|
| Install   | `bun install`      | exit 0 |
| Build     | `bun run build`    | exit 0 |
| Typecheck | `npx tsc --noEmit 2>&1 \| grep -c "error TS"` | ≤ 113 (baseline at `9eb7dee`); must NOT increase |
| Tests     | `bunx vitest run 2>&1 \| grep "Tests "` | 37 passed, 16 failed (baseline — unchanged) |
| Dev smoke | `bun run dev` then open `/announcements` (HeyTalia panel lives here) | panel renders |

> The 16 failing tests (`draft-storage`, `imported-columns`) are pre-existing and
> unrelated; this plan touches no tests/logic. Gate: count unchanged.

## Suggested executor toolkit

- If `agent-browser` is available, use it for the step 4 visual check (open
  `/announcements`, open the HeyTalia panel via its launcher, screenshot the chat
  + a generated draft). Otherwise report that the visual check was skipped.

## Scope

**In scope** (the only files you may modify):

- `src/components/heytalia/heytalia-panel.tsx` (recolor; do NOT touch the SVG/AGENTS color)
- `src/styles.css` (delete twpurple; register violet; add violet dark-swap)
- `src/routes/announcements.index.tsx` (line 612 violet → Radix)
- `src/components/reports/hdp-data-step.tsx` (lines 47–48 violet → Radix)
- `plans/README.md` (status row)

**Out of scope** (do NOT touch):

- The `HeyTaliaLogo` SVG and `AGENTS[].color` (`#9575CD`) — brand artwork stays.
- `twblue` and `slate` scale definitions, and every other token in `styles.css`.
- The `@radix-ui/colors/violet*` imports — keep them (now genuinely used).
- Any other component. If a file outside this list seems to need changes, STOP.

## Git workflow

- Branch: `advisor/008-remove-heytalia-purple`
- Conventional commits, e.g.
  `refactor(heytalia): recolor from twpurple to neutral slate/primary`,
  `chore(theme): remove unused twpurple alias; register Radix violet utilities`,
  `refactor(ui): move category badges from Tailwind violet to Radix violet`.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

> Order matters — the codebase stays green at every step. Recolor HeyTalia and
> migrate the badges FIRST (while `twpurple`/registered violet still work as
> needed), and only delete `twpurple` once nothing references it.

### Step 0: Baselines

`npx tsc --noEmit 2>&1 | grep -c "error TS"` (≈113), `bunx vitest run` (37/16),
`bun run build` (exit 0). If materially different, STOP.

### Step 1: Register the Radix `violet` scale in `@theme inline`

In `src/styles.css`, add a full `--color-violet-1..12: var(--violet-N);` block
inside `@theme inline` (place it where the `twpurple` block currently is, or
anywhere among the other scales — it will replace twpurple in step 5). Mirror the
existing `--color-twblue-*` form:

```css
  --color-violet-1: var(--violet-1);
  --color-violet-2: var(--violet-2);
  --color-violet-3: var(--violet-3);
  --color-violet-4: var(--violet-4);
  --color-violet-5: var(--violet-5);
  --color-violet-6: var(--violet-6);
  --color-violet-7: var(--violet-7);
  --color-violet-8: var(--violet-8);
  --color-violet-9: var(--violet-9);
  --color-violet-10: var(--violet-10);
  --color-violet-11: var(--violet-11);
  --color-violet-12: var(--violet-12);
```

Also add the dark-mode swap for the raw scale, immediately after
`--amber-12: var(--amber-dark-12);` (line 170) in `.dark`, so `violet` dark-swaps
like every other Radix scale:

```css
  --violet-1: var(--violet-dark-1);
  --violet-2: var(--violet-dark-2);
  --violet-3: var(--violet-dark-3);
  --violet-4: var(--violet-dark-4);
  --violet-5: var(--violet-dark-5);
  --violet-6: var(--violet-dark-6);
  --violet-7: var(--violet-dark-7);
  --violet-8: var(--violet-dark-8);
  --violet-9: var(--violet-dark-9);
  --violet-10: var(--violet-dark-10);
  --violet-11: var(--violet-dark-11);
  --violet-12: var(--violet-dark-12);
```

**Verify**: `grep -c "color-violet-12" src/styles.css` → ≥ 1; `bun run build` → exit 0.

### Step 2: Migrate the stray Tailwind-violet badges to Radix violet

- `src/components/reports/hdp-data-step.tsx`: line 47 `text-violet-600` →
  `text-violet-11`; line 48 `'bg-violet-50'` → `'bg-violet-3'`.
- `src/routes/announcements.index.tsx`: line 612 `bg-violet-50` → `bg-violet-3`,
  `text-violet-600` → `text-violet-11`, `ring-violet-200` → `ring-violet-6`.

**Verify**: `grep -rnE "violet-(50|100|200|300|600|700)" src/` → empty (no Tailwind
default violet remains); `bun run build` → exit 0.

### Step 3: Recolor HeyTalia to neutral slate + primary

Edit `src/components/heytalia/heytalia-panel.tsx` per this exact mapping. The
principle: **slate/semantic neutrals everywhere; `--primary` (blue) only on the
two primary action buttons and the user's own message bubble.**

**`HT` constants** (lines 28–35) → repoint to neutrals/primary:

```tsx
const HT = {
  primary: 'var(--primary)',       // user bubble bg — the brand accent for the user's own voice
  hover: 'var(--twblue-10)',       // (still unused; harmless)
  ultraLight: 'var(--slate-2)',    // draft title-bar bg, warning box bg
  light: 'var(--slate-3)',         // title pill bg, [For input] pill bg
  border: 'var(--slate-6)',        // draft card / warning borders (matches --border)
  text: 'var(--slate-11)',         // pill + warning text (matches --muted-foreground)
} as const
```

**Class sites**:

| Line | Replace with | Note |
|---|---|---|
| 466 | `group-active:bg-primary` | brand cue on the resize grip |
| 585 | `bg-primary text-primary-foreground` | primary action (send) |
| 740 | `bg-muted` | neutral avatar chip |
| 787 | `border-border bg-muted ... text-foreground ... hover:bg-accent` | neutral suggestion chips (drop all 4 twpurple tokens) |
| 895 | `border-border bg-white ... text-foreground hover:bg-muted` | neutral outline (secondary action) |
| 902 | `bg-primary ... text-primary-foreground` | primary action (use draft) |
| 946 | `bg-secondary text-secondary-foreground` | neutral selected state for the icon button (replaces `bg-twpurple-9 text-white`) |
| 991 | `bg-muted` | neutral typing avatar |
| 1002 | `bg-muted-foreground` | neutral typing dots |

**Info icon** (line 854, currently `style={{ color: HT.primary }}`): change to
`style={{ color: 'var(--slate-11)' }}` so the warning box is fully neutral (the
Info icon should not pull `--primary`).

After editing, the file must contain zero `twpurple`. The user message bubble
(line 763, `style={{ background: HT.primary }}`) now renders in `--primary` (blue);
this is the one spot using primary beyond the action buttons — **flag for review**:
change `HT.primary` usage at the bubble to `var(--secondary)` if a fully neutral
user bubble is preferred.

**Verify**: `grep -c "twpurple" src/components/heytalia/heytalia-panel.tsx` → `0`;
`npx tsc --noEmit 2>&1 | grep heytalia` → no new errors; `bun run build` → exit 0.

### Step 4: Visual check (browser)

`bun run dev`, open `/announcements`, launch the HeyTalia panel. Confirm:
no purple anywhere in the chrome (bubbles, chips, avatar, buttons, typing dots);
send + "Use draft" buttons are blue (`--primary`); chips/avatar/draft card are
neutral gray; the mascot logo is unchanged. Click "Create announcement" → type a
topic → confirm the generated draft card + warning box render in neutral slate.
If purple remains in the chrome, a `twpurple` site was missed — find it and fix.

### Step 5: Delete the `twpurple` scale from `src/styles.css`

Only now (nothing references it). Delete:
- `:root` twpurple block (comment + 12 lines, ~51–63).
- `.dark` twpurple block (12 lines, ~197–208).
- `@theme inline` twpurple registrations (12 lines, ~244–255).

**Verify**: `grep -rc "twpurple" src/ | grep -v ":0"` → **no output** (twpurple gone
everywhere); `bun run build` → exit 0.

### Step 6: Full verification

- `grep -rn "twpurple" src/` → empty.
- `grep -rnE "violet-(50|100|200|300|600|700)" src/` → empty.
- generated CSS contains `bg-violet-3` and NOT `twpurple`:
  `find dist .output -name "*.css" 2>/dev/null | xargs grep -l "violet-3" 2>/dev/null` → non-empty;
  `... | xargs grep -l "twpurple" 2>/dev/null` → empty.
- `npx tsc --noEmit 2>&1 | grep -c "error TS"` → ≤ 113.
- `bunx vitest run 2>&1 | grep "Tests "` → 37 passed / 16 failed (unchanged).

## Test plan

No new unit tests — visual recolor + token change. Gates: build, the twpurple/violet
greps, the generated-CSS checks, unchanged tsc/vitest baselines, and the step 4
visual confirmation.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `grep -rn "twpurple" src/` → empty
- [ ] `grep -rnE "violet-(50|100|200|300|600|700)" src/` → empty
- [ ] `grep -c "color-violet-12" src/styles.css` → 1 (Radix violet registered)
- [ ] HeyTalia SVG still contains `#9575CD` (logo untouched): `grep -c "9575CD" src/components/heytalia/heytalia-panel.tsx` → ≥ 2
- [ ] `bun run build` → exit 0; generated CSS has `violet-3`, no `twpurple`
- [ ] `npx tsc --noEmit 2>&1 | grep -c "error TS"` → ≤ 113
- [ ] `bunx vitest run` → 37 passed / 16 failed (unchanged)
- [ ] `git status` clean apart from the 4 in-scope source files + `plans/README.md`
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- `src/styles.css` / `heytalia-panel.tsx` excerpts don't match live code (drift).
  If plan 007 landed, styles.css line numbers shifted — re-match by content; only
  STOP if the *content* differs.
- `grep -rn "twpurple" src/` finds usage outside `heytalia-panel.tsx` + `styles.css`
  (the usage map was complete at `9eb7dee`; a new site means drift).
- After step 5, `bun run build` fails or any `twpurple` utility still resolves.
- `tsc` rises above 113 or vitest passing drops below 37.
- A recolor makes text unreadable (e.g. white text left on a now-neutral bg) —
  fix the foreground in the same hunk; if unsure, STOP and report with a screenshot.

## Maintenance notes

- HeyTalia now uses `--primary` (blue) only on its action buttons + the user
  bubble, and slate neutrals elsewhere. The mascot SVG keeps its `#9575CD`/`#228BE6`
  artwork — a future "fully de-purple the logo" task would edit the SVG strokes and
  `AGENTS[].color`.
- The only `violet` in the app is now the Radix scale (registered, dark-swaps),
  used by the two category badges. If those badges are later restyled, the Radix
  steps (3/6/11) are the ones to touch.
- **Coordination with plan 007**: both edit `src/styles.css`. Land 007 first; the
  drift check here re-matches by content. If executed in parallel worktrees they
  will conflict in `styles.css` — don't.
