import { useEffect, useMemo, useState } from 'react'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Bookmark, LayoutTemplate, Smartphone } from 'lucide-react'
import { toast } from 'sonner'

import type { ReportBlock, ReportLayout, Term } from '@/types/report'
import type { CustomTemplate } from '@/lib/hdp-template-store'
import {
  BUILT_IN_TEMPLATES,
  P1_SECTION_DEFS,
  defaultP1Layout,
  getTemplateById,
} from '@/data/report-layouts'
import {
  CURRENT_ACADEMIC_YEAR,
  CURRENT_TERM,
  generateReportFromStudent,
} from '@/data/mock-reports'
import { SAMPLE_PREVIEW_PUPIL } from '@/data/mock-report-classes'
import { useFeatureFlag } from '@/hooks/use-feature-flag'
import { useSetBreadcrumbs } from '@/hooks/use-breadcrumbs'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
} from '@/components/ui/select'
import { ReportPreview } from '@/components/reports/report-preview'
import { PgReportPreviewDialog } from '@/components/reports/pg-report-preview-dialog'
import { SectionLayoutEditor } from '@/components/reports/section-layout-editor'
import { loadCycle, saveCycle } from '@/lib/hdp-cycle-store'
import {
  listCustomTemplates,
  loadTemplateLayout,
  saveCustomTemplate,
  saveTemplateLayout,
} from '@/lib/hdp-template-store'
import { cn } from '@/lib/utils'

interface LayoutSearch {
  classId?: string
  term?: Term
  mode?: 'report' | 'template'
  /** Which scope the teacher navigated from — only a Level scope (e.g. "All
   * Primary 1") carries edit rights; a form class can view but not touch the
   * layout, simulating that only the Level Head may edit it. */
  scope?: 'class' | 'level'
}

/** The Template `Select`'s option list — shared between the main editor and
 * the "choose a template to get started" empty state below, so the two
 * never drift out of sync. */
