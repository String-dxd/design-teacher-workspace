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
