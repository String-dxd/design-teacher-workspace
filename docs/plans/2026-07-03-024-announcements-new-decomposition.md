---
plan_id: 2026-07-03-024-announcements-new-decomposition
title: 'design: decomposition plan for the two god routes (announcements.new.tsx + agency-report.new.tsx)'
status: proposed
created: 2026-07-03
plan_depth: Structural
type: design
---

# Design: decomposing `announcements.new.tsx` and `students_.$id.agency-report.new.tsx`

## Summary

This is the design deliverable of spike plan 023. It does not change any
product code. It inventories every `useState` in the two heaviest authoring
routes, proposes a target component/hook tree for each, and lays out
mechanically-executable migration slices for a follow-up executor plan.
The companion deliverable — characterization tests for draft save/restore —
lives in `src/lib/draft-storage.test.ts`.

**Headline finding**: the two files are not equally risky. `announcements.new.tsx`
is genuinely one 1,800-line component (`NewAnnouncementPage`) holding 39
`useState` calls with a 27-dependency autosave effect — this is the real
god component and the priority target. `students_.$id.agency-report.new.tsx`
is 3,749 lines but already split into ~30 top-level functions; its 35
`useState` calls are spread across ~9 components, and the worst single
offender (`ReportForm`, ~600 lines) holds 16 of them. See the go/no-go
recommendation at the end — this route is a much weaker case for
whole-file decomposition right now.

## Current state

Measured at this worktree's commit `b01d78d`, with branches 018/019/022 pending merge.

| File                                             | Lines | `useState` (grep count incl. import) | Distinct state variables                                                | Top-level functions                                  |
| ------------------------------------------------ | ----- | ------------------------------------ | ----------------------------------------------------------------------- | ---------------------------------------------------- |
| `src/routes/announcements.new.tsx`               | 2,758 | 41                                   | 39 (across 2 components: `NewAnnouncementPage` + `AnnouncementPreview`) | 9 (mostly tiny; one is the 1,800-line god component) |
| `src/routes/students_.$id.agency-report.new.tsx` | 3,749 | 35                                   | 34 (across 9 components)                                                | ~30                                                  |

Verified via `wc -l` and `grep -c 'useState' <file>` in this worktree; both
match the plan's stated 41/35.

## Known pre-existing bugs factored into this design

Not re-derived here, per the worktree brief.

1. **`announcements.new.tsx:1556`** — the submit handler hardcodes
   `websiteLinks: []` in the new `PGAnnouncement` payload instead of using
   the `websiteLinks` state. This is exactly the kind of bug a flat 39-`useState`
   component produces: the field exists, is autosaved, is restored from
   drafts, is rendered in the editor and the preview — but one of the ~6
   places that has to remember to read it forgot to. Section 4 below treats
   "the fields that go into `PGAnnouncement`" and "the fields that go into
   `DraftData`" as two projections of one `useAnnouncementDraft` state
   object specifically so this class of bug becomes structurally
   impossible (the submit payload would spread the same state slice the
   autosave effect reads).
2. **The photo dropzone (~announcements.new.tsx:2460)** is mouse-only
   (`onDragOver`/`onDrop`/`onClick` on a `<div>`, no keyboard path). The
   file dropzone was already converted to a `<button type="button">` on
   branch 022; the photo dropzone was not. Migration slice 3 (below)
   should apply the same fix while it's already touching that block —
   noted as an opportunistic fix, not a target of this spike.
