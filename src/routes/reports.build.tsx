import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  AlertCircle,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Check,
  Copy,
  FileText,
  GripVertical,
  Loader2,
  Send,
  Share2,
} from 'lucide-react'
import { toast } from 'sonner'

import type {
  HolisticReport,
  ReportBlock,
  ReportBlockViz,
  Term,
} from '@/types/report'
import type { SectionDef } from '@/data/report-layouts'
import {
  BUILT_IN_TEMPLATES,
  P1_SECTION_DEFS,
  defaultP1Layout,
  getTemplateById,
} from '@/data/report-layouts'
import {
  CURRENT_ACADEMIC_YEAR,
  addReport,
  generateReportFromStudent,
} from '@/data/mock-reports'
import {
  getSchoolLevel,
  getStudentById,
  mockStudents,
} from '@/data/mock-students'
import { useFeatureFlag } from '@/hooks/use-feature-flag'
import { useSetBreadcrumbs } from '@/hooks/use-breadcrumbs'
import { Button, buttonVariants } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { ReportPreview } from '@/components/reports/report-preview'
import {
  loadTemplateLayout,
  saveShareMessage,
  saveSharedReport,
  saveTemplateLayout,
} from '@/lib/hdp-template-store'
import { cn } from '@/lib/utils'

interface BuildSearch {
  studentId?: string
  term?: Term
  templateId?: string
  mode?: 'report' | 'template'
  /** Demo-only hook to force the error state for CMP-3 evidence. */
  fail?: boolean
}

export const Route = createFileRoute('/reports/build')({
  component: ReportBuilderPage,
  validateSearch: (search: Record<string, unknown>): BuildSearch => ({
    studentId: search.studentId as string | undefined,
    term: search.term as Term | undefined,
    templateId: search.templateId as string | undefined,
    mode: search.mode === 'template' ? 'template' : 'report',
    fail: search.fail === '1' || search.fail === 1 || search.fail === true,
  }),
})

const VIZ_LABEL: Record<ReportBlockViz, string> = {
  bar: 'Bars',
  table: 'Table',
  progress: 'Progress',
  line: 'Line',
}

function firstPrimaryStudentId(): string | undefined {
  return mockStudents.find((s) => getSchoolLevel(s.class) === 'primary')?.id
}

