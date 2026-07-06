# Plan 002: Fix Radix-style `asChild` / unsupported props on Base UI triggers

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 9f03003..HEAD -- src/components/forms/form-response-table.tsx src/components/comms/recipient-read-table.tsx src/components/students/column-header-menu.tsx src/components/students/import-wizard.tsx "src/routes/groups.\$groupId.tsx" src/routes/forms.index.tsx src/routes/announcements.index.tsx src/routes/groups.index.tsx "src/routes/students_.\$id.agency-report.new.tsx"`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none (001 recommended first so CI exists, but not required)
- **Category**: bug
- **Planned at**: commit `9f03003`, 2026-06-10

## Why this matters

This codebase uses Shadcn UI components built on **Base UI** primitives
(`@base-ui/react`), not Radix. Base UI triggers do not support Radix's
`asChild` prop — they use a `render={...}` prop instead. Thirteen call sites
pass `asChild` anyway. TypeScript flags every one (they account for ~15 of the
repo's 139 tsc errors), and at runtime the prop is silently dropped: the
trigger renders its own `<button>` element **wrapping** the `<Button>` child,
producing nested `<button><button>` markup — invalid HTML that breaks
keyboard/screen-reader semantics and doubles up focus targets. Two further
sites pass `nativeButton={false}` to `TooltipTrigger`, which (unlike
`PopoverTrigger`) does not accept that prop. Fixing these removes a cluster of
real DOM bugs and ~15 tsc errors, moving the typecheck gate closer to
blocking.

## Current state

The repo already contains the correct pattern. Exemplar —
`src/components/comms/announcement-filter-bar.tsx:97-113`:

```tsx
<PopoverTrigger
  render={
    <Button
      variant="outline"
      className="h-9 gap-2 aria-expanded:bg-white"
    />
  }
>
  <Filter className="h-4 w-4" />
  Filter
  ...
</PopoverTrigger>
```

Key facts about the pattern:

- The custom element goes in `render={<Button ... />}` **as a self-closing
  element carrying the props** (variant, className, onClick, etc.).
- The visible content stays as the **children of the trigger**, not of the
  Button inside `render`.
- Base UI merges the trigger's behavior/ARIA props onto the rendered element.

The broken sites — all currently shaped like
`<SomeTrigger asChild><Button ...>content</Button></SomeTrigger>`:

| # | File:line | Trigger |
|---|-----------|---------|
| 1 | `src/components/forms/form-response-table.tsx:224` | PopoverTrigger |
| 2 | `src/components/forms/form-response-table.tsx:364` | PopoverTrigger |
| 3 | `src/components/comms/recipient-read-table.tsx:295` | PopoverTrigger |
| 4 | `src/components/comms/recipient-read-table.tsx:429` | PopoverTrigger |
| 5 | `src/components/students/column-header-menu.tsx:267` | PopoverTrigger |
| 6 | `src/components/students/import-wizard.tsx:932` | TooltipTrigger |
| 7 | `src/routes/groups.$groupId.tsx:509` | DropdownMenuTrigger |
| 8 | `src/routes/forms.index.tsx:208` | DropdownMenuTrigger |
| 9 | `src/routes/announcements.index.tsx:460` | DropdownMenuTrigger |
| 10 | `src/routes/announcements.index.tsx:680` | DropdownMenuTrigger |
| 11 | `src/routes/groups.index.tsx:643` | DropdownMenuTrigger |
| 12 | `src/routes/groups.index.tsx:712` | DropdownMenuTrigger |
| 13 | `src/routes/students_.$id.agency-report.new.tsx:755` | PopoverTrigger |

(Line numbers are as of commit `9f03003`; locate by searching each file for
`asChild` if they have drifted slightly — `grep -n "asChild" <file>`.)

And the two `nativeButton` sites —
`src/routes/students_.$id.agency-report.new.tsx:271` and `:288`, shaped like:

```tsx
<TooltipTrigger
  nativeButton={false}
  render={
    <span className="flex h-6 w-6 items-center justify-center rounded-full ..." />
  }
>
  +{overflow}
