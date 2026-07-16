import * as React from 'react'
import { Link } from '@tanstack/react-router'
import { toast } from 'sonner'
import { ClaimEditor } from './claim-editor'
import { SourceTag } from './source-tag'
import { StudentRiver } from './student-river'
import type { DraftClaim, HdpTag } from '@/types/hdp'
import { getStudentById } from '@/data/mock-students'
import { MOCK_STAFF } from '@/data/mock-staff'
import { CURRENT_TEACHER } from '@/data/hdp'
import { TIMETABLE } from '@/data/timetable'
import {
  confirmDraft,
  detectFormingPatterns,
  draftId,
  findDraft,
  reopenDraft,
  saveDraft,
  seedIfEmpty,
  tagsForStudent,
  tagsForStudentVisible,
} from '@/lib/hdp-store'
import { composeDraft } from '@/lib/hdp-draft-compose'
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

interface DraftStudioProps {
  studentId: string
}

// The right-hand drafting surface of /reports/drafts/$studentId — a kind
// switcher over a claim editor, backed by composeDraft (mock Smart Compose)
// and hdp-store's draft persistence. The left-hand evidence column
// (StudentRiver) is rendered by this same component so the kind switch can
// keep both columns in sync.
export function DraftStudio({ studentId }: DraftStudioProps) {
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
  const [saveState, setSaveState] = React.useState<'idle' | 'saved'>('idle')
  const [mounted, setMounted] = React.useState(false)
  const [visibleTags, setVisibleTags] = React.useState<Array<HdpTag>>([])

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
      return
    }
    const existing = findDraft(
      studentId,
      kind,
      kind === 'subject' ? subject : undefined,
    )
    setClaims(existing?.claims ?? [])
    setStatus(existing?.status ?? 'draft')
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
  const hasEdits = claims.some((c) => c.edited || !c.source)
  const currentDraftId = draftId(
    studentId,
    kind,
    kind === 'subject' ? subject : undefined,
  )

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
      })
      setSaveState('saved')
    }, AUTOSAVE_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [claims, mounted, status, currentDraftId, studentId, kind, subject])

  function runCompose() {
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

  function handleConfirmDraft() {
    saveDraft({
      id: currentDraftId,
      studentId,
      kind,
      subject: kind === 'subject' ? subject : undefined,
      authorId: CURRENT_TEACHER.id,
      claims,
      status: 'draft',
    })
    confirmDraft(currentDraftId)
    setStatus('confirmed')
    setConfirmDialogOpen(false)
    toast.success('Draft confirmed')
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
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      <div className="min-w-0">
        <StudentRiver
          studentId={studentId}
          viewerId={CURRENT_TEACHER.id}
          fullRiver={kind === 'overall'}
          embedded
        />
      </div>

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

        <DraftBody
          hasEvidence={hasEvidence}
          claims={claims}
          status={status}
          suggesting={suggesting}
          saveState={saveState}
          onChangeClaims={(next) => {
            setSaveState('idle')
            setClaims(next)
          }}
          onSuggestOrRegenerate={handleSuggestOrRegenerate}
          onConfirm={() => setConfirmDialogOpen(true)}
          onReopen={handleReopenDraft}
          resolveTag={(tagId) => {
            const tag = tagsById.get(tagId)
            return tag
              ? { tag, authorName: staffName(tag.authorId) }
              : undefined
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
            <AlertDialogAction onClick={handleConfirmDraft}>
              Confirm draft
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
  onChangeClaims: (claims: Array<DraftClaim>) => void
  onSuggestOrRegenerate: () => void
  onConfirm: () => void
  onReopen: () => void
  resolveTag: (tagId: string) => { tag: HdpTag; authorName: string } | undefined
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
            <Button variant="ghost" render={<Link to="/reports/broadcast" />}>
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
        <Button
          type="button"
          variant={claims.length > 0 ? 'outline' : 'default'}
          onClick={onSuggestOrRegenerate}
          disabled={suggesting}
          className="w-fit"
        >
          {suggesting
            ? 'Suggesting…'
            : claims.length > 0
              ? 'Regenerate'
              : 'Suggest a draft'}
        </Button>
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
          disabled={claims.length === 0}
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
