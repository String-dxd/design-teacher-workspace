import type { DraftClaim, FormingPattern, HdpTag } from '@/types/hdp'

// Pure composition — no store reads, no randomness. Turns a student's tags
// (already filtered by the caller for kind: 'subject' vs 'overall', and by
// river visibility) into a handcrafted set of draft claims. This is NOT the
// real Smart Compose (PRD F4.8, Q10) — it's a deterministic arrangement of
// the evidence that exists, standing in for the model so the UI and the
// provenance mechanics (P3/P4) can be built and tested now. The real
// integration replaces this function behind the same signature.
//
// P4 — no draft without evidence: zero tags in ⇒ [] out, always. The caller
// renders the empty state; this function never invents a claim.
// P3 — provenance or labelled opinion: every claim this function returns
// carries a `source.tagId` that exists among the input tags. There is no
// code path here that can produce a sourceless claim — "your addition"
// claims are only ever created by the teacher, in the editor.

const CONTEXT_LABELS: Record<HdpTag['context'], string> = {
  lesson: 'lesson',
  marking: 'marking',
  cca: 'CCA',
  'form-time': 'form time',
  other: 'other',
}

const DISPOSITION_LABELS: Record<HdpTag['disposition'], string> = {
  perseverance: 'Perseverance',
  curiosity: 'Curiosity',
  collaboration: 'Collaboration',
  'self-direction': 'Self-direction',
}

function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString('en-SG', {
    day: 'numeric',
    month: 'short',
  })
}

function sourceLabel(tag: HdpTag): string {
  return `${DISPOSITION_LABELS[tag.disposition]} · ${CONTEXT_LABELS[tag.context]} · ${formatDateShort(tag.createdAt)}`
}

/**
 * A tag's note, lightly stitched into a third-person sentence about the
 * student. The composer arranges the note's own words — it does not add
 * characterisation. Falls back to a disposition-only sentence when the tag
 * carries no note.
 */
function claimTextForTag(tag: HdpTag, studentName: string): string {
  if (tag.note) {
    const note = tag.note.trim()
    const lower = note.charAt(0).toLowerCase() + note.slice(1)
    return `${studentName} ${lower}`
  }
  return `${studentName} showed ${DISPOSITION_LABELS[tag.disposition].toLowerCase()} during ${CONTEXT_LABELS[tag.context]}.`
}

function crossContextClaimText(
  pattern: FormingPattern,
  studentName: string,
): string {
  const contexts = pattern.contexts.map((c) => CONTEXT_LABELS[c]).join(' and ')
  return `${studentName} has shown ${DISPOSITION_LABELS[pattern.disposition].toLowerCase()} across ${contexts}, not just once.`
}

/**
 * Deterministic ordering: most recent first, ties broken by tag id. Always
 * sort before slicing so the same input produces the same output on every
 * call (required for tests and the repo's no-`Math.random`-in-render rule).
 */
function sortedByRecency(tags: Array<HdpTag>): Array<HdpTag> {
  return tags.slice().sort((a, b) => {
    const byDate =
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    if (byDate !== 0) return byDate
    return a.id.localeCompare(b.id)
  })
}

/**
 * Builds 2–4 claims from a student's evidence. `tags` should already be
 * pre-filtered by the caller for the intended audience (all tags for
 * `kind: 'overall'`, only the authoring teacher's own tags for
 * `kind: 'subject'`) — this function stays viewer-agnostic and just
 * arranges whatever it's given.
 */
export function composeDraft(
  tags: Array<HdpTag>,
  patterns: Array<FormingPattern>,
  kind: 'subject' | 'overall',
  studentName: string,
): Array<DraftClaim> {
  if (tags.length === 0) return []

  const ordered = sortedByRecency(tags)
  const claims: Array<DraftClaim> = []

  // One claim per distinct disposition, most recent tag first, up to 3 —
  // gives the draft variety across the four dispositions rather than
  // repeating the same one.
  const seenDispositions = new Set<HdpTag['disposition']>()
  for (const tag of ordered) {
    if (seenDispositions.has(tag.disposition)) continue
    seenDispositions.add(tag.disposition)
    claims.push({
      text: claimTextForTag(tag, studentName),
      source: { tagId: tag.id, label: sourceLabel(tag) },
    })
    if (claims.length >= 3) break
  }

  // A confirmed pattern contributes one cross-context claim, sourced to its
  // first (most recent) constituent tag — it's still one real tag's id, so
  // P3 holds even for the synthesised "across contexts" sentence.
  const confirmedPattern = patterns.find((p) => p.status === 'confirmed')
  if (confirmedPattern && claims.length < 4) {
    const patternTags = ordered.filter((t) =>
      confirmedPattern.tagIds.includes(t.id),
    )
    const anchorTag = patternTags[0] ?? ordered[0]
    claims.push({
      text: crossContextClaimText(confirmedPattern, studentName),
      source: { tagId: anchorTag.id, label: sourceLabel(anchorTag) },
    })
  }

  // Kind doesn't change the arrangement here — the caller already
  // pre-filtered `tags` to the right author set before calling in
  // (overall: all teachers' tags; subject: the authoring teacher's only).
  void kind

  return claims.slice(0, 4)
}
