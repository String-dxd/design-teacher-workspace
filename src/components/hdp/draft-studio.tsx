import * as React from 'react'
import { Link } from '@tanstack/react-router'
import { toast } from 'sonner'
import { ClaimEditor } from './claim-editor'
import { InsightCuration } from './insight-curation'
import { SourceTag } from './source-tag'
import { StudentRiver } from './student-river'
import type { DraftClaim, HdpDraft, HdpInsight, HdpTag } from '@/types/hdp'
import type { ReconcileResult } from '@/lib/hdp-reconcile'
import { getStudentById } from '@/data/mock-students'
import { MOCK_STAFF } from '@/data/mock-staff'
import { CURRENT_TEACHER } from '@/data/hdp'
import { TIMETABLE } from '@/data/timetable'
import { insightsForStudent } from '@/data/insights'
import {
  confirmDraft,
  detectFormingPatterns,
  draftId,
  findDraft,
  loadMarks,
  reopenDraft,
  saveDraft,
  seedIfEmpty,
  tagsForStudent,
  tagsForStudentVisible,
} from '@/lib/hdp-store'
import { composeDraft, composeFromInsights } from '@/lib/hdp-draft-compose'
import { trendForSubject, trendsForEntries } from '@/lib/hdp-trends'
import { reconcileCheck } from '@/lib/hdp-reconcile'
import { useFeatureFlag } from '@/hooks/use-feature-flag'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/empty-state'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

const SUGGEST_LATENCY_MS = 600
const AUTOSAVE_DEBOUNCE_MS = 800

type DraftKind = 'subject' | 'overall'

function staffName(id: string): string {
  return MOCK_STAFF.find((s) => s.id === id)?.name ?? 'Unknown teacher'
}

function subjectsForStudentClass(classId: string): Array<string> {
  return TIMETABLE.filter(
    (t) => t.teacherId === CURRENT_TEACHER.id && t.classId === classId,
  ).map((t) => t.subject)
}

/** The F4b reconcile-gate dialog's body copy — names the subject (or "the
 *  majority of subjects" for an unresolved overall majority) and direction
 *  (plan 040). Sentiment is deducible from `direction` alone: the gate only
 *  ever fires on positive-phrasing+easing or struggle-phrasing+climbing. */
function reconcileMessage(result: ReconcileResult): string {
  const subjectLabel = result.subject ?? 'the majority of subjects'
  const isAre = result.subject ? 'is' : 'are'
  if (result.direction === 'easing') {
    return `This comment reads as positive progress, but ${subjectLabel} ${isAre} easing this semester.`
  }
  return `This comment reads as a struggle, but ${subjectLabel} ${isAre} climbing this semester.`
}

interface DraftStudioProps {
  studentId: string
}

