import { useEffect, useMemo, useState } from 'react'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'

import type { ReportBlock, Term } from '@/types/report'
import {
  BUILT_IN_TEMPLATES,
  defaultP1Layout,
  getTemplateById,
} from '@/data/report-layouts'
import {
  CURRENT_ACADEMIC_YEAR,
  generateReportFromStudent,
} from '@/data/mock-reports'
import { mockStudents } from '@/data/mock-students'
import { useFeatureFlag } from '@/hooks/use-feature-flag'
import { useSetBreadcrumbs } from '@/hooks/use-breadcrumbs'
import { Button, buttonVariants } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select'
import { ReportPreview } from '@/components/reports/report-preview'
import { SectionLayoutEditor } from '@/components/reports/section-layout-editor'
import { loadCycle, saveCycle } from '@/lib/hdp-cycle-store'
import {
  loadTemplateLayout,
  saveTemplateLayout,
} from '@/lib/hdp-template-store'
import { cn } from '@/lib/utils'

interface LayoutSearch {
  classId?: string
  term?: Term
  mode?: 'report' | 'template'
}

export const Route = createFileRoute('/reports/cycle/layout')({
  component: CycleLayoutPage,
  validateSearch: (search: Record<string, unknown>): LayoutSearch => ({
    classId: search.classId as string | undefined,
    term: search.term as Term | undefined,
    mode: search.mode === 'template' ? 'template' : 'report',
  }),
})

function CycleLayoutPage() {
  const search = Route.useSearch()
  const navigate = useNavigate()
  const builderEnabled = useFeatureFlag('hdp-reports')
  // Template management folds under the one HDP flag; reachable via ?mode=template.
  const isTemplateMode = search.mode === 'template' && builderEnabled

  const classId = search.classId ?? 'P1-A'
  const term: Term = search.term ?? 'Term 2'

  useSetBreadcrumbs([
    { label: 'Reports', href: '/reports' },
    {
      label: isTemplateMode ? 'Edit template' : 'Set up layout',
      href: '/reports/cycle/layout',
    },
  ])

  useEffect(() => {
    document.title = isTemplateMode
      ? 'Edit template · Reports'
      : 'Set up layout · Reports'
  }, [isTemplateMode])

  const [templateId, setTemplateId] = useState(() => {
    const existingCycle = loadCycle(classId, term)
    return existingCycle?.templateId ?? BUILT_IN_TEMPLATES[0].id
  })

  // Recomputed only when the template selection changes — classId/term are fixed
  // for the lifetime of this page, so intentionally excluded from the deps list.
  const initialBlocks = useMemo<Array<ReportBlock>>(() => {
    const existingCycle = loadCycle(classId, term)
    if (existingCycle) return existingCycle.layout.blocks.map((b) => ({ ...b }))
    const saved = loadTemplateLayout(templateId)
    if (saved) return saved.blocks.map((b) => ({ ...b }))
    const tpl = getTemplateById(templateId)
    return (tpl ? tpl.layout.blocks : defaultP1Layout().blocks).map((b) => ({
      ...b,
    }))
  }, [templateId])

  const [blocks, setBlocks] = useState<Array<ReportBlock>>(initialBlocks)

  // Sample student from the class, used only to preview the layout.
  const sampleStudent = useMemo(
    () =>
      mockStudents.find((s) => s.class === classId) ??
      mockStudents.find((s) => s.class.startsWith('P')),
    [classId],
  )

  const previewReport = useMemo(() => {
    if (!sampleStudent) return null
    return generateReportFromStudent(sampleStudent, term, CURRENT_ACADEMIC_YEAR)
  }, [sampleStudent, term])

  if (!builderEnabled) {
    return (
      <main className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">Report Builder is off</h1>
        <p className="text-muted-foreground text-sm">
          Turn on “HDP Report Builder” to use this page.
        </p>
        <Link
          to="/flags"
          className={cn(buttonVariants({ variant: 'outline' }))}
        >
          Open feature flags
        </Link>
      </main>
    )
  }

  function move(index: number, dir: -1 | 1) {
    const ordered = [...blocks].sort((a, b) => a.order - b.order)
    const target = index + dir
    if (target < 0 || target >= ordered.length) return
    ;[ordered[index], ordered[target]] = [ordered[target], ordered[index]]
    setBlocks(ordered.map((b, i) => ({ ...b, order: i })))
  }

  function toggle(key: string) {
    setBlocks((prev) =>
      prev.map((b) => (b.key === key ? { ...b, enabled: !b.enabled } : b)),
    )
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

  function handleSaveTemplate() {
    saveTemplateLayout(templateId, { blocks })
    toast.success('Template saved for everyone who uses it')
  }

  function handleSaveAndContinue() {
    const existingCycle = loadCycle(classId, term)
    saveCycle({
      classId,
      term,
      academicYear: CURRENT_ACADEMIC_YEAR,
      templateId,
      layout: { blocks },
      perStudent: existingCycle?.perStudent ?? {},
      updatedAt: new Date().toISOString(),
    })
    toast.success('Layout saved')
    navigate({ to: '/reports', search: { classId, term } as never })
  }

  const contextLine = isTemplateMode
    ? 'P1 Holistic Development'
    : `${classId} · ${term}`

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col">
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
                {isTemplateMode ? 'Edit template' : 'Set up layout'}
              </h1>
              {isTemplateMode && (
                <span className="bg-amber-3 text-amber-11 rounded-full px-2 py-0.5 text-xs font-medium">
                  Editing the shared template
                </span>
              )}
            </div>
            <p className="text-muted-foreground text-sm">{contextLine}</p>
          </div>
          <div className="flex items-center gap-2">
            {isTemplateMode ? (
              <Button onClick={handleSaveTemplate}>Save template</Button>
            ) : (
              <Button onClick={handleSaveAndContinue}>Save & continue</Button>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 p-6 lg:flex-row lg:items-start">
        {/* Controls */}
        <section
          aria-label="Report sections"
          className="flex w-full flex-col gap-4 lg:max-w-sm"
        >
          <div className="space-y-1.5">
            <Label htmlFor="template-select">Template</Label>
            <Select
              value={templateId}
              onValueChange={(v) => v && setTemplateId(v)}
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
                : 'You’re adjusting this class’s layout only — the template stays the same.'}
            </p>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium">Sections</h2>
            <Button variant="ghost" size="sm" onClick={resetToTemplate}>
              Reset to template
            </Button>
          </div>

          <SectionLayoutEditor
            blocks={blocks}
            onToggle={toggle}
            onMove={move}
          />
        </section>

        {/* Preview */}
        <section aria-label="Live preview" className="w-full flex-1">
          <div className="bg-card rounded-xl border p-6 shadow-sm">
            <p className="text-muted-foreground mb-4 text-xs">
              {sampleStudent
                ? `Previewing with ${sampleStudent.name}’s data`
                : 'Live preview'}
            </p>
            {previewReport && (
              <ReportPreview
                report={previewReport}
                blocks={blocks}
                comments={previewReport.teacherComments ?? ''}
              />
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
