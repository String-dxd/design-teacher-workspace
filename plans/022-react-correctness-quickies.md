# Plan 022: React correctness quickies — stable keys, keyboard-accessible dropzone, consolidated column-flag sync

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**:
> `git diff --stat b01d78d..HEAD -- src/routes/announcements.new.tsx 'src/routes/announcements.$id.tsx' src/routes/students.index.tsx src/types/pg-announcement.ts`
> Plans 018/019 touch `announcements.new.tsx` first — expect their hunks.
> Compare excerpts below against live code; if an excerpt's code is gone
> (not just line-shifted), STOP.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED (step 3 touches user-visible column behavior)
- **Depends on**: 018 (same files; land 018 first, rebase)
- **Category**: bug
- **Planned at**: commit `b01d78d`, 2026-07-02

## Why this matters

Three real-behavior bugs in the app's main authoring flows: (1) editable lists
keyed by array index make React reattach input focus/caret/DOM state to the
wrong row when an item is removed mid-list; (2) the announcement file dropzone
is click-only — keyboard and screen-reader users cannot attach files at all;
(3) the `/students` column list is patched by five near-identical `useEffect`s
that insert flag-gated columns at indexes computed from possibly-stale
neighbors, so toggling flags after the user edits columns can misplace or
duplicate columns — and every new flag-gated column means a sixth copy-pasted
effect.

## Current state

**1. Index keys on editable lists** — `src/routes/announcements.new.tsx`:

- `:2131` — `websiteLinks.map((link, i) => … <div key={i} …>` containing two
  `<Input>`s (url, label) and a remove button calling `removeWebsiteLink(i)`.
  State shape (`:992`): `useState<Array<PGWebsiteLink>>([])` where
  `PGWebsiteLink` is `{ label: string; url: string }`
  (`src/types/pg-announcement.ts:25-28`). Rows are created by
  `addWebsiteLink()` (`:1346`): `setWebsiteLinks((prev) => [...prev, { url: '', label: '' }])`.
- `:2196` — `uploadedFiles.map((file, i) => <div key={i} …>` with a remove
  button (`removeFile(i)`).
- `:2311` / `:2402` — photo grids keyed by index with mid-list removal.
- `src/routes/announcements.$id.tsx:685` — same pattern (check whether the
  list there is editable; if read-only, leave it).