// The right-hand drafting surface of /reports/drafts/$studentId — a kind
// switcher over a claim editor, backed by composeDraft (mock Smart Compose)
// and hdp-store's draft persistence. The left-hand evidence column
// (StudentRiver) is rendered by this same component so the kind switch can
// keep both columns in sync.
//
// Prototype B (plan 040, `reports-hdp-future` only): an Insights curation
// step slots in between the evidence river and the claim editor. Selection
// is the authorship act — composeFromInsights (not composeDraft) builds
// claims ONLY from the insights the teacher checked, and Confirm runs the
// F4b reconcile gate before freezing the draft. Flag off ⇒ every branch
// below that reads `showInsights` is false, and this component behaves
// exactly as the A path (composeDraft, no insights section, no gate).
export function DraftStudio({ studentId }: DraftStudioProps) {
  const showInsights = useFeatureFlag('reports-hdp-future')
  const student = getStudentById(studentId)
  const studentClass = student?.class ?? ''
  const availableSubjects = React.useMemo(
    () => subjectsForStudentClass(studentClass),
    [studentClass],
  )

  const [kind, setKind] = React.useState<DraftKind>('overall')
  const [subject, setSubject] = React.useState<string | undefined>(undefined)
  const [claims, setClaims] = React.useState<Array<DraftClaim>>([])
  const [status, setStatus] = React.useState<'draft' | 'confirmed'>('draft')
  const [suggesting, setSuggesting] = React.useState(false)
  const [regenerateConfirmOpen, setRegenerateConfirmOpen] =
    React.useState(false)
  const [confirmDialogOpen, setConfirmDialogOpen] = React.useState(false)
  const [reconcileDialogOpen, setReconcileDialogOpen] = React.useState(false)
  const [reconcileResult, setReconcileResult] =
    React.useState<ReconcileResult | null>(null)
  const [saveState, setSaveState] = React.useState<'idle' | 'saved'>('idle')
  const [mounted, setMounted] = React.useState(false)
  const [visibleTags, setVisibleTags] = React.useState<Array<HdpTag>>([])
  const [selectedInsightIds, setSelectedInsightIds] = React.useState<
    Set<string>
  >(new Set())

  React.useEffect(() => {
    seedIfEmpty()
    setMounted(true)
  }, [])

  React.useEffect(() => {
    if (availableSubjects.length > 0 && !subject) {
      setSubject(availableSubjects[0])
    }
  }, [availableSubjects, subject])

  // Load the relevant draft whenever the kind/subject tab changes.
  React.useEffect(() => {
    if (!mounted) return
    if (kind === 'subject' && !subject) {
      setClaims([])
      setStatus('draft')
      setSelectedInsightIds(new Set())
      return
    }
    const existing = findDraft(
      studentId,
      kind,
      kind === 'subject' ? subject : undefined,
    )
    setClaims(existing?.claims ?? [])
    setStatus(existing?.status ?? 'draft')
    setSelectedInsightIds(new Set(existing?.insightIds ?? []))
  }, [mounted, studentId, kind, subject])

  // Evidence for the active kind: overall draws from every active tag for
  // this student regardless of the river-visibility flag (multi-teacher by
  // design); subject draws only from the authoring teacher's own tags.
  const evidenceTags = React.useMemo(() => {
    if (!mounted) return []
    if (kind === 'overall') {
      return tagsForStudentVisible(studentId, CURRENT_TEACHER.id, true)
    }
    return tagsForStudent(studentId).filter(
      (t) => t.authorId === CURRENT_TEACHER.id && t.lifecycle === 'active',
    )
  }, [mounted, studentId, kind])

  // Prototype B's curation list — per-student, not per-kind (attendance/
  // CCA/conduct facts aren't tied to a subject the way tags are).
  const insights = React.useMemo<Array<HdpInsight>>(
    () => (mounted && showInsights ? insightsForStudent(studentId) : []),
    [mounted, showInsights, studentId],
  )

  const insightsById = React.useMemo(() => {
    const map = new Map<string, HdpInsight>()
    for (const insight of insights) map.set(insight.id, insight)
    return map
  }, [insights])

  const tagsById = React.useMemo(() => {
    const map = new Map<string, HdpTag>()
    for (const tag of visibleTags) map.set(tag.id, tag)
    for (const tag of evidenceTags) map.set(tag.id, tag)
    return map
  }, [visibleTags, evidenceTags])

  // The river embed mirrors whichever evidence scope is feeding the active
  // kind's draft — overall sees the full river, subject sees only this
  // teacher's own tags, matching evidenceTags above.
  React.useEffect(() => {
    if (!mounted) return
    setVisibleTags(
      tagsForStudentVisible(studentId, CURRENT_TEACHER.id, kind === 'overall'),
    )
  }, [mounted, studentId, kind])

  const hasEvidence = evidenceTags.length > 0
  // In B mode the insight list (which spans attendance/CCA/conduct facts,
  // not just tags) is the real evidence backing a draft — a thin-tag
  // record can still have insights, and the empty state should track that,
  // not the tag-only signal the A path uses.
  const effectiveHasEvidence = showInsights ? insights.length > 0 : hasEvidence
  const hasEdits = claims.some((c) => c.edited || !c.source)
  const currentDraftId = draftId(
    studentId,
    kind,
    kind === 'subject' ? subject : undefined,
  )

  function toggleInsight(id: string) {
    setSelectedInsightIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  // Autosave — debounced saveDraft, skipped while confirmed (frozen) or
  // before the initial load has settled (avoids clobbering a just-loaded
  // draft with an empty [] on mount).
  const skipNextAutosave = React.useRef(true)
  React.useEffect(() => {
    skipNextAutosave.current = true
  }, [kind, subject])

  React.useEffect(() => {
    if (!mounted || status === 'confirmed') return
    if (skipNextAutosave.current) {
      skipNextAutosave.current = false
      return
    }
    const timer = setTimeout(() => {
      saveDraft({
        id: currentDraftId,
        studentId,
        kind,
        subject: kind === 'subject' ? subject : undefined,
        authorId: CURRENT_TEACHER.id,
        claims,
        status,
        insightIds: showInsights ? Array.from(selectedInsightIds) : undefined,
      })
      setSaveState('saved')
    }, AUTOSAVE_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [
    claims,
    mounted,
    status,
    currentDraftId,
    studentId,
    kind,
    subject,
    showInsights,
    selectedInsightIds,
  ])

  function runCompose() {
    if (showInsights) {
      const selected = insights.filter((insight) =>
        selectedInsightIds.has(insight.id),
      )
      const composed = composeFromInsights(
        selected,
        kind,
        student?.name ?? 'This student',
      )
      setClaims(composed)
      toast.success(
        `Draft suggested from ${selected.length} insight${selected.length === 1 ? '' : 's'}`,
      )
      return
    }
    const patterns = detectFormingPatterns(studentId).filter((p) =>
      evidenceTags.some((t) => p.tagIds.includes(t.id)),
    )
    const composed = composeDraft(
      evidenceTags,
      patterns,
      kind,
      student?.name ?? 'This student',
    )
    setClaims(composed)
    toast.success(
      `Draft suggested from ${evidenceTags.length} observation${evidenceTags.length === 1 ? '' : 's'}`,
    )
  }

  function handleSuggestOrRegenerate() {
    if (showInsights && selectedInsightIds.size === 0) return
    if (claims.length > 0 && hasEdits) {
      setRegenerateConfirmOpen(true)
      return
    }
    setSuggesting(true)
    setTimeout(() => {
      runCompose()
      setSuggesting(false)
    }, SUGGEST_LATENCY_MS)
  }

  function handleConfirmDraft(reconcile?: HdpDraft['reconcile']) {
    // A blank "your addition" sentence (e.g. "Add a sentence" left
    // untouched) carries no content — drop it before it's frozen into the
    // confirmed draft. confirmDraft() also filters defensively, but doing
    // it here keeps the on-screen list in sync with what's actually saved.
    const meaningfulClaims = claims.filter((c) => c.text.trim().length > 0)
    saveDraft({
      id: currentDraftId,
      studentId,
      kind,
      subject: kind === 'subject' ? subject : undefined,
      authorId: CURRENT_TEACHER.id,
      claims: meaningfulClaims,
      status: 'draft',
      insightIds: showInsights ? Array.from(selectedInsightIds) : undefined,
      reconcile,
    })
    confirmDraft(currentDraftId)
    setClaims(meaningfulClaims)
    setStatus('confirmed')
    setConfirmDialogOpen(false)
    setReconcileDialogOpen(false)
    toast.success('Draft confirmed')
  }

  // F4b — runs on Confirm, B mode only. Not fired ⇒ the existing "Confirm
  // this draft?" dialog proceeds unchanged; fired ⇒ the reconcile dialog
  // intercepts first (a judgement tripwire, not a nag — no red styling).
  function handleConfirmClick() {
    if (!showInsights) {
      setConfirmDialogOpen(true)
      return
    }
    const trends =
      kind === 'subject' && subject
        ? [{ subject, ...trendForSubject(loadMarks(studentId), subject) }]
        : trendsForEntries(loadMarks(studentId))
    const result = reconcileCheck(claims, trends)
    if (result.fired) {
      setReconcileResult(result)
      setReconcileDialogOpen(true)
      return
    }
    setConfirmDialogOpen(true)
  }

  function handleReopenDraft() {
    reopenDraft(currentDraftId)
    setStatus('draft')
    toast.success('Draft reopened')
  }

  if (!mounted || !student) {
    return <div aria-hidden className="h-24" />
  }

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <details className="flex flex-col gap-3" open>
        <summary className="hover:text-muted-foreground motion-safe:transition-colors motion-safe:duration-150 cursor-pointer rounded-sm text-sm font-medium">
          Evidence
        </summary>
        <div className="pt-1">
          <StudentRiver
            studentId={studentId}
            viewerId={CURRENT_TEACHER.id}
            fullRiver={kind === 'overall'}
            embedded
          />
        </div>
      </details>

      <div className="flex min-w-0 flex-col gap-4">
        <Tabs
          value={kind}
          onValueChange={(value) => setKind(value as DraftKind)}
        >
          <TabsList>
            <TabsTrigger
              value="subject"
              disabled={availableSubjects.length === 0}
            >
              Subject comment
            </TabsTrigger>
            <TabsTrigger value="overall">Overall remark</TabsTrigger>
          </TabsList>

          <TabsContent value="subject" className="flex flex-col gap-4 pt-2">
            {availableSubjects.length > 0 ? (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="draft-subject">Subject</Label>
                <Select
                  value={subject}
                  onValueChange={(value) => setSubject(value ?? undefined)}
                >
                  <SelectTrigger id="draft-subject" className="w-56">
                    <SelectValue placeholder="Select a subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSubjects.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                You don't teach {student.name} a subject this year.
              </p>
            )}
          </TabsContent>
          <TabsContent value="overall" className="pt-2" />
        </Tabs>

        {showInsights && insights.length > 0 && status !== 'confirmed' && (
          <InsightCuration
            insights={insights}
            selectedIds={selectedInsightIds}
            onToggle={toggleInsight}
          />
        )}

        <DraftBody
          hasEvidence={effectiveHasEvidence}
          claims={claims}
          status={status}
          suggesting={suggesting}
          saveState={saveState}
          suggestDisabled={showInsights && selectedInsightIds.size === 0}
          suggestHelperText={
            showInsights
              ? 'Select the insights that belong in this comment.'
              : undefined
          }
          onChangeClaims={(next) => {
            setSaveState('idle')
            setClaims(next)
          }}
          onSuggestOrRegenerate={handleSuggestOrRegenerate}
          onConfirm={handleConfirmClick}
          onReopen={handleReopenDraft}
          resolveTag={(tagId) => {
            const tag = tagsById.get(tagId)
            if (tag) return { tag, authorName: staffName(tag.authorId) }
            if (showInsights) {
              const insight = insightsById.get(tagId)
              if (insight) {
                return {
                  authorName: staffName(CURRENT_TEACHER.id),
                  insightFact: insight.label,
                }
              }
            }
            return undefined
          }}
        />
      </div>

      <AlertDialog
        open={regenerateConfirmOpen}
        onOpenChange={setRegenerateConfirmOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Regenerate this draft?</AlertDialogTitle>
            <AlertDialogDescription>
              Regenerating replaces your edited sentences. Keep editing instead?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setRegenerateConfirmOpen(false)
                setSuggesting(true)
                setTimeout(() => {
                  runCompose()
                  setSuggesting(false)
                }, SUGGEST_LATENCY_MS)
              }}
            >
              Regenerate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm this draft?</AlertDialogTitle>
            <AlertDialogDescription>
              Confirming freezes this comment and its sources for the report
              book. You can reopen it before release.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                handleConfirmDraft(showInsights ? { fired: false } : undefined)
              }
            >
              Confirm draft
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={reconcileDialogOpen}
        onOpenChange={setReconcileDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              The comment and the marks point in different directions
            </AlertDialogTitle>
            <AlertDialogDescription>
              {reconcileResult ? reconcileMessage(reconcileResult) : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Revise</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                handleConfirmDraft({
                  fired: true,
                  resolution: 'kept-with-context',
                })
              }
            >
              Keep — add context
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

interface DraftBodyProps {
  hasEvidence: boolean
  claims: Array<DraftClaim>
  status: 'draft' | 'confirmed'
  suggesting: boolean
  saveState: 'idle' | 'saved'
  /** Prototype B only: true while the teacher hasn't selected any insight
   *  yet — "Suggest a draft" stays disabled until ≥1 selection (plan 040). */
  suggestDisabled?: boolean
  suggestHelperText?: string
  onChangeClaims: (claims: Array<DraftClaim>) => void
  onSuggestOrRegenerate: () => void
  onConfirm: () => void
  onReopen: () => void
  resolveTag: (tagId: string) =>
    | {
        tag?: HdpTag
        authorName?: string
        insightFact?: string
      }
    | undefined
}

// One filled primary button on screen at any time: "Suggest a draft" before
// a draft exists, "Confirm draft" once claims exist and the draft is still
// open, neither while confirmed (just the outline "Reopen draft").
function DraftBody({
  hasEvidence,
  claims,
  status,
  suggesting,
  saveState,
  suggestDisabled = false,
  suggestHelperText,
  onChangeClaims,
  onSuggestOrRegenerate,
  onConfirm,
  onReopen,
  resolveTag,
}: DraftBodyProps) {
  if (!hasEvidence && claims.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <EmptyState
          title="No observations to draft from"
          description="Write from scratch below, or ask colleagues first — a draft is only suggested when there's evidence behind it."
          action={
            <Button
              variant="ghost"
              render={<Link to="/reports/students" search={{ tab: 'gaps' }} />}
            >
              Ask colleagues
            </Button>
          }
        />
        <ClaimEditor
          claims={claims}
          onChange={onChangeClaims}
          resolveTag={resolveTag}
        />
      </div>
    )
  }

  if (status === 'confirmed') {
    return (
      <div className="flex flex-col gap-4">
        <ol className="flex flex-col gap-3">
          {claims.map((claim, index) => (
            <li key={index} className="flex flex-col gap-1.5">
              <p className="text-sm">{claim.text}</p>
              <SourceTag
                source={claim.source}
                edited={claim.edited}
                tag={
                  claim.source ? resolveTag(claim.source.tagId)?.tag : undefined
                }
                authorName={
                  claim.source
                    ? resolveTag(claim.source.tagId)?.authorName
                    : undefined
                }
                insightFact={
                  claim.source
                    ? resolveTag(claim.source.tagId)?.insightFact
                    : undefined
                }
              />
            </li>
          ))}
        </ol>
        <Button variant="outline" onClick={onReopen} className="w-fit">
          Reopen draft
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {hasEvidence && (
        <div className="flex flex-col gap-1.5">
          <Button
            type="button"
            variant={claims.length > 0 ? 'outline' : 'default'}
            onClick={onSuggestOrRegenerate}
            disabled={suggesting || suggestDisabled}
            className="w-fit"
          >
            {suggesting
              ? 'Suggesting…'
              : claims.length > 0
                ? 'Regenerate'
                : 'Suggest a draft'}
          </Button>
          {suggestDisabled && suggestHelperText && (
            <p className="text-muted-foreground text-xs">{suggestHelperText}</p>
          )}
        </div>
      )}

      <ClaimEditor
        claims={claims}
        onChange={onChangeClaims}
        resolveTag={resolveTag}
      />

      <div className="flex items-center gap-3">
        <Button
          type="button"
          onClick={onConfirm}
          disabled={!claims.some((c) => c.text.trim().length > 0)}
          title={
            claims.length > 0 && !claims.some((c) => c.text.trim().length > 0)
              ? 'Write at least one sentence before confirming'
              : undefined
          }
        >
          Confirm draft
        </Button>
        <span aria-live="polite" className="text-muted-foreground text-xs">
          {saveState === 'saved' ? 'Saved' : ''}
        </span>
      </div>
    </div>
  )
}
