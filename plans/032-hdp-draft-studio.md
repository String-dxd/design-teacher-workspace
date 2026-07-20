# Plan 032: Draft Studio (F4-lite) — sourced Suggest in-flow, "your addition" labels, and Review & Sync

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: plans 028–030 applied (`src/components/hdp/`,
> `hdp-store.ts` with drafts API, `StudentRiver`). 031 is NOT required. If 028–030
> absent, STOP.

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: MED (provenance rules are the product's trust story — easy to get subtly wrong)
- **Depends on**: plans/028-hdp-module-foundation.md, 029, 030
- **Category**: direction (new feature)
- **Planned at**: commit `9266c4f`, 2026-07-16

## Why this matters

Drafting is where today's time is lost: teachers reconstruct a semester from
memory in a weekend, then re-key it. F4-lite puts drafting _inside_ the workflow:
where a student has river content, generation is seeded with it and every claim
carries an inline source; where the river is empty, the teacher writes from
scratch — an honest empty state, never a fabricated comment. Two product laws are
binding and non-negotiable (from `docs/decisions/reports-hdp.md`):

- **P3 — provenance or labelled opinion**: every generated claim carries an
  inline source tracing to a real tag; teacher-added sentences are visibly
  labelled "your addition"; NO mechanism may attach a source to content that
  doesn't derive from it.
- **P4 — no draft without evidence**: zero tags ⇒ empty state + write from
  scratch/broadcast, NEVER a generated comment.

Generation in this prototype is handcrafted composition from seeded tags — it
validates the UI and the provenance mechanics, not model behaviour (PRD F4.8).

Read the **Design constraints** section of `plans/028-hdp-module-foundation.md`
first — binding here too.

## Current state

(After 028–030.)

- `src/lib/hdp-store.ts` — `loadDrafts()/saveDraft()`, `tagsForStudent`,
  `detectFormingPatterns`; `HdpDraft` has `kind: 'subject' | 'overall'`,
  `subject?`, `claims: Array<DraftClaim>`, `status: 'draft' | 'confirmed'`.
  `DraftClaim = { text, source?: { tagId, label } }` — an absent `source` IS the
  "your addition" marker; there is deliberately no way to set a source except by
  deriving from a tag.
- `src/data/hdp.ts` — seed tags with behaviour-in-context notes; 6 zero-tag 3A
  students; `SEED_REPORT_BOOKS` (3 students) and `SEED_DRAFTS` staged per 028's
  funnel staging: student A has a confirmed unsynced overall draft (Review &
  Sync starts populated), student B is already shared + acknowledged, student C
  is the fresh one the demo drafts live.
- Rich text: `src/components/comms/rich-text-editor.tsx` is the app's Tiptap
  editor (value-sync guard at lines 132–147; a "Suggest button appends text" is
  its documented external-change case). It emits HTML strings. **Decision for
  this plan: do NOT use it.** Claims must stay structured (`Array<DraftClaim>`)
  for provenance to survive editing; HTML round-tripping would flatten sources.
  The Draft Studio edits claims as a list of plain-text sentences (textarea per
  claim) — simpler, provenance-safe, and CMP-9-safe (text nodes only).
- `src/components/hdp/reports-home.tsx` — "Draft Studio" and "Review & Sync"
  ToolCards still locked; flip both here.
- Sonner toasts available globally; alert-dialog for confirms.

## Commands you will need

Same as plan 028: tsc **82**, vitest 24 known fails, build 0, targeted
prettier/eslint. NEVER `bun run check`.

## Scope

**In scope**:

- `src/lib/hdp-draft-compose.ts` + `src/lib/hdp-draft-compose.test.ts` (create — pure composition)
- `src/components/hdp/source-tag.tsx`, `claim-editor.tsx`, `draft-studio.tsx` (create)
- `src/routes/reports.drafts.index.tsx`, `src/routes/reports.drafts.$studentId.tsx` (create)
- `src/routes/reports.review.tsx` (create)
- `src/components/hdp/sync-status.tsx` (create)
- `src/lib/hdp-store.ts` + test (extend: confirm draft, book wiring)
- `src/components/hdp/reports-home.tsx` (flip 2 ToolCards)
- `plans/README.md`

**Out of scope**: legacy reports files; the real Smart Compose service (mock
composition only); reconcile gate F4b (Prototype B); release/renderings
(plan 033 consumes confirmed drafts); `rich-text-editor.tsx`.

## Git workflow

Branch `advisor/032-hdp-draft-studio` (stacked). Commit per step. No push/PR.

## Steps

### Step 1: Pure composition — `hdp-draft-compose.ts`

`composeDraft(tags: Array<HdpTag>, patterns: Array<FormingPattern>, kind, studentName): Array<DraftClaim>`:

- Returns `[]` when `tags.length === 0` (P4 — the caller renders the empty
  state; composition NEVER invents).
- Otherwise builds 2–4 claims by templating over the evidence, e.g. a tag with
  note "returned to failed problems" in context lesson →
  `{ text: '{Name} returned to failed problems during lessons.', source: { tagId, label: 'Perseverance · W3 · Mr Goh' } }`.
  Confirmed patterns produce a cross-context claim ("…across lessons and CCA").
  `kind: 'overall'` draws from all tags (multi-teacher); `kind: 'subject'` from
  the authoring teacher's tags only (pass pre-filtered tags in; the function
  stays viewer-agnostic).