(Read-only `key={i}` lists elsewhere — e.g. static preview stubs at `:513`,
`:529` — are fine; don't churn them.)

**2. Mouse-only dropzone** — `src/routes/announcements.new.tsx:2254-2290`:

```tsx
<div
  onClick={() => fileInputRef.current?.click()}
  onDragOver={…} onDragLeave={…} onDrop={…}
  className={cn('flex cursor-pointer flex-col items-center …')}
>
  <Paperclip … /><p …>Drop files here or click to browse</p>
</div>
<input ref={fileInputRef} type="file" multiple accept="…" className="hidden" />
```

No `role`, no `tabIndex`, no key handler, no label associated with the input.

**3. Five column-sync effects** — `src/routes/students.index.tsx`:

- `:118` — `const [columns, setColumns] = useState<Array<ColumnConfig>>(() => {…})`
  derives the initial list from feature flags.
- `:185, :206, :230, :252, :278` — five `useEffect`s, one per feature flag,
  each `setColumns((prev) => …)` inserting its columns at an anchor found via
  `prev.findIndex((c) => c.id === 'fas')`-style lookups (e.g. the MSF effect
  inserts `supportedByComLink`/`supportedByFsc`/`parentsConsideringDivorce`/
  `nonIntactFamily` before `'fas'`), or filtering them out when the flag turns
  off.
- Columns are ALSO user-mutable: `:526` `onColumnsChange={setColumns}` (column
  manager), `:532` appends an imported column, `:566` removes by id. So the
  visible list CANNOT be a pure derivation — user edits are state. The fix is
  to consolidate the five effects into ONE table-driven effect, not to derive.

## Commands you will need

| Purpose   | Command             | Expected on success                                                                    |
| --------- | ------------------- | -------------------------------------------------------------------------------------- |
| Typecheck | `bunx tsc --noEmit` | ≤41 pre-existing errors (23×TS2322, 9×TS2345, 3×TS2353, 6 singles); no new codes/files |
| Tests     | `bunx vitest run`   | 37 pass / 16 fail (pre-existing); no new failures                                      |
| Build     | `bun run build`     | exit 0                                                                                 |
| Dev       | `bun run dev`       | port 3000                                                                              |

## Scope

**In scope**:

- `src/routes/announcements.new.tsx` (keys + dropzone only)
- `src/routes/announcements.$id.tsx` (one key fix, if its list is editable)
- `src/routes/students.index.tsx` (column effects only)
- `src/types/pg-announcement.ts` (ONLY if you choose to add an optional
  client-side id to `PGWebsiteLink`; prefer the local-wrapper approach below
  that avoids touching the shared type)
- `src/lib/` — a new small test file for step 3's spec table if extracted
- `plans/README.md` (status row)

**Out of scope**:

- The autosave/draft logic in `announcements.new.tsx` (`loadDraft`/`saveDraft`
  interplay) beyond what key changes strictly require.
- The god-component decomposition (plan 023) — resist refactoring while here.
- `defaultColumns` definitions and the column-manager UI.

## Git workflow

- Branch: `advisor/022-react-quickies`
- One commit per step, conventional style: `fix(a11y): keyboard-accessible file dropzone` etc.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Stable keys

- **websiteLinks**: keep the shared `PGWebsiteLink` type clean by keying on a
  locally-generated id. Change the state to
  `Array<PGWebsiteLink & { _key: string }>` (a type alias local to the file),
  generate `_key: crypto.randomUUID()` in `addWebsiteLink()`, key the row
  `key={link._key}`, and strip `_key` wherever the array leaves the component
  (draft save, submit payload, preview props — grep `websiteLinks` in the file
  for every consumer, `:194`/`:216`/`:480+` take it as a prop). If stripping
  at the boundaries turns out to touch more than ~3 call sites, the fallback
  is adding `_key?: string` to `PGWebsiteLink` itself — acceptable, note it.
- **uploadedFiles / photos**: key by content identity instead of index —
  `key={`${file.name}-${file.size}`}` if entries are `File`s (or by an id if
  the entries are richer objects — read the state shape first). If duplicates
  of the same file are allowed, fall back to the `_key`-wrapper approach.
- **announcements.$id.tsx:685**: apply the same treatment ONLY if rows are
  editable/removable; if the list is render-only, leave it and say so.

**Verify**: dev server → `/announcements/new`: add 3 website links, type
distinct URLs, focus the middle row's url field, delete the FIRST row → the
text you typed stays with its row and focus does not jump to a different
row's content. Same spot-check for files/photos (add 3, remove the first,
names stay correct). `bunx tsc --noEmit` → no new errors.

### Step 2: Keyboard-accessible dropzone

Convert the dropzone `<div>` to `<button type="button">` (keeps all drag
handlers; buttons fire `onClick` for Enter/Space natively). Keep the exact
className (add `w-full` if the button collapses). Add
`aria-label="Add attachments"` and connect the hidden input:
`<input … aria-hidden="true" tabIndex={-1}>`. `type="button"` is mandatory —
the page may wrap this in a form and a bare `<button>` would submit it.

**Verify**: dev server → `/announcements/new`: Tab reaches the dropzone,
Enter opens the file chooser, drag-drop still highlights and accepts files.
`bunx tsc --noEmit` → no new errors.

### Step 3: One table-driven column-sync effect

> **Reviewer amendment (2026-07-03, after executor STOP)**: the original
> template below was wrong in two ways the executor caught. (1) Anchor
> direction varies: MSF inserts BEFORE `'fas'`; attentionTags, socialLinks,
> and overallPercentage insert AFTER their anchors (`+1`). Add a
> `position: 'before' | 'after'` field to the spec
> (`insertAt = at >= 0 ? (position === 'after' ? at + 1 : at) : next.length`).
> (2) The fifth effect (imported columns, keyed on `importDataEnabled`) does
> NOT fit the table — dynamic ids from `getImportedColumns()`, columns
> constructed fresh (not from `defaultColumns`), unconditional append,
> removal by the `imported` flag. LEAVE that effect as-is, separate.
> Consolidate only the FOUR flag effects, spec order matching today's effect
> order (msf, attentionTags, socialLinks, overallPercentage) so
> overallPercentage's `'socialLinks'` anchor exists when its spec applies.
> The done criterion becomes: exactly TWO column-sync effects — the
> consolidated flag effect + the untouched imported-columns effect.

