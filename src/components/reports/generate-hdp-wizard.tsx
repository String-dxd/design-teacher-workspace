import { useEffect, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import {
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  Save,
  X,
} from 'lucide-react'
import { HdpTemplateStep, TEMPLATES } from './hdp-template-step'
import { HdpDataStep } from './hdp-data-step'
import { HdpPreviewStep } from './hdp-preview-step'
import type { Student } from '@/types/student'
import type { HolisticReport, Term } from '@/types/report'
import type { TemplateId } from './hdp-template-step'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  CURRENT_ACADEMIC_YEAR,
  addReport,
  generateReportFromStudent,
} from '@/data/mock-reports'
import { getSchoolLevel } from '@/data/mock-students'

const STEPS = ['Template', 'Selection', 'Preview', 'Save']

const DEFAULT_SECTIONS: Record<string, boolean> = {
  studentInfo: true,
  attendance: true,
  academic: true,
  teacherComments: true,
  coreValues: true,
  physicalFitness: true,
  via: true,
  cca: true,
}

interface GenerateHdpWizardProps {
  student: Student
  missingTerms: Array<Term>
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function GenerateHdpWizard({
  student,
  missingTerms,
  open,
  onOpenChange,
}: GenerateHdpWizardProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId | null>(
    null,
  )
  const [selectedTerm, setSelectedTerm] = useState<Term>(missingTerms[0])
  const [selectedSections, setSelectedSections] =
    useState<Record<string, boolean>>(DEFAULT_SECTIONS)
  const [generatedReport, setGeneratedReport] = useState<HolisticReport | null>(
    null,
  )
  const [isSaved, setIsSaved] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const schoolLevel = getSchoolLevel(student.class)

  // Reset state when closed
  useEffect(() => {
    if (!open) {
      setCurrentStep(0)
      setSelectedTemplate(null)
      setSelectedTerm(missingTerms[0])
      setSelectedSections(DEFAULT_SECTIONS)
      setGeneratedReport(null)
      setIsSaved(false)
    }
  }, [open, missingTerms])

  // Scroll to top on step change
  useEffect(() => {
    scrollRef.current?.scrollTo(0, 0)
  }, [currentStep])

  function handleSelectTemplate(id: TemplateId) {
    setSelectedTemplate(id)
    const template = TEMPLATES.find((t) => t.id === id)
    if (template) {
      setSelectedSections({ ...template.sections })
    }
  }

  function handleToggleSection(key: string) {
    setSelectedSections((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  function handleNext() {
    if (currentStep === 1) {
      // Moving to preview — generate the report
      const report = generateReportFromStudent(
        student,
        selectedTerm,
        CURRENT_ACADEMIC_YEAR,
      )
      setGeneratedReport(report)
    }
    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1))
  }

  function handleBack() {
    setCurrentStep((prev) => Math.max(prev - 1, 0))
  }

  function handleSave() {
    if (generatedReport) {
      addReport(generatedReport)
      setIsSaved(true)
    }
  }

  const canGoNext =
    currentStep === 0 ? selectedTemplate !== null : currentStep < 2

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Header */}
      <div className="shrink-0 border-b px-6 py-4">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div>
            <h1 className="text-base font-semibold">Generate Report Card</h1>
            <p className="text-sm text-muted-foreground">
              {student.name} &middot; {student.class}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onOpenChange(false)}
          >
            <X className="size-4" />
          </Button>
        </div>

        {/* Step Indicator */}
        <div className="mx-auto mt-3 flex max-w-2xl flex-col gap-2">
          <div className="flex items-center gap-1.5">
            {STEPS.map((step, i) => {
              const isCompleted = i < currentStep
              const isActive = i === currentStep

              return (
                <div
                  key={step}
                  className={cn(
                    'h-1 flex-1 rounded-full transition-colors',
                    isCompleted || isActive ? 'bg-primary' : 'bg-muted',
                  )}
                />
              )
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            Step {currentStep + 1} of {STEPS.length} &middot;{' '}
            <span className="font-medium text-foreground">
              {STEPS[currentStep]}
            </span>
          </p>
        </div>
      </div>

      {/* Content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto max-w-2xl">
          {currentStep === 0 && (
            <HdpTemplateStep
              selectedTemplate={selectedTemplate}
              onSelectTemplate={handleSelectTemplate}
              selectedTerm={selectedTerm}
              onSelectTerm={setSelectedTerm}
              availableTerms={missingTerms}
            />
          )}
          {currentStep === 1 && (
            <HdpDataStep
              selectedSections={selectedSections}
              onToggleSection={handleToggleSection}
              templateId={selectedTemplate}
            />
          )}
          {currentStep === 2 && generatedReport && (
            <HdpPreviewStep
              report={generatedReport}
              selectedSections={selectedSections}
              schoolLevel={schoolLevel}
            />
          )}
          {currentStep === 3 && (
            <SuccessStep
              report={generatedReport}
              isSaved={isSaved}
              studentName={student.name}
              term={selectedTerm}
            />
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t px-6 py-4">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div>
            {currentStep === 0 && (
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
            )}
            {currentStep > 0 && currentStep < 3 && (
              <Button variant="outline" onClick={handleBack}>
                <ChevronLeft className="mr-1 size-4" />
                Back
              </Button>
            )}
            {currentStep === 3 && (
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            )}
          </div>
          <div>
            {currentStep < 2 && (
              <Button onClick={handleNext} disabled={!canGoNext}>
                Next
                <ChevronRight className="ml-1 size-4" />
              </Button>
            )}
            {currentStep === 2 && (
              <Button
                className="bg-orange-9 text-white hover:bg-orange-10"
                onClick={() => {
                  handleNext()
                  handleSave()
                }}
              >
                <Save className="mr-1.5 size-4" />
                Save Reports
              </Button>
            )}
            {currentStep === 3 && isSaved && generatedReport && (
              <Button
                className="bg-orange-9 text-white hover:bg-orange-10"
                render={
                  <Link to="/reports/$id" params={{ id: generatedReport.id }} />
                }
              >
                <Eye className="mr-1.5 size-4" />
                View Report
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function SuccessStep({
  report,
  isSaved,
  studentName,
  term,
}: {
  report: HolisticReport | null
  isSaved: boolean
  studentName: string
  term: Term
}) {
  if (!isSaved || !report) {
    return (
      <div className="flex flex-1 items-center justify-center py-16">
        <p className="text-muted-foreground">Saving report...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-lime-3">
        <CheckCircle className="size-8 text-lime-11" />
      </div>
      <h3 className="text-xl font-semibold">Report Saved Successfully</h3>
      <p className="max-w-sm text-sm text-muted-foreground">
        The Holistic Development Profile for{' '}
        <span className="font-medium text-foreground">{studentName}</span> —{' '}
        {term} {report.academicYear} has been saved.
      </p>
      <p className="text-xs text-muted-foreground">
        You can view, edit, and send this report from the Reports page.
      </p>
    </div>
  )
}
