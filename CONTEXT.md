# Teacher Workspace — Design Prototype

Prototype workspace for Teacher & School product surfaces. Terms below are the
canonical language for their feature areas; UI copy, code identifiers, and plans
should use them.

## Language — Reports (HDP module)

**Cycle**:
One semester's reporting cycle (Sem 1 = Terms 1–2, Sem 2 = Terms 3–4), moving
through the stages Observing → Window open → Drafting → Review → Released.
Drafting and release happen once per cycle.
_Avoid_: reporting period, round

**Term**:
One of the four school terms; the unit tags are stamped with and the unit the
Term Summary groups by. Two terms make a cycle.

**Tag**:
A single voluntary, in-the-moment observation of a student: one disposition,
an optional short note, a context. Never mandated, never negative.
_Avoid_: observation record, entry, note (a note is the optional text on a tag)

**Disposition**:
One of the four fixed strengths a tag records — Perseverance, Curiosity,
Collaboration, Self-direction. Counts are provenance, never scores.
_Avoid_: trait, quality, score

**Tag context**:
Where the moment happened — lesson, marking, CCA, form time, other. Behaviour
is described in context, never as a trait.

**River**:
The consolidated per-student stream of all teachers' tags for the year.
_Avoid_: feed, timeline

**Forming pattern**:
The same disposition tagged in two or more distinct contexts; rendered as a
"candidate thread, unconfirmed" until a teacher confirms it.
_Avoid_: insight, trend (trends are Prototype B trajectory language)

**Broadcast**:
A form teacher's one-shot, rate-limited request to the teachers timetabled to
selected thin-record students, asking for a tag or an explicit nil.
_Avoid_: blast, reminder, nudge

**Nil response**:
A broadcast reply of "Nothing stood out" — an explicit, recorded answer,
distinct from silence; it marks the student reviewed.

**Reviewed**:
A student with at least one active tag or an explicit nil this term. The only
coverage word used in UI copy.
_Avoid_: covered, coverage % as a target (coverage is a diagnostic, never a KPI)

**Reporting window**:
The school-configured span within a cycle when the Draft Studio opens.

**Your addition**:
A teacher-written sentence in a draft that carries no source tag; always
visibly labelled, never given a fabricated source.

**Reports**:
The sidebar destination housing the whole cycle and its tools. Teacher-facing
name for the module.
_Avoid_: HDP (policy language — never in UI copy), Report Builder (the legacy
flag-gated hub it replaces)

## Language — Posts (Parents Gateway)

**Post**:
A message a teacher sends to parents through Parents Gateway. The teacher-facing
name for the surface.
_Avoid_: announcement (code/route identifier only — never in UI copy)

**Response type**:
How parents reply to a post — View-only, Acknowledge, or Yes/No. The single axis
that splits a post "with response" from one "without response".

**View-only**:
A post parents read but do not reply to. The "without response" case.

**Acknowledge**:
A response type where parents tap once to confirm they have seen the post.
Cannot be declined.

**Yes/No**:
A response type where parents choose Yes or No — the only one that can be
declined. Used to collect consent.

**Consent post**:
A Yes/No post used to collect parental consent (e.g. for a trip). Consent is the
Yes/No decision itself, not a separate response type or entity.
_Avoid_: consent form, consent type

**Draft**:
An unsent post, saved automatically as the teacher works — the "Saved ·" state
and the "Draft" status in the posts list. A state of a post, not a separate
artifact.
_Avoid_: autosave (that's the mechanism, not the thing)

**AI Draft**:
The action of generating a post's starting content from a template, for the
teacher to review and edit. It fills a Draft; it is not a different kind of
draft. "AI Draft" is the button label.
_Avoid_: generate, autofill (as UI labels)

**Post template**:
A named starting pattern for a post (e.g. Overseas Learning Trip) that AI Draft
expands into title, details, response type, due date, and settings. Distinct
from an Agency report template (an official external form).
_Avoid_: example, starter (UI says "template")

**HeyTalia**:
The assistant that drafts posts and forms from a free-text topic. Shares the
same drafting engine as AI Draft, reached through a different doorway (chat
versus the template picker).