function ReportBuilderPage() {
  const search = Route.useSearch()
  const navigate = useNavigate()
  const builderEnabled = useFeatureFlag('hdp-report-builder')
  const templateAdminEnabled = useFeatureFlag('hdp-template-admin')
  const isTemplateMode = search.mode === 'template' && templateAdminEnabled

  useSetBreadcrumbs([
    { label: 'Reports', href: '/reports' },
    {
      label: isTemplateMode ? 'Edit template' : 'Report Builder',
      href: '/reports/build',
    },
  ])

  useEffect(() => {
    document.title = isTemplateMode
      ? 'Edit template · Reports'
      : 'Report Builder · Reports'
  }, [isTemplateMode])

  const studentId = search.studentId ?? firstPrimaryStudentId()
  const student = studentId ? getStudentById(studentId) : undefined
  const term: Term = search.term ?? 'Term 2'

  const report = useMemo<HolisticReport | null>(() => {
    if (!student) return null
    return generateReportFromStudent(student, term, CURRENT_ACADEMIC_YEAR)
  }, [student, term])

  const [templateId, setTemplateId] = useState(
    search.templateId ?? BUILT_IN_TEMPLATES[0]?.id ?? 'p1-default',
  )

  const initialBlocks = useMemo<Array<ReportBlock>>(() => {
    const saved = loadTemplateLayout(templateId)
    if (saved) return saved.blocks.map((b) => ({ ...b }))
    const tpl = getTemplateById(templateId)
    return (tpl ? tpl.layout.blocks : defaultP1Layout().blocks).map((b) => ({
      ...b,
    }))
  }, [templateId])

  const [blocks, setBlocks] = useState<Array<ReportBlock>>(initialBlocks)
  const [comments, setComments] = useState('')
  const [genState, setGenState] = useState<'idle' | 'loading' | 'error'>('idle')
  const [shareOpen, setShareOpen] = useState(false)
  const [shareState, setShareState] = useState<'idle' | 'loading' | 'sent'>(
    'idle',
  )
  const [message, setMessage] = useState('')
  const errorRef = useRef<HTMLDivElement>(null)

  // Focus must move after the error banner renders (A11Y-11 focus-move channel).
  useEffect(() => {
    if (genState === 'error') errorRef.current?.focus()
  }, [genState])

  if (!builderEnabled) {
    return (
      <main className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">Report Builder is off</h1>
        <p className="text-muted-foreground text-sm">
          Turn on “HDP Report Builder” to use this page.
        </p>
        <Link to="/flags" className={cn(buttonVariants({ variant: 'outline' }))}>
          Open feature flags
        </Link>
      </main>
    )
  }

  if (!report || !student) {
    return (
      <main className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">No student selected</h1>
        <p className="text-muted-foreground text-sm">
          Pick a student from the Reports page to build a report.
        </p>
        <Link to="/reports" className={cn(buttonVariants())}>
          Back to Reports
        </Link>
      </main>
    )
  }

  const orderedBlocks = [...blocks].sort((a, b) => a.order - b.order)
  const defById = new Map<string, SectionDef>(
    P1_SECTION_DEFS.map((d) => [d.key, d]),
  )

  function move(index: number, dir: -1 | 1) {
    const next = [...orderedBlocks]
    const target = index + dir
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    setBlocks(next.map((b, i) => ({ ...b, order: i })))
  }

  function toggle(key: string) {
    setBlocks((prev) =>
      prev.map((b) => (b.key === key ? { ...b, enabled: !b.enabled } : b)),
    )
  }

  function setViz(key: string, viz: ReportBlockViz) {
    setBlocks((prev) => prev.map((b) => (b.key === key ? { ...b, viz } : b)))
  }

  function resetToTemplate() {
    const tpl = getTemplateById(templateId)
    setBlocks(
      (tpl ? tpl.layout.blocks : defaultP1Layout().blocks).map((b) => ({
        ...b,
      })),
    )
    toast.success('Reset to template')
  }

  function commit(): HolisticReport {
    const built: HolisticReport = {
      ...report!,
      layout: { blocks },
      teacherComments: comments || report!.teacherComments,
    }
    addReport(built)
    saveSharedReport(built.id, {
      blocks,
      comments: comments || report!.teacherComments || '',
    })
    return built
  }

  function handleGenerate() {
    setGenState('loading')
    window.setTimeout(() => {
      if (search.fail) {
        setGenState('error')
        return
      }
      const built = commit()
      toast.success('Report generated')
      navigate({ to: '/reports/$id', params: { id: built.id } })
    }, 600)
  }

  function handleSaveTemplate() {
    saveTemplateLayout(templateId, { blocks })
    toast.success('Template saved for everyone who uses it')
  }

  const shareLink =
    typeof window !== 'undefined'
      ? `${window.location.origin}/report-view/${report.id}`
      : `/report-view/${report.id}`

  function handleCopyLink() {
    navigator.clipboard?.writeText(shareLink)
    toast.success('Link copied')
  }

  function handleShare() {
    setShareState('loading')
    window.setTimeout(() => {
      const built = commit() // commit so the parent link resolves
      saveShareMessage(built.id, message)
      setShareState('sent')
      toast.success('Shared with parents')
    }, 600)
  }

  const contextLine = isTemplateMode
    ? 'P1 Holistic Development'
    : `${student.name} · ${student.class} · ${term}`

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col">
      {/* Header */}
      <header className="shrink-0 border-b px-6 py-4">
        <div className="flex items-center gap-4">
          <Link
            to="/reports"
            aria-label="Back to Reports"
            className={buttonVariants({ variant: 'ghost', size: 'icon' })}
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold">
                {isTemplateMode ? 'Edit template' : 'Report Builder'}
              </h1>
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-xs font-medium',
                  isTemplateMode
                    ? 'bg-amber-3 text-amber-11'
                    : 'bg-secondary text-secondary-foreground',
                )}
              >
                {isTemplateMode
                  ? 'Editing the shared template'
                  : 'Editing this report'}
              </span>
            </div>
            <p className="text-muted-foreground text-sm">{contextLine}</p>
          </div>
          <div className="flex items-center gap-2">
            {isTemplateMode ? (
              <Button onClick={handleSaveTemplate}>Save template</Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => setShareOpen(true)}>
                  <Share2 className="mr-2 size-4" />
                  Share
                </Button>
                <Button
                  onClick={handleGenerate}
                  disabled={genState === 'loading'}
                >
                  {genState === 'loading' ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <FileText className="mr-2 size-4" />
                  )}
                  {genState === 'loading'
                    ? 'Generating report…'
                    : 'Generate report'}
                </Button>
              </>
            )}
          </div>
        </div>
        {genState === 'error' && (
          <div
            ref={errorRef}
            tabIndex={-1}
            className="border-destructive/40 bg-destructive/5 text-destructive focus-visible:ring-destructive/50 mt-3 flex items-start gap-2 rounded-lg border px-3 py-2 text-sm outline-none focus-visible:ring-2"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>
              Couldn’t generate {student.name}’s report. Check the student’s data
              and try again.
            </span>
          </div>
        )}
      </header>

      {/* Split view: controls + live preview */}
      <div className="grid flex-1 gap-6 p-6 lg:grid-cols-[minmax(300px,360px)_1fr] lg:items-start">
        {/* Left — controls */}
        <section aria-label="Report sections" className="flex flex-col gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="template-select">Template</Label>
            <Select
              value={templateId}
              onValueChange={(v) => v && setTemplateId(v as string)}
            >
              <SelectTrigger id="template-select" className="w-full">
                {getTemplateById(templateId)?.name ?? 'P1 Holistic Development'}
              </SelectTrigger>
              <SelectContent>
                {BUILT_IN_TEMPLATES.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-muted-foreground text-xs">
              Built-in template.{' '}
              {isTemplateMode
                ? 'Changes here update the shared definition.'
                : 'You’re adjusting this report only — the template stays the same.'}
            </p>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium">Sections</h2>
            <Button variant="ghost" size="sm" onClick={resetToTemplate}>
              Reset to template
            </Button>
          </div>

          <ul className="flex flex-col gap-2">
            {orderedBlocks.map((b, i) => {
              const def = defById.get(b.key)
              if (!def) return null
              const naAtP1 = def.applicableAtP1 === false
              return (
                <li
                  key={b.key}
                  className={cn(
                    'rounded-lg border px-3 py-2.5',
                    b.enabled ? 'bg-card' : 'bg-muted/30',
                  )}
                >
                  <div className="flex items-center gap-2">
                    <GripVertical
                      aria-hidden
                      className="text-muted-foreground/60 size-4 shrink-0"
                    />
                    <Checkbox
                      checked={def.required ? true : b.enabled}
                      disabled={def.required}
                      aria-label={`Include ${def.label}`}
                      onCheckedChange={() => !def.required && toggle(b.key)}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-sm font-medium">
                          {def.label}
                        </span>
                        {def.required && (
                          <span className="text-muted-foreground text-[11px]">
                            Required
                          </span>
                        )}
                        {naAtP1 && (
                          <span className="text-muted-foreground text-[11px]">
                            Not applicable at P1
                          </span>
                        )}
                      </div>
                      <p className="text-muted-foreground truncate text-xs">
                        {def.description}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Move ${def.label} up`}
                        disabled={i === 0}
                        onClick={() => move(i, -1)}
                      >
                        <ArrowUp className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Move ${def.label} down`}
                        disabled={i === orderedBlocks.length - 1}
                        onClick={() => move(i, 1)}
                      >
                        <ArrowDown className="size-4" />
                      </Button>
                    </div>
                  </div>
                  {def.vizOptions && b.enabled && (
                    <div className="mt-2 flex items-center gap-2 pl-6">
                      <Label
                        htmlFor={`viz-${b.key}`}
                        className="text-muted-foreground text-xs"
                      >
                        View
                      </Label>
                      <Select
                        value={b.viz ?? def.vizOptions[0]}
                        onValueChange={(v) =>
                          v && setViz(b.key, v as ReportBlockViz)
                        }
                      >
                        <SelectTrigger id={`viz-${b.key}`} size="sm">
                          {VIZ_LABEL[b.viz ?? def.vizOptions[0]]}
                        </SelectTrigger>
                        <SelectContent>
                          {def.vizOptions.map((v) => (
                            <SelectItem key={v} value={v}>
                              {VIZ_LABEL[v]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </section>

        {/* Right — live preview */}
        <section aria-label="Live preview" className="lg:sticky lg:top-6">
          <div className="bg-card rounded-xl border p-6 shadow-sm">
            <p className="text-muted-foreground mb-4 text-xs">Live preview</p>
            <ReportPreview
              report={report}
              blocks={blocks}
              editable
              comments={comments}
              onCommentsChange={setComments}
            />
          </div>
        </section>
      </div>

      {/* Share sheet — parents-first */}
      <Sheet open={shareOpen} onOpenChange={setShareOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Share with parents</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-4 px-6 pb-6">
            <p className="text-muted-foreground text-sm">
              Parents open a private link to view {student.name}’s report on
              Parents Gateway.
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="share-link">Report link</Label>
              <div className="flex items-center gap-2">
                <Input id="share-link" readOnly value={shareLink} />
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Copy link"
                  onClick={handleCopyLink}
                >
                  <Copy className="size-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="share-message">Personal message (optional)</Label>
              <Textarea
                id="share-message"
                placeholder="Add a short note for the parent…"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
              />
            </div>
            {shareState === 'sent' ? (
              <div className="bg-lime-3 text-lime-11 flex items-center gap-2 rounded-lg px-3 py-2 text-sm">
                <Check className="size-4" />
                Shared with parents
              </div>
            ) : (
              <Button onClick={handleShare} disabled={shareState === 'loading'}>
                {shareState === 'loading' ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Send className="mr-2 size-4" />
                )}
                {shareState === 'loading' ? 'Sharing…' : 'Share with parents'}
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