</TooltipTrigger>
```

Verified against `node_modules/@base-ui/react/esm/tooltip/trigger/TooltipTrigger.d.ts`:
`Tooltip.Trigger` props are `handle`, `payload`, `delay`, `closeDelay`, etc. —
there is **no `nativeButton`**. (`Popover.Trigger` *does* accept
`nativeButton`; do not "fix" popover sites that use it legitimately, e.g.
`src/components/ui/pagination.tsx:56`.)

**Do NOT touch** the `asChild` usages in `src/routes/ds.flow-components.tsx`
(lines ~604–931) — those use `@flow/core` components, which are a different
library that supports `asChild`. They produce no tsc errors.

## Commands you will need

| Purpose   | Command                              | Expected on success |
|-----------|--------------------------------------|---------------------|
| Install   | `bun install`                        | exit 0 |
| Typecheck | `npx tsc --noEmit 2>&1 \| grep -c "error TS"` | baseline 139; ≤ 124 after this plan |
| Dev server (manual spot check) | `bun run dev` | serves on http://127.0.0.1:3000 |
| Build     | `bun run build`                      | exit 0 |

## Scope

**In scope** (the only files you should modify):

- The 9 files listed in the two tables above.

**Out of scope** (do NOT touch, even though they look related):

- `src/routes/ds.flow-components.tsx` — `@flow/core` components; `asChild` is
  valid there.
- `src/components/ui/*.tsx` — do not widen the wrapper prop types to "accept"
  `asChild`; the fix is at the call sites.
- `src/components/ui/pagination.tsx` — its `nativeButton={false}` is on a
  Base UI primitive that supports it.
- Any other tsc error in these files (e.g. unused variables in
  `agency-report.new.tsx`) — other plans/follow-ups own those.

## Git workflow

- Branch: `advisor/002-base-ui-trigger-props`
- One commit, conventional style, e.g.
  `fix(ui): replace Radix asChild with Base UI render prop on triggers`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Record the baseline error count

Run `npx tsc --noEmit 2>&1 | grep -c "error TS"` and note the number
(expected 139 if no drift).

**Verify**: command outputs a number.

### Step 2: Convert the 13 `asChild` sites to the `render` pattern

For each site in the first table, transform:

```tsx
<PopoverTrigger asChild>
  <Button variant="outline" size="sm" className={cn('gap-1.5', ...)}>
    <Filter className="h-4 w-4" />
    Filter
  </Button>
</PopoverTrigger>
```

into:

```tsx
<PopoverTrigger
  render={
    <Button variant="outline" size="sm" className={cn('gap-1.5', ...)} />
  }
>
  <Filter className="h-4 w-4" />
  Filter
</PopoverTrigger>
```

Mechanics: move ALL props from the inner `<Button>` onto the self-closing
element inside `render={...}`; move the Button's children up to be the
trigger's children; delete `asChild`. Same transformation for
`DropdownMenuTrigger` and `TooltipTrigger` sites. If an inner element is not
a `Button` (check each site), keep whatever element it is — only the prop
placement changes.

**Verify**: `grep -rn "asChild" src/components src/routes --include="*.tsx" | grep -v "ds.flow-components"`
→ no output.

### Step 3: Remove `nativeButton` from the two TooltipTrigger sites

In `src/routes/students_.$id.agency-report.new.tsx:271` and `:288`, delete the
`nativeButton={false}` line. Keep the `render={<span .../>}` prop and children
exactly as they are.

**Verify**: `grep -n "nativeButton" "src/routes/students_.\$id.agency-report.new.tsx"` → no output.

### Step 4: Confirm the error count dropped and nothing else broke

**Verify**:
- `npx tsc --noEmit 2>&1 | grep -c "error TS"` → at most (baseline − 15).
- `npx tsc --noEmit 2>&1 | grep -i "aschild\|nativeButton"` → no output.
- `bun run build` → exit 0.

### Step 5: Manual spot check (recommended)

Run `bun run dev`, open http://127.0.0.1:3000, and check three of the touched
surfaces render and open correctly:

1. `/forms` → the list's row "⋯" dropdown opens (forms.index.tsx site).
2. `/announcements` → filter/dropdown menus open (announcements.index.tsx sites).
3. A form detail page → the response table's "Filter" popover opens
   (form-response-table.tsx sites).

In the browser inspector, confirm a trigger renders a **single** `<button>`
(no nested button).

## Test plan

No new unit tests — these are JSX prop corrections verified by the compiler.
If plan 001 has landed, run `bun run test` → existing tests still pass.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `grep -rn "asChild" src/ --include="*.tsx" | grep -v ds.flow-components` → empty
- [ ] `grep -rn "nativeButton" src/routes/` → empty
- [ ] `npx tsc --noEmit` error count ≤ baseline − 15
- [ ] `bun run build` exits 0
- [ ] `git status` shows changes only in the 9 in-scope files
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- A site's inner element has an `onClick`/`ref` whose behavior you cannot
  confidently preserve through the `render` move (e.g. the click handler
  is on the Button AND the trigger has its own handler).
- After conversion, a popover/dropdown/tooltip no longer opens in the dev
  server spot check.
- The tsc error count drops by fewer than 12 (some sites were masking other
  errors — report rather than chase them).
- `render` on a converted trigger produces a NEW tsc error (the wrapper type
  may differ from the exemplar's — report which trigger).

## Maintenance notes

- Convention to enforce in review from now on: **Base UI triggers take
  `render={<El ... />}`, never `asChild`**. New contributors copying Radix
  snippets will reintroduce this; the typecheck CI gate (plan 001) is the
  backstop once flipped to blocking.
- The `ds.flow-components.tsx` demo page legitimately mixes the other
  convention (`@flow/core`); a comment at the top of that file noting the
  difference would prevent confusion, but it is out of scope here.