3. **`students.index.tsx` initializer/effect discrepancy** — the initial
   column list is built with `overallPercentage` placed by the
   `overallPercentageEnabled` branch at ~line 146-148, while the toggle
   effect that reacts to the flag (~line 253-272) inserts the column
   relative to `socialIndex` (the `socialLinks` column's position) rather
   than the same anchor the initializer uses. When `socialLinks` is off,
   the column ends up in a different position depending on whether the
   flag flipped on load vs. after mount. This is a different file (not one
   of the two god routes) but it's the concrete evidence for why the
   agency-report section below recommends a **table-driven / derived
   column model** instead of one effect per toggle whenever this pattern
   next needs to change — plan 022 already deferred a "derived columns"
   idea for exactly this reason.

## Part A — `src/routes/announcements.new.tsx`

### A.1 State inventory

`NewAnnouncementPage` (line 954-2758, the actual god component):

| State                                                           | Type                     | Read by (UI section)                                                                | Written by                                             | Cluster             | Derived?                                                                                 |
| --------------------------------------------------------------- | ------------------------ | ----------------------------------------------------------------------------------- | ------------------------------------------------------ | ------------------- | ---------------------------------------------------------------------------------------- |
| `title`                                                         | `string`                 | Zone A title input, preview, validation, submit payload                             | title `<input>` onChange                               | **content**         | no                                                                                       |
| `description`                                                   | `string` (HTML)          | Zone A Tiptap editor, preview, validation (`isDescriptionEmpty`), submit            | RichTextEditor onChange                                | **content**         | no                                                                                       |
| `shortcuts`                                                     | `Array<Shortcut>`        | Zone B shortcuts list, preview                                                      | shortcut add/remove/edit handlers                      | **content**         | no                                                                                       |
| `websiteLinks`                                                  | `Array<PGWebsiteLink>`   | Zone B links list, preview, validation (`hasIncompleteLinks`)                       | link add/remove/edit handlers (~line 1345+)            | **content**         | no — **but submit forgets to read it (bug #1)**                                          |
| `recipients`                                                    | `Array<SelectedEntity>`  | Students section, preview, submit (`builtRecipients`)                               | `EntitySelector` onChange                              | **recipients**      | no                                                                                       |
| `staffInCharge`                                                 | `Array<SelectedEntity>`  | Staff-in-charge section, preview, submit                                            | `StaffSelector` onChange                               | **recipients**      | no                                                                                       |
| `staffRoles`                                                    | `Record<string, PGRole>` | Staff-in-charge role dropdowns, submit                                              | role-change handler                                    | **recipients**      | no                                                                                       |
| `enquiryEmail`                                                  | `string`                 | Enquiry email field, preview, submit                                                | `EnquiryEmailSelector` onChange                        | **recipients**      | no                                                                                       |
| `uploadedFiles`                                                 | `Array<File>`            | Files list (current session), preview, `processFiles` cap check                     | `processFiles` / remove handlers                       | **files**           | no (blob handles, not persistable)                                                       |
| `filesMeta`                                                     | `Array<FileMeta>`        | Files list metadata, autosave payload                                               | `processFiles` appends                                 | **files**           | no                                                                                       |
| `draftFilesMeta`                                                | `Array<FileMeta>`        | Files list (restored stubs), autosave payload, 30-day banner                        | draft-restore effect, edit-prefill effect              | **files**           | no                                                                                       |
| `fileDragOver`                                                  | `boolean`                | Files dropzone highlight                                                            | onDragOver/onDragLeave/onDrop                          | **files**           | yes — pure UI hover state, doesn't need to be in the shared draft state at all           |
| `fileBannerDismissed`                                           | `boolean`                | 30-day retention banner visibility                                                  | dismiss handler                                        | **files**           | no                                                                                       |
| `uploadedPhotos`                                                | `Array<{file,url}>`      | Photos grid (current session), preview                                              | `processPhotos` appends                                | **photos**          | no                                                                                       |
| `photosMeta`                                                    | `Array<FileMeta>`        | Photos grid metadata, autosave payload                                              | `processPhotos` appends                                | **photos**          | no                                                                                       |
| `draftPhotosMeta`                                               | `Array<FileMeta>`        | Photos grid (restored stubs), autosave payload                                      | draft-restore effect                                   | **photos**          | no                                                                                       |
| `coverPhotoIndices`                                             | `Set<number>`            | Cover-photo toggle UI, preview, autosave (serialized to array)                      | cover toggle handler                                   | **photos**          | no                                                                                       |
| `dragOverIndex`                                                 | `number \| null`         | Photo reorder drag target highlight                                                 | photo drag handlers                                    | **photos**          | yes — pure UI                                                                            |
| `photoDragOver`                                                 | `boolean`                | Photos dropzone highlight                                                           | onDragOver/onDrop                                      | **photos**          | yes — pure UI                                                                            |
| `responseType`                                                  | `ResponseType`           | Response-type radio group, gates Questions/Event/Settings sections, preview, submit | `handleResponseTypeChange`                             | **response-config** | no                                                                                       |
| `dueDate`                                                       | `string`                 | Settings due-date input, submit                                                     | date input onChange                                    | **response-config** | no                                                                                       |
| `reminderType`                                                  | `ReminderType`           | Settings reminder dropdown                                                          | dropdown onChange                                      | **response-config** | no                                                                                       |
| `reminderDate`                                                  | `string`                 | Settings reminder date input                                                        | date input onChange                                    | **response-config** | no                                                                                       |
| `questions`                                                     | `Array<FormQuestion>`    | Questions builder, preview                                                          | `QuestionBuilder` onChange                             | **response-config** | no                                                                                       |
| `editingQuestionId`                                             | `string \| null`         | Which question is expanded in the builder                                           | question click handler                                 | **response-config** | yes — could be local to the question-builder subtree instead of the page                 |
| `eventStart`/`eventStartTime`/`eventEnd`/`eventEndTime`/`venue` | `string` ×5              | Event-details section, preview, submit                                              | date/time/text inputs                                  | **response-config** | no                                                                                       |
| `sendOption`                                                    | `'now' \| 'scheduled'`   | Scheduling strip, confirm sheet, autosave                                           | radio onChange                                         | **schedule**        | no                                                                                       |
| `scheduledDate`                                                 | `string`                 | Scheduling strip, confirm sheet, autosave                                           | date input                                             | **schedule**        | no                                                                                       |
| `scheduledTime`                                                 | `string`                 | Scheduling strip, confirm sheet, autosave                                           | time input                                             | **schedule**        | no                                                                                       |
| `showConfirmSheet`                                              | `boolean`                | `SendConfirmationSheet` open state                                                  | Post button / sheet onClose                            | **schedule**        | yes — local to the sheet's controller, doesn't need page scope                           |
| `showPreview`                                                   | `boolean`                | Preview pane visibility toggle                                                      | header toggle button                                   | **ui-meta**         | yes — pure UI, could live in the preview pane's own parent wrapper                       |
| `savedAt`                                                       | `Date \| null`           | Autosave status text in header                                                      | autosave effect / draft-restore                        | **ui-meta**         | yes — derivable as "last successful save" from a reducer action, not separate page state |
| `isSaving`                                                      | `boolean`                | Autosave status text in header                                                      | autosave effect (via nested `setTimeout`)              | **ui-meta**         | yes — same as above, folds into an autosave status enum                                  |
| `draftLoaded`                                                   | `boolean`                | Drives the "draft restored" toast / banner (implied)                                | draft-restore effect                                   | **ui-meta**         | no                                                                                       |
| `showValidationPopover`                                         | `boolean`                | Validation popover under the disabled Post button                                   | Post button click when invalid; auto-closes via effect | **ui-meta**         | yes — local to the header/footer split-button control                                    |

Plus 2 refs (`dragSourceIndex`, `fileInputRef`, `photoInputRef` — not
state, not counted above) and `AnnouncementPreview`'s own internal
`screen` state (already isolated — see A.2).

**26 of the 39 states above feed the autosave payload** (everything tagged
content/recipients/response-config/schedule, plus the four files/photos
meta fields, minus the pure-UI ones). This is the direct evidence for
making `useAnnouncementDraft` a single reducer: today those 26 pieces of
state are 26 separate `useState` calls that all have to be remembered in
three places — the autosave effect's object literal, the autosave effect's
dependency array, and the draft-restore effect's `setX(draft.x ?? default)`
calls. Bug #1 is what happens when a 27th place (the submit handler) is
supposed to remember the same list and doesn't.

### A.2 Target component tree

```
NewAnnouncementPage (route shell — ~150 lines target)
├── useAnnouncementDraft()              — reducer + the 2 effects (autosave, restore)
├── useAttachments()                    — files+photos state, drag/drop handlers, processFiles/processPhotos
├── <AnnouncementHeader>                — autosave status, preview toggle, Post/Save split button, validation popover
│     props: { isSaving, savedAt, canSubmit, missingFields, onSubmit, onToggleScheduled }
├── <ScheduleStrip>                     — send-now/scheduled radio + date/time (only if !isEditingPosted)
│     props: { sendOption, scheduledDate, scheduledTime, dispatch }
├── <AnnouncementEditorForm>            — the whole scrollable form body
│   ├── <RecipientsSection>             — students, staff-in-charge, staff roles, enquiry email
│   ├── <ContentSection>                — title, description, shortcuts, website links (Zone A/B)
│   ├── <AttachmentsSection>            — files list + photos grid (uses useAttachments())
│   ├── <ResponseTypeSection>           — radio group + "attach a form" stub
│   ├── <QuestionsSection>              — only when responseType === 'yes-no' (wraps QuestionBuilder;
│   │                                       editingQuestionId becomes local state here)
│   └── <EventDetailsSection>           — event start/end, venue, due date, reminders
├── <AnnouncementPreview>               — UNCHANGED interface, wrapped in React.memo (see A.3)
└── <SendConfirmationSheet>             — already a shared component; showConfirmSheet becomes local
                                            to whichever component owns the Post button
```

`AnnouncementPreview` (line 198-908) is **already a separate component**
with a clean ~19-prop interface and its own `screen` state — it does not
need to be split further. Its only structural problem is that it is not
memoized, so every keystroke in the title re-renders its ~700 lines even
though most of its props didn't change.

### A.3 State clusters → hooks/reducers

| Cluster                                                                           | Becomes                                                                                                                                                                                                                                                         | Action list (reducer)                                                                                                                                                                                                                                                                                                                                                       |
| --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| content + recipients + response-config + schedule (the 26 autosave-backed fields) | `useAnnouncementDraft(existingAnnouncement, resume)` — one `useReducer` + the autosave/restore effects                                                                                                                                                          | `SET_FIELD(key, value)` (generic, covers title/description/dueDate/etc.), `SET_SHORTCUTS`, `SET_WEBSITE_LINKS`, `SET_RECIPIENTS`, `SET_STAFF_IN_CHARGE`, `SET_STAFF_ROLES`, `SET_RESPONSE_TYPE` (also clears dueDate/reminders/questions/event fields — currently `handleResponseTypeChange`), `SET_QUESTIONS`, `LOAD_DRAFT(draft)`, `LOAD_EXISTING(announcement)`, `RESET` |
| files + photos                                                                    | `useAttachments(existingAnnouncement?)` — custom hook, plain `useState`/`useReducer` internal, exposes `{ filesMeta, photosMeta, draftFilesMeta, draftPhotosMeta, coverPhotoIndices, addFiles, addPhotos, removeFile, removePhoto, toggleCover, dragHandlers }` | N/A (hook API, not a reducer contract consumed elsewhere)                                                                                                                                                                                                                                                                                                                   |
| ui-meta (`showPreview`, `showValidationPopover`, `showConfirmSheet`)              | plain local `useState` in whichever leaf component owns the control (header, footer, sheet wrapper) — these never needed page-level scope                                                                                                                       | N/A                                                                                                                                                                                                                                                                                                                                                                         |
| `editingQuestionId`                                                               | local state inside `<QuestionsSection>`                                                                                                                                                                                                                         | N/A                                                                                                                                                                                                                                                                                                                                                                         |

The generic `SET_FIELD(key, value)` action is what makes bug #1
structurally impossible: the submit handler builds `PGAnnouncement` by
spreading `draftState` (the reducer's state), the exact same object the
autosave effect already serializes. There is no second place to "forget"
`websiteLinks`.

### A.4 Render-isolation goals

1. Typing in the title must not re-render `<AttachmentsSection>` or
   `<AnnouncementPreview>`. Achieved by: (a) `AnnouncementPreview` wrapped
   in `React.memo` (it already receives a flat, comparable prop list); (b)
   `useAnnouncementDraft`'s reducer state is read via selector-shaped hooks
   or by passing only the slice each section needs, not the whole draft
   object, to each `<...Section>`.
2. Dragging a photo must not re-render `<ContentSection>` — `useAttachments()`
   is a separate hook instance/state tree from `useAnnouncementDraft()`, so
   a photo-only update never touches the reducer that backs content fields.
3. The autosave "Saving…/Saved" status text re-renders only
   `<AnnouncementHeader>` — today `isSaving`/`savedAt` are page-level state,
   so every autosave tick re-renders all 2,758 lines. Fold them into an
   autosave-status value derived inside `useAnnouncementDraft` and expose
   just that value (or a dedicated `useAutosaveStatus()` sub-hook) to the
   header only.

### A.5 The autosave effect's future

Today: one `useEffect` with 27 dependencies (~line 1119-1147), re-created
and re-diffed on every one of 26 state changes, closes over `saveDraft`.

Target: `useAnnouncementDraft`'s internal effect has exactly **one**
dependency — the reducer's `state` object (or a `version`/`dirty` counter
bumped by every dispatch) — because the reducer already centralizes every
field that needs to be persisted. The effect body doesn't change (2s
debounce, `hasContent` guard, `saveDraft(...)` call); only its dependency
surface shrinks from 27 named variables to 1 state reference. This is the
single biggest win for "a missed dependency is a stale-closure / lost-draft
bug" — with the reducer, there is no dependency to miss.

### A.6 Migration slices (each ≤~400 lines moved, independently verifiable)

Verification for every slice = `bunx vitest run` (draft-storage
characterization tests must stay green) + a manual browser pass through:
type title → wait 2s → reload → confirm draft restored; add a photo/file →
reload → confirm stub restored; submit → confirm `websiteLinks` and all
other fields land in the created announcement (this directly re-tests bug
#1's surface, without fixing it yet — fixing it is explicitly the
generic-`SET_FIELD` refactor itself, not a separate step).

1. **Extract `useAttachments()`** (files+photos cluster, ~250 lines moved
   out of the page body — state + `processFiles`/`processPhotos`/drag
   handlers). Lowest risk: this cluster has the fewest cross-cluster reads
   (only the autosave effect and submit payload read its outputs).
2. **Wrap `<AnnouncementPreview>` in `React.memo`.** Trivial, high-value,
   no state changes — do this early since it's independent of everything
   else and immediately measurable (React DevTools profiler: keystroke no
   longer re-renders the preview).
3. **Extract `<AttachmentsSection>` and `<QuestionsSection>` as JSX**
   (pure JSX extraction, still reading props/state via drilling — no
   reducer yet). Fixes the photo-dropzone keyboard-accessibility gap
   (bug #2) opportunistically while this block is already being touched.
4. **Introduce `useAnnouncementDraft` reducer**, migrate the 26
   autosave-backed fields one `SET_FIELD` dispatch at a time, keeping the
   old `useState` calls as thin wrappers initially if a slice needs to
   ship mid-migration (optional safety valve — remove once slice 5 lands).
5. **Rewire the autosave effect and submit handler to read from the
   reducer state** — this is the slice that fixes bug #1 as a side
   effect, and should say so explicitly in its PR description since it's
   otherwise "just a refactor."
6. **Split `<RecipientsSection>` and `<ContentSection>` out of the JSX**,
   now that they can take reducer-state slices as props instead of 8
   individual props each.
7. **Extract `<AnnouncementHeader>`/`<ScheduleStrip>`**, localize
   `showPreview`/`showValidationPopover`/`showConfirmSheet`/`isSaving`/`savedAt`
   display state to these components.

### A.7 Open questions for the maintainer

- Should `SET_FIELD` be a single generic action keyed by field name (fast
  to write, weak typing — easy to typo a key) or one named action per
  field (verbose, but each action is independently type-checked)? Given
  this file's bug history (missed-field bugs), the named-action version is
  probably worth the verbosity.
- `useAttachments()` currently needs `existingAnnouncement` to seed
  `draftFilesMeta` on edit (line ~1221-1233) — should draft-restore and
  edit-prefill be unified into one "seed" path inside the hook, or kept as
  two separate effects (mirroring today's `if (!existingAnnouncement) {...}
else {...}` branch at line 1150)? This spike did not resolve it; it's a
  design choice for whoever picks up slice 4.
- Is `coverPhotoIndices` (a `Set<number>`) worth keeping as a `Set` inside
  `useAttachments`, or should it become an array from the start (it's
  already serialized to/from an array for the draft anyway)?

## Part B — `src/routes/students_.$id.agency-report.new.tsx`

### B.1 State inventory

| Component (line range)                            | States                                                                                                                                                                                                                                                                                   | Cluster                                                                                                                                                                                                                                                                                                         |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AddCollaboratorsModal` (305-492)                 | `email`, `permission`, `message`, `picked`                                                                                                                                                                                                                                               | share/collab (self-contained dialog)                                                                                                                                                                                                                                                                            |
| `TemplateSelection` (564-1018)                    | `multiSelect`, `query`, `agencyFilter`, `previewTemplate`, `singleSelected`, `filterQuery`                                                                                                                                                                                               | template picker (self-contained step)                                                                                                                                                                                                                                                                           |
| `FieldSourceLink` (1110-1179)                     | `open`                                                                                                                                                                                                                                                                                   | field-level popover (fully local already)                                                                                                                                                                                                                                                                       |
| `FieldRow` (1179-1448)                            | `aiPanelOpen`                                                                                                                                                                                                                                                                            | field-level AI panel (fully local already)                                                                                                                                                                                                                                                                      |
| **`ReportForm` (2708-3307, ~600 lines)**          | `fieldValues`, `aiFlags`, `prefilledFrom`, `completedSections`, `previewOpen`, `savedStatus`, `submitOpen`, `sentOpen`, `submitted`, `autoFilled`, `addCollaboratorsOpen`, `collaborators`, `noteToPrincipal`, `prefillBannerDismissed`, `aiSourceSelections`, `assignments` (16 states) | **the real hotspot** — form-answers cluster (`fieldValues`/`aiFlags`/`prefilledFrom`/`completedSections`/`autoFilled`/`aiSourceSelections`) + collab cluster (`collaborators`/`addCollaboratorsOpen`/`noteToPrincipal`) + submit-flow cluster (`previewOpen`/`savedStatus`/`submitOpen`/`sentOpen`/`submitted`) |
| `ExportPassword` (3307-3509)                      | `showPw`, `pw`, `encrypt`, `previewOpen`                                                                                                                                                                                                                                                 | export dialog (self-contained)                                                                                                                                                                                                                                                                                  |
| `AgencyReportWizardPage` (3556-3749, route entry) | `step`, `selectedTemplates`                                                                                                                                                                                                                                                              | wizard step machine                                                                                                                                                                                                                                                                                             |

34 distinct states across 7 components (2 more components — `StepBar`,
`StudentBar`, `CollaboratorAvatars`, `TemplatePreviewModal`,
`AiSourcePanel`, `SectionPanel`, and ~15 pure rendering helpers for the
PDF-facsimile output — hold zero `useState`).

Unlike `announcements.new.tsx`, this file's `useState` calls were **already
distributed by whoever wrote it** — there is no single 1,800-line function
holding all 35. The coordination risk is real but concentrated: 16 of the
34 states live in one component (`ReportForm`), and within that, the
form-answers sub-cluster (`fieldValues`, `aiFlags`, `prefilledFrom`,
`completedSections`, `autoFilled`) is the one that actually needs
`useReducer`-style coordination (e.g. `prefillFromReport` at line ~2772
writes to both `fieldValues` and `prefilledFrom` together — a
textbook two-states-that-must-move-together case).

### B.2 If this were pursued: target shape for `ReportForm`

```
ReportForm (route step — orchestration only)
├── useReportAnswers(template, currentReportId)   — fieldValues/aiFlags/prefilledFrom/completedSections/autoFilled/aiSourceSelections
├── useReportCollaborators()                       — collaborators/addCollaboratorsOpen/noteToPrincipal
├── <ReportToolbar>                                 — auto-fill button, savedStatus, preview/submit triggers
├── <ReportSections>                                — maps template.sections to <SectionPanel>, reads useReportAnswers()
├── <DocumentPreviewModal>                          — already extracted (line 2672)
├── <AddCollaboratorsModal>                          — already extracted (line 305)
└── submit flow (submitOpen/sentOpen/submitted)     — could become a small useReducer('idle'|'previewing'|'submitting'|'sent')
```

### B.3 Go/no-go recommendation for agency-report

**No-go for a whole-file decomposition pass right now.** Rationale:

- The file already has component boundaries at every natural seam (wizard
  step, template picker, collaborators dialog, export dialog, field row,
  document preview). A generic "split the god component" plan doesn't
  apply — there is no single god component analogous to
  `NewAnnouncementPage`.
- The one real hotspot, `ReportForm`'s 16 states, is large but it is a
  linear, single-screen form (fill in template fields, optionally prefill,
  optionally get AI help per field, submit) — not a multi-surface page
  like announcements.new (list+editor+preview+scheduler+confirm-dialog all
  coordinating at once). The coordination risk here is lower: most of the
  16 states are read by disjoint UI (submit-flow dialogs never read
  `fieldValues`; the collab dialog never reads `aiSourceSelections`).
- There is no autosave effect here with a large dependency array — the
  single most dangerous pattern in `announcements.new.tsx` — so the
  "any missed dependency is a stale-closure / lost-draft bug" risk that
  motivated this whole spike doesn't apply to this file the same way.
- Recommendation: **leave `agency-report.new.tsx` alone until it next
  grows a feature that touches `ReportForm`.** At that point, extract just
  `useReportAnswers()` (the 6-state form-answers cluster) as a scoped,
  single-PR refactor — not a full-file decomposition. Revisit this
  recommendation if a future feature adds an autosave effect to
  `ReportForm` (the moment that happens, this file inherits
  `announcements.new.tsx`'s exact risk profile and should be re-planned).

## Cross-cutting open questions

1. Should `useAnnouncementDraft` and a future `useReportAnswers` share a
   generic `useReducerDraft(storageKey, initialState)` helper, given both
   are "form state that autosaves to localStorage with a debounce"? This
   spike found only one current consumer of that pattern
   (`announcements.new.tsx`); building the generic version now would be
   speculative. Revisit if `ReportForm` ever gains autosave (see B.3).
2. `students.index.tsx`'s column-sync effects (five, reduced to two on
   branch 022 via `src/lib/apply-flag-columns.ts`) are the same "N effects
   that must stay in sync" smell as this spike's two routes, just smaller.
   Worth a follow-up look once 022 merges, to see if the same
   table-driven/derived approach generalizes.

## Done criteria for this doc

- [x] State inventory table for both routes (39 + 34 distinct states
      counted and attributed to a component/section)
- [x] Target component tree for `announcements.new.tsx`
- [x] State clusters mapped to hooks/reducers with action lists
- [x] Render-isolation goals named
- [x] Autosave effect's future specified
- [x] Migration slices in ≤~400-line increments
- [x] Open questions listed
- [x] Go/no-go recommendation for agency-report (no-go, with a narrower
      scoped alternative)
- [x] Known pre-existing bugs factored in as evidence, not re-derived