In `students.index.tsx`, replace the five effects (`:185–:308`) with a single
spec + effect:

```tsx
const FLAG_COLUMN_SPECS: Array<{
  enabled: boolean
  ids: Array<string>
  anchorId: string
}> = [
  { enabled: msfUpliftEnabled, ids: MSF_IDS, anchorId: 'fas' },
  // …one row per current effect, copying each effect's exact ids + anchor…
]

useEffect(
  () => {
    setColumns((prev) => {
      let next = prev
      for (const spec of FLAG_COLUMN_SPECS) {
        const has = next.some((c) => spec.ids.includes(c.id))
        if (spec.enabled && !has) {
          const cols = defaultColumns.filter((c) => spec.ids.includes(c.id))
          const at = next.findIndex((c) => c.id === spec.anchorId)
          const insertAt = at >= 0 ? at : next.length
          next = [...next.slice(0, insertAt), ...cols, ...next.slice(insertAt)]
        } else if (!spec.enabled && has) {
          next = next.filter((c) => !spec.ids.includes(c.id))
        }
      }
      return next === prev ? prev : next
    })
  },
  [
    /* every flag referenced in FLAG_COLUMN_SPECS */
  ],
)
```

Transcribe each existing effect's ids/anchor EXACTLY (open each of the five
and copy its `_IDS` array and `findIndex` anchor; they are not all `'fas'`).
Behavior must be identical for the flag-toggle paths; the win is one
implementation, one dependency list, and anchors resolved at apply time.
Extract the pure insert/remove logic into a small exported helper if that
makes it testable (e.g. `applyFlagColumns(prev, specs, defaultColumns)` in the
same file or `src/lib/`).

**Verify**: dev server → `/flags`: toggle each column-affecting flag on and
off while watching `/students` — columns appear at the same positions as
before and disappear cleanly; then hide a column via the column manager,
toggle a flag, and confirm the hidden column stays hidden and nothing
duplicates. `bunx tsc --noEmit` → no new errors.

## Test plan

- If you extracted `applyFlagColumns` (recommended), add
  `src/lib/apply-flag-columns.test.ts` (model on the existing `src/lib`
  vitest files): inserts at anchor; appends when anchor missing; removes when
  flag off; no-ops (returns same reference) when nothing changes; two specs
  applied in one pass.
- Steps 1–2 are verified interactively (no component-test harness exists in
  this repo; do not introduce one for this plan).
- `bunx vitest run` → 37 + new tests pass / 16 pre-existing failures unchanged.

## Done criteria

- [ ] `grep -n 'key={i}' src/routes/announcements.new.tsx` → only read-only
      preview lists remain (document which in your report)
- [ ] Dropzone reachable and operable by keyboard (step 2 check)
- [ ] `src/routes/students.index.tsx` contains exactly TWO column-sync
      `useEffect`s — the consolidated four-flag effect and the untouched
      imported-columns effect (grep `setColumns` → initializer, those two
      effects, and the user-edit call sites at ~`:526/:532/:566` only)
      _(amended 2026-07-03 — see step 3 note)_
- [ ] `bunx tsc --noEmit` ≤41 pre-existing; `bunx vitest run` no new
      failures + new tests pass; `bun run build` exit 0
- [ ] No files outside the in-scope list modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- Stripping `_key` at the websiteLinks boundaries touches draft-storage
  serialization in a way that breaks restoring EXISTING saved drafts
  (backwards compatibility with already-stored drafts is required).
- The five effects turn out to have per-effect behavior that doesn't fit the
  spec table (e.g. one effect also reorders or renames) — transcribe nothing,
  report the difference.
- Toggling flags after user column-edits misbehaves in a way the old code
  ALSO misbehaves — don't fix beyond parity; note it for plan 023.
- Any change requires touching the column-manager component or
  `defaultColumns`.

## Maintenance notes

- New flag-gated columns should be one line in `FLAG_COLUMN_SPECS`, not a new
  effect — reviewers should reject new `setColumns` effects.
- The deeper fix (modeling user column-edits as overrides and deriving the
  visible list) is deliberately deferred to plan 023's decomposition work.
- Reviewers: scrutinize the `_key` stripping at draft-save/submit boundaries —
  leaking `_key` into stored drafts is harmless but noisy; failing to restore
  old drafts is a regression.