- Language rules (assert in tests): output contains NO trait vocabulary from a
  small denylist (`resilient`, `gifted`, `weak`, `lazy`, `brilliant`, `natural`),
  no comparative words (`best`, `better than`, `top`), and every claim's
  `source.tagId` exists among the input tags. Behaviour-in-context phrasing
  comes from the tag notes themselves — the composer arranges; it does not
  characterise.
- Deterministic (no randomness — same inputs, same output; required for tests
  and for the repo's no-`Math.random`-in-render hydration rule).

**Verify**: `bunx vitest run src/lib/hdp-draft-compose.test.ts` → all pass.

### Step 2: `SourceTag` + `ClaimEditor`

- `source-tag.tsx` — `SourceTag({ source })`: inline chip after a claim's text:
  `text-xs font-medium text-primary bg-primary/10 rounded px-1.5 whitespace-nowrap`
  (12px — the catalog floor; the PRD's 9.5px mono is superseded by the
  decision record's typography adaptation), content = the source label. Click →
  `ui/popover.tsx` — **lineage framing** (UX grill decision, 2026-07-16): the
  popover leads with a "Based on:" heading over the original tag (StreamItem),
  and when the claim has `edited: true`, adds one quiet line
  "Sentence edited by you" (`text-xs text-muted-foreground`). The chip claims
  lineage, not verbatim fidelity. `mine` variant (`bg-muted
text-muted-foreground`, label "your addition") for sourceless claims.
- `claim-editor.tsx` — `ClaimEditor({ claims, onChange })`: an `<ol>` of claim
  rows: auto-growing `<Textarea>` (visible label "Sentence {i}", visually
  compact via `sr-only` label + numbered marker) + its `SourceTag`. Editing a
  SOURCED claim's text beyond a threshold (edit distance is overkill — rule:
  any edit) keeps the source (compression/reordering is allowed by the AI
  behaviour spec) AND sets `edited: true` on the claim (feeds the SourceTag
  popover's "Sentence edited by you" line) BUT a "Remove source" affordance is
  NOT offered; adding a NEW
  sentence (+ "Add a sentence" ghost button) creates a sourceless claim that
  renders the `mine` "your addition" variant automatically. Claims reorder via
  up/down icon-buttons (`aria-label="Move sentence {i} up"`), delete via ×
  (no confirm — creation is cheap and undo = retype; the DRAFT delete in Step 3
  is the destructive one).

**Verify**: `bunx tsc --noEmit 2>&1 | grep -c "error TS"` → 82.

### Step 3: Draft Studio route

`reports.drafts.index.tsx` (`/reports/drafts`, flag-gated): the worklist — a
real `<table>` of the form class (reuse the roster query from 030): student,
evidence count this cycle (`tabular-nums`, right-aligned), draft status
(none / draft / confirmed as a plain-text status, not colour-only), action link
"Draft" → `/reports/drafts/{id}`. Subject-teacher view: tabs per class as in
030's roster.

`reports.drafts.$studentId.tsx` (flag-gated, breadcrumbs Reports → Draft Studio
→ {name}): two-column at ≥1024px, stacked below:

- **Left — evidence**: the student's river (reuse `StudentRiver` in a compact
  embed) — the drafting teacher sees what they're drawing on.
- **Right — the draft**, with a `kind` switcher (`ui/tabs.tsx`: "Subject
  comment" / "Overall remark"; subject tab includes a subject `ui/select`
  with visible label, options from the timetable's subjects for this teacher):
  - Evidence present → primary Button "Suggest a draft" → simulate latency
    (600ms `setTimeout`), button shows pending state, then
    `composeDraft(...)` fills `ClaimEditor`; completion announced via
    `toast.success('Draft suggested from {n} observations')` (transient → live
    region; focus stays where it was). "Regenerate" (outline) re-runs over the
    current evidence after a confirm dialog IF edits exist ("Regenerating
    replaces your edited sentences. Keep editing instead?" — CMP-2-style
    consequence).
  - Evidence absent (zero tags) → `EmptyState`: title "No observations to draft
    from", description "Write from scratch below, or ask colleagues first —
    a draft is only suggested when there's evidence behind it." Actions:
    ghost "Ask colleagues" → `/reports/broadcast`. Below it, the empty
    `ClaimEditor` for writing from scratch (every sentence auto-labels
    "your addition"). The Suggest button is NOT rendered (P4) — not disabled,
    absent.
  - Autosave the working draft (debounced `saveDraft`) with a quiet
    "Saved" text indicator (`aria-live="polite"`, `tabular-nums` not needed);
    leaving mid-draft and returning restores it (CMP-8).
  - Primary action at the bottom: "Confirm draft" → confirm dialog ("Confirming
    freezes this comment and its sources for the report book. You can reopen it
    before release.") → `status: 'confirmed'`, snapshot persisted, toast, and
    the page's primary action becomes outline "Reopen draft".
- Exactly ONE filled primary button visible per state (Suggest → then Confirm;
  never both filled simultaneously — step Suggest down to outline once a draft
  exists).

Flip the "Draft Studio" ToolCard live (state: "Open — reporting window is
open").

**Verify**: `bun run build` → exit 0; browser checks in Step 5.

### Step 4: Review & Sync route

`reports.review.tsx` (`/reports/review`, flag-gated, breadcrumbs Reports →
Review & Sync):

- `sync-status.tsx` — `SyncStatus({ state })`: one line —
  `✓ Synced with School Cockpit · {x}m ago · {n} students` (check icon
  `aria-hidden`, text carries the meaning) or stale:
  `{n} changes not yet synced` + outline "Sync now" button that simulates a
  1s sync (pending → success, `toast.success('Synced {n} changes')`). Derive
  `n` = confirmed drafts not yet marked synced (store: extend with
  `markSynced(draftIds)` and a `syncedAt` on drafts). Status colours: none —
  neutral text; stale count in `text-foreground font-medium`, not red (it's
  normal state, not an error).
- Below: the confirm queue — a real `<table>` of confirmed drafts (student,
  kind, sentence count, confirmed date, "View" link to the studio). Empty →
  `EmptyState` "Nothing to review yet" / "Confirmed drafts appear here before
  they go into report books."
- A quiet footer line: "Download ingest file" ghost button → downloads the
  confirmed drafts as JSON (`URL.createObjectURL` on a Blob, filename
  `hdp-ingest-{date}.json`) — the PRD's Cockpit-format-unknown fallback,
  honestly mocked.

Flip the "Review & Sync" ToolCard: state derives live — "Locked until drafts
exist" (no drafts) → live link once `loadDrafts().length > 0`.

**Verify**: `bunx tsc --noEmit 2>&1 | grep -c "error TS"` → 82;
`bun run build` → exit 0.

### Step 5: Browser verification

1. Student WITH evidence: Suggest → claims appear, EVERY generated claim has a
   SourceTag; popover on a SourceTag shows the underlying tag; no claim exists
   whose source popover shows nothing.
2. Add a sentence → it auto-labels "your addition"; there is NO UI path to give
   it a source (try: none exists).
3. Zero-tag student: no Suggest button anywhere on the page; empty state +
   from-scratch editing works; every typed sentence labels "your addition".
4. Confirm → reopen → sources intact; autosave survives navigating away
   mid-edit and returning.
5. Overall vs subject kinds draw from the right tag sets (overall includes
   colleagues' tags; subject only the current teacher's).
6. `/reports/review`: confirm queue lists confirmed drafts; Sync flow works;
   ingest file downloads with the right shape.
7. Keyboard-only pass over the studio: every control reachable, one primary
   per state, focus visible throughout.
8. 320px: columns stack; no horizontal scroll.

## Test plan

`src/lib/hdp-draft-compose.test.ts` (pure):

1. Zero tags → `[]` (P4 at the composition layer).
2. Every returned claim's `source.tagId` ∈ input tag ids (P3: no invented
   sources).
3. Denylist: output text contains no trait/comparative vocabulary.
4. `kind: 'overall'` over multi-author input uses ≥2 authors' tags when
   available; deterministic across two runs.

Extend `hdp-store.test.ts`: confirm/reopen transitions; `markSynced` sets
`syncedAt`; unsynced count derivation.

`bunx vitest run` → all new pass; 24 known fails unchanged.

## Done criteria

- [ ] tsc 82 / vitest 24-known-fails / build 0
- [ ] `grep -rn "dangerouslySetInnerHTML" src/components/hdp/ src/routes/reports.drafts* src/routes/reports.review.tsx` → no matches
- [ ] `grep -rn "RichTextEditor\|@tiptap" src/components/hdp/ src/routes/reports.drafts*` → no matches (structured claims, not HTML)
- [ ] Composition tests prove P3/P4 mechanically (source ids ∈ inputs; zero → zero)
- [ ] Browser checks 1–8 hold
- [ ] `plans/README.md` status row updated

## STOP conditions

- 028–030 missing/failing.
- The provenance model can't survive an edit flow you're building (e.g. you
  find yourself wanting to let users attach sources manually) — that is a
  product-law violation; report, don't build it.
- The claim-list editor proves unusable at 320px within the ui/ primitives —
  report with a screenshot rather than hand-rolling a new input primitive.

## Maintenance notes

- The real Smart Compose integration (PRD open question Q10) replaces
  `composeDraft` behind the same signature — keep the function pure and the
  signature stable.
- F4b (reconcile gate) and the insight layer are Prototype B: they slot in
  between evidence and composition; the claims/SourceTag mechanics here are
  what they build on.
- The denylist is a tripwire, not the eval set — the PRD's eval-set requirement
  stands before any real model ships.
- Reviewer scrutiny: P3/P4 mechanics (try to defeat them in the UI), the
  one-primary-per-state rule, and draft autosave integrity.
