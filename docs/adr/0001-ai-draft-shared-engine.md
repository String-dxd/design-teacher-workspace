# AI Draft and HeyTalia share one drafting engine, not one delivery path

AI Draft (the post composer's template picker) and HeyTalia (the global chat
assistant) both draft posts. We put the drafting logic — the post templates and
their content composition — in one shared module (`src/lib/post-ai-draft.ts`) so
there is a single source of truth ("one brain"); HeyTalia's `buildDraft`
delegates to it and offers the same templates. We deliberately did **not** unify
how a draft reaches the composer's form: the in-form picker sets the composer's
form state directly, while HeyTalia's "Use draft" delivery is left as a
fast-follow — today that button is a non-functional mockup (`heytalia-panel.tsx`,
no `onClick`, no form wiring).

## Why

Unifying delivery would mean building net-new cross-component wiring on a live
global component (navigate-to-composer + apply, or a shared apply-draft context),
which is outside the "post creation screen" scope and delivers no immediate
feature gain. Unifying the *engine* is cheap, removes the risk of two drafting
behaviours diverging, and is what makes the two doorways feel like one assistant.

## Consequences

- Two draft-*delivery* paths exist even though there is one draft *engine*.
- A future reader may expect HeyTalia's "Use draft" to fill the composer — it
  does not yet, by design. Wiring it is the documented fast-follow, and the shared
  engine already gives it the draft to deliver.
