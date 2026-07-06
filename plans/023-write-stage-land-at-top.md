# Plan 023: Write stage lands at the top, not scrolled into the comments editor

> **Executor instructions**: Follow step by step; run every verification command and confirm the expected result before moving on. On any STOP condition, stop and report — do not improvise. Update this plan's row in `plans/README.md` when done unless a reviewer says they maintain it.
>
> **Drift check (run first)**: `git diff --stat 85dd742..HEAD -- src/routes/reports.cycle.write.$studentId.tsx src/components/comms/rich-text-editor.tsx`
> On any change since this plan was written, compare the excerpts below to live code; on mismatch, STOP.

## Status

- **Priority**: P1 (highest-frequency surface in the flow)
- **Effort**: S
- **Risk**: MED (touches the shared RichTextEditor if the prop route is taken — additive/optional)
- **Depends on**: none
- **Category**: bug (flow / A11Y-11 focus management)
- **Planned at**: commit `85dd742`, 2026-07-06
- **Serves**: critique suggestion #1; layout-patterns.md #2 (context-then-decision); catalog A11Y-11 (focus management at flow scope)

## Why this matters

The Write stage (`/reports/cycle/write/$studentId`) is where a teacher writes each student's report — the most-repeated screen in the flow (once per student, ~30×). On load, the comments rich-text editor takes focus and the browser scrolls the document so the editor is in view. Verified in-browser at commit `85dd742`: on a clean load with no interaction, `document.activeElement.isContentEditable === true` and the page `<h1>` (the student's name) sits **361px above the top of the viewport**. So the teacher arrives *without seeing which student they're on* or the "Term at a glance" context — every time. This is a flow-context failure (you decide before you have context) and a focus-management smell (A11Y-11: focus should land somewhere sensible after a step change — the revealed surface's heading, not a mid-page field).

## Current state

`src/routes/reports.cycle.write.$studentId.tsx` — the write body is `function CycleWriteBody({ studentId })`, mounted per student via `<CycleWriteBody key={studentId} …/>` (a full remount on student change). Its header renders the student name:
```tsx
<div className="flex-1">
  <h1 className="text-lg font-semibold">{student.name}</h1>
  <p className="text-muted-foreground text-sm">{student.class} · {term}</p>
</div>
```
The comments editor is `<RichTextEditor value={comments} onChange={setComments} toolbar="simple" … />` further down the document (rendered inside `ReportPreview`).

`src/components/comms/rich-text-editor.tsx` — Tiptap v3 (`@tiptap/react` ^3.20). The `useEditor({ … })` call (around line 95) sets `immediatelyRender: false`, extensions, `content`, `onUpdate`, `onBlur`, `editorProps` — but **no `autofocus` option** (Tiptap's documented default is `autofocus: false`). Despite that, the editor is observed to take focus on mount in the write stage (see Why). The editable is `<EditorContent editor={editor} style={{ minHeight }} />` (around line 510).

**Conventions**: hooks already imported (`useEffect`, `useRef`, `useState`, `useMemo`) at the top of both files. Two-space indent. `bun run check` is repo-wide-destructive — do NOT run it; use the targeted commands below.

## Commands you will need

| Purpose | Command | Expected |
|---|---|---|
| Typecheck | `bunx tsc --noEmit` | no error whose path contains `reports.cycle.write` or `rich-text-editor`; total ≤ baseline 107 |
| Tests | `bun run test` | `Tests  75 passed (75)` |
| Format (targeted) | `bunx prettier --check <edited files>` | clean |
| Lint (targeted) | `bunx eslint <edited files>` | exit 0 |
| Browser verify | see Step 3 | `h1` visible on load; editor not auto-focused |

> ⚠️ Do NOT run `bun run check`, `bun install`, `git checkout`, `git restore`, or `rm`.

## Scope

**In scope** (pick the minimal set the fix needs):
- `src/routes/reports.cycle.write.$studentId.tsx`
- `src/components/comms/rich-text-editor.tsx` — ONLY if you add an optional `autoFocus?: boolean` prop (see Step 1); the change must be additive and default to today's behavior for all other call sites.

**Out of scope**: any other RichTextEditor call site (announcements, forms) — the prop must default to unchanged behavior so they are unaffected. `plans/*`.

## Steps

### Step 1: Stop the editor grabbing focus on mount (primary approach)

Add an optional prop to `RichTextEditor`: `autoFocus?: boolean` (default `undefined`). Pass it into the `useEditor` options as `autofocus: autoFocus ?? false` — i.e. when unset, Tiptap's default (`false`) still applies, so **no existing caller changes behavior**. Then in the write stage, pass `autoFocus={false}` to the comments `RichTextEditor`.

**Verify (Step 3 browser check).** If, after this, the browser check still shows the editor focused / `h1` scrolled out of view, the focus source is NOT Tiptap's `autofocus` — **STOP and report** (do not keep guessing); the reviewer will fold in the fallback (Step 2).

### Step 2: Fallback — land focus on the student heading (only if Step 1's browser check still fails)

If and only if Step 1 did not land the page at the top: give the header `<h1>` a ref and `tabIndex={-1}`, and add a mount effect in `CycleWriteBody` that focuses it:
```tsx
const headingRef = useRef<HTMLHeadingElement>(null)
useEffect(() => {
  headingRef.current?.focus()
}, [])
// on the h1: ref={headingRef} tabIndex={-1} className="… outline-none"
```
Because the body remounts per student (`key={studentId}`), this fires once per student and lands focus on the name. This doubles as the deferred A11Y-11 focus-on-student-change. If the editor still steals focus after this (a timing race), STOP and report.

### Step 3: Browser verification (required)

Start the dev server (`bun run dev`; note the port). Enable `hdp-reports` at `/flags`, open `/reports` for `P1-A`, "Set up layout" → Save & continue, then open `/reports/cycle/write/<a studentId>`. With no interaction, evaluate:
- the student-name `<h1>`'s `getBoundingClientRect().top` is **≥ 0** (visible in the viewport), and
- `document.activeElement.isContentEditable` is **false** (or the active element is the `<h1>`, not the editor).

Record the two values in your report.

### Step 4: Confirm scope + gates

`git diff --name-only` → only the in-scope file(s); targeted prettier `--check` clean; targeted eslint exit 0; `bun run test` → 75.

## Test plan

No unit test (mount focus/scroll is not covered by the logic-only vitest suite; do NOT add a framework). Verification is the browser check in Step 3 plus the gates. If you added the `autoFocus` prop, confirm by grep that no OTHER call site passes it (so their behavior is unchanged): `grep -rn "RichTextEditor" src | grep -v "autoFocus"` should still list every other usage.

## Done criteria

- [ ] Browser check: write-stage `<h1>` `top ≥ 0` on load; editor not auto-focused
- [ ] `bunx tsc --noEmit` → no error in edited files; total ≤ 107
- [ ] `bun run test` → 75 passed
- [ ] targeted prettier `--check` clean; targeted eslint exit 0
- [ ] `git diff --name-only` → only the in-scope file(s); no other RichTextEditor caller's props changed

## STOP conditions

- Step 1's `autofocus: false` does not fix the landing (focus source is elsewhere) → STOP, report the browser-check values, do not keep patching.
- Adding the prop changes any other RichTextEditor caller's behavior → STOP.
- A file outside scope shows changed, or `bun run test` drops below 75 → STOP, do not revert, report.

## Maintenance notes

- If a future RichTextEditor caller *wants* autofocus, it now opts in via `autoFocus`.
- Reviewer should confirm the two browser-check numbers and that no other editor surface (e.g. announcements) regressed to no-focus if it previously relied on focus.