function TemplateSelectOptions({
  customTemplates,
}: {
  customTemplates: Array<CustomTemplate>
}) {
  return (
    <>
      <SelectGroup>
        <SelectLabel>School templates</SelectLabel>
        {BUILT_IN_TEMPLATES.map((t) => (
          <SelectItem key={t.id} value={t.id}>
            {t.name}
          </SelectItem>
        ))}
      </SelectGroup>
      {customTemplates.length > 0 && (
        <>
          <SelectSeparator />
          <SelectGroup>
            <SelectLabel>My templates</SelectLabel>
            {customTemplates.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectGroup>
        </>
      )}
    </>
  )
}

export const Route = createFileRoute('/reports/cycle/layout')({
  component: CycleLayoutPage,
  validateSearch: (search: Record<string, unknown>): LayoutSearch => ({
    classId: search.classId as string | undefined,
    term: search.term as Term | undefined,
    mode: search.mode === 'template' ? 'template' : 'report',
    scope: search.scope === 'level' ? 'level' : 'class',
  }),
})

function CycleLayoutPage() {
  const search = Route.useSearch()
  const navigate = useNavigate()
  const builderEnabled = useFeatureFlag('hdp-reports')
  // Template management folds under the one HDP flag; reachable via ?mode=template.
  const isTemplateMode = search.mode === 'template' && builderEnabled
  // Editing is Level-scoped only — a form teacher can look but not touch.
  const editable = isTemplateMode || search.scope === 'level'

  const classId = search.classId ?? 'P1-A'
  const term: Term = search.term ?? CURRENT_TERM

  useSetBreadcrumbs([
    { label: 'Reports', href: '/reports' },
    {
      label: isTemplateMode
        ? 'Edit template'
        : editable
          ? 'Set up layout'
          : 'View layout',
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
  const [customTemplates, setCustomTemplates] = useState<Array<CustomTemplate>>(
    [],
  )
  useEffect(() => {
    setCustomTemplates(listCustomTemplates())
  }, [])

  function resolveTemplateLayout(id: string): ReportLayout {
    const custom = listCustomTemplates().find((t) => t.id === id)
    if (custom) return custom.layout
    const saved = loadTemplateLayout(id)
    if (saved) return saved
    const tpl = getTemplateById(id)
    return tpl ? tpl.layout : defaultP1Layout()
  }

  const [blocks, setBlocks] = useState<Array<ReportBlock>>(() => {
    const existingCycle = loadCycle(classId, term)
    if (existingCycle) return existingCycle.layout.blocks.map((b) => ({ ...b }))
    const saved = loadTemplateLayout(BUILT_IN_TEMPLATES[0].id)
    if (saved) return saved.blocks.map((b) => ({ ...b }))
    return defaultP1Layout().blocks.map((b) => ({ ...b }))
  })

  // Working copy vs the picked template — drives the "Edited" indicator and
  // makes Reset/Save-as-template relevant exactly when they should be.
  const normalize = (list: Array<ReportBlock>) =>
    JSON.stringify(
      [...list]
        .sort((a, b) => a.order - b.order)
        .map((b) => ({ key: b.key, enabled: b.enabled })),
    )
  const isEdited =
    normalize(blocks) !== normalize(resolveTemplateLayout(templateId).blocks)

  const templateName =
    getTemplateById(templateId)?.name ??
    customTemplates.find((t) => t.id === templateId)?.name ??
    'Primary Holistic Development'

  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false)
  const [newTemplateName, setNewTemplateName] = useState('')
  const [pgPreviewOpen, setPgPreviewOpen] = useState(false)

  // Level scope is where a layout is genuinely configured for the first
  // time (form-class visits always land on an auto-provisioned cycle — see
  // ensureCycle in hdp-cycle-store.ts), so gate on a conscious template pick
  // rather than silently defaulting to the first built-in template. Only for
  // visitors who can actually edit — a view-only teacher (e.g. a sibling
  // class's "View layout") must never be asked to set anything up.
  const hasExistingCycle = useMemo(
    () => loadCycle(classId, term) !== null,
    [classId, term],
  )
  const [templateChosen, setTemplateChosen] = useState(false)
  const [gatePick, setGatePick] = useState('')
  const showTemplateGate =
    editable && !isTemplateMode && !hasExistingCycle && !templateChosen

  // The preview always uses the fictional sample pupil — never a real child,
  // whose results may not be entered yet. Class follows the page so the
  // document header reads correctly.
  const previewReport = useMemo(
    () =>
      generateReportFromStudent(
        { ...SAMPLE_PREVIEW_PUPIL, class: classId },
        term,
        CURRENT_ACADEMIC_YEAR,
      ),
    [classId, term],
  )

  const contextLine = isTemplateMode
    ? 'Primary Holistic Development'
    : `${classId} · ${term}`

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

  if (showTemplateGate) {
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
              <h1 className="text-lg font-semibold">Set up layout</h1>
              <p className="text-muted-foreground text-sm">{contextLine}</p>
            </div>
          </div>
        </header>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
          <div className="bg-muted flex size-12 items-center justify-center rounded-full">
            <LayoutTemplate className="text-muted-foreground size-6" />
          </div>
          <h2 className="text-lg font-semibold">
            Choose a template to get started
          </h2>
          <p className="text-muted-foreground text-sm">
            Pick a starting point for this level's report layout — you can
            customise sections and ordering after.
          </p>
          <div className="w-full space-y-1.5 text-left">
            <Label htmlFor="gate-template-select">Template</Label>
            <Select value={gatePick} onValueChange={(v) => v && setGatePick(v)}>
              <SelectTrigger id="gate-template-select" className="w-full">
                {BUILT_IN_TEMPLATES.find((t) => t.id === gatePick)?.name ??
                  customTemplates.find((t) => t.id === gatePick)?.name ??
                  'Select a template'}
              </SelectTrigger>
              <SelectContent>
                <TemplateSelectOptions customTemplates={customTemplates} />
              </SelectContent>
            </Select>
          </div>
          <Button
            className="w-full"
            disabled={!gatePick}
            onClick={() => chooseTemplateAndContinue(gatePick)}
          >
            Continue
          </Button>
        </div>
      </div>
    )
  }

  // Required sections (pupil particulars) are pinned in place — neither they
  // nor their neighbours may move across them.
  const requiredKeys = new Set(
    P1_SECTION_DEFS.filter((d) => d.required).map((d) => d.key),
  )

  function move(index: number, dir: -1 | 1) {
    const ordered = [...blocks].sort((a, b) => a.order - b.order)
    const target = index + dir
    if (target < 0 || target >= ordered.length) return
    if (
      requiredKeys.has(ordered[index].key) ||
      requiredKeys.has(ordered[target].key)
    ) {
      return
    }
    ;[ordered[index], ordered[target]] = [ordered[target], ordered[index]]
    setBlocks(ordered.map((b, i) => ({ ...b, order: i })))
  }

  function toggle(key: string) {
    const wasEnabled = blocks.find((b) => b.key === key)?.enabled ?? false
    setBlocks((prev) =>
      prev.map((b) => (b.key === key ? { ...b, enabled: !b.enabled } : b)),
    )
    // When a section is turned ON, bring it into view in the preview and flash
    // it — on narrow screens the preview sits below the fold, so a bare toggle
    // otherwise gives no visible feedback. Double rAF waits for React to commit.
    if (!wasEnabled) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const el = document.querySelector(`[data-section-key="${key}"]`)
          if (!(el instanceof HTMLElement)) return
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
          el.classList.add(
            'ring-2',
            'ring-primary/40',
            'rounded-lg',
            'transition-shadow',
          )
          window.setTimeout(() => {
            el.classList.remove('ring-2', 'ring-primary/40')
          }, 1200)
        })
      })
    }
  }

  function reorder(key: string, toIndex: number) {
    if (requiredKeys.has(key)) return
    setBlocks((prev) => {
      const ordered = [...prev].sort((a, b) => a.order - b.order)
      const fromIndex = ordered.findIndex((b) => b.key === key)
      if (fromIndex === -1 || fromIndex === toIndex) return prev
      if (toIndex <= 0 && requiredKeys.has(ordered[0].key)) return prev
      const [moved] = ordered.splice(fromIndex, 1)
      ordered.splice(toIndex, 0, moved)
      return ordered.map((b, i) => ({ ...b, order: i }))
    })
  }

  function handleTemplateChange(id: string) {
    setTemplateId(id)
    setBlocks(resolveTemplateLayout(id).blocks.map((b) => ({ ...b })))
  }

  function chooseTemplateAndContinue(id: string) {
    handleTemplateChange(id)
    setTemplateChosen(true)
  }

  function resetToTemplate() {
    setBlocks(resolveTemplateLayout(templateId).blocks.map((b) => ({ ...b })))
    toast.success('Reset to template')
  }

  function handleSaveAsTemplate() {
    const name = newTemplateName.trim()
    if (!name) return
    const saved = saveCustomTemplate(name, { blocks })
    setCustomTemplates(listCustomTemplates())
    setTemplateId(saved.id)
    setSaveTemplateOpen(false)
    setNewTemplateName('')
    toast.success(`Template "${saved.name}" saved`)
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
                {isTemplateMode
                  ? 'Edit template'
                  : editable
                    ? 'Set up layout'
                    : 'View layout'}
              </h1>
              {isTemplateMode && (
                <span className="bg-amber-3 text-amber-11 rounded-full px-2 py-0.5 text-xs font-medium">
                  Editing the shared template
                </span>
              )}
              {!isTemplateMode && !editable && (
                <span
                  className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs font-medium"
                  title="Only editable from a Level scope (e.g. All Primary 1)"
                >
                  Level Head only to edit
                </span>
              )}
            </div>
            <p className="text-muted-foreground text-sm">{contextLine}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPgPreviewOpen(true)}
            >
              <Smartphone className="mr-1.5 size-3.5" />
              Preview in Parents Gateway
            </Button>
            {isTemplateMode ? (
              <Button onClick={handleSaveTemplate}>Save template</Button>
            ) : (
              <Button
                onClick={handleSaveAndContinue}
                disabled={!editable}
                title={
                  editable
                    ? undefined
                    : 'Only a Level Head can edit this layout'
                }
              >
                Save & continue
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 p-6 lg:flex-row lg:items-start">
        {/* Controls */}
        <section
          aria-label="Report sections"
          className="flex w-full flex-col gap-4 lg:max-w-md"
        >
          {!isTemplateMode && !editable && (
            <p className="bg-muted text-muted-foreground rounded-lg px-3 py-2 text-xs">
              You can view this class’s layout, but only a Level Head can
              change it — switch to a Level scope (e.g. All Primary 1) to
              edit.
            </p>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="template-select">Template</Label>
            <Select
              value={templateId}
              onValueChange={(v) => v && handleTemplateChange(v)}
              disabled={!editable}
            >
              <SelectTrigger id="template-select" className="w-full">
                {templateName}
              </SelectTrigger>
              <SelectContent>
                <TemplateSelectOptions customTemplates={customTemplates} />
              </SelectContent>
            </Select>
            {isTemplateMode ? (
              <p className="text-muted-foreground text-xs">
                Changes here update the shared definition.
              </p>
            ) : isEdited ? (
              <p className="text-primary text-xs">
                Edited — differs from template
              </p>
            ) : editable ? (
              <p className="text-muted-foreground text-xs">
                You’re adjusting this class’s layout only — the template stays
                the same.
              </p>
            ) : null}
          </div>

          <Separator />

          <h2 className="text-sm font-medium">Sections</h2>

          <SectionLayoutEditor
            blocks={blocks}
            onToggle={toggle}
            onMove={move}
            onReorder={reorder}
            disabled={!editable}
          />

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              disabled={!editable || !isEdited}
              onClick={resetToTemplate}
            >
              Reset to template
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              disabled={!editable || !isEdited}
              onClick={() => setSaveTemplateOpen(true)}
            >
              <Bookmark className="mr-1.5 size-3.5" />
              Save as template
            </Button>
          </div>
        </section>

        {/* Preview — sticky on wide screens so toggle feedback stays visible. */}
        <section
          aria-label="Live preview"
          className="w-full flex-1 lg:sticky lg:top-4 lg:max-h-[calc(100vh-5rem)] lg:overflow-y-auto"
        >
          <div className="p-6">
            <p className="text-muted-foreground mb-4 text-xs">
              Previewing with sample data — not a real pupil. Real results
              appear when you write each report.
            </p>
            <ReportPreview
              report={previewReport}
              blocks={blocks}
              comments={previewReport.teacherComments ?? ''}
              showMissingData
            />
          </div>
        </section>
      </div>

      <PgReportPreviewDialog
        report={previewReport}
        blocks={blocks}
        comments={previewReport.teacherComments ?? ''}
        open={pgPreviewOpen}
        onOpenChange={setPgPreviewOpen}
      />

      <Dialog open={saveTemplateOpen} onOpenChange={setSaveTemplateOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Save as template</DialogTitle>
            <DialogDescription>
              Saves the current sections, order, and display choices so you can
              reuse them for other classes and terms.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="new-template-name">Template name</Label>
            <Input
              id="new-template-name"
              value={newTemplateName}
              onChange={(e) => setNewTemplateName(e.target.value)}
              placeholder="P1 Semester 1 layout"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveAsTemplate()
              }}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSaveTemplateOpen(false)}
            >
              Cancel
            </Button>
            <Button
              disabled={!newTemplateName.trim()}
              onClick={handleSaveAsTemplate}
            >
              Save template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
