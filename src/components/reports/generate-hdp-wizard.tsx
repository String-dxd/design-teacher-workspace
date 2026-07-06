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

const SECONDARY_STEPS = ['Template', 'Selection', 'Preview', 'Save']
const PRIMARY_STEPS = ['Configure', 'Preview', 'Save']

const DEFAULT_SECTIONS: Record<string, boolean> = {
  studentInfo: true,
  attendance: true,
  academic: true,
  teacherComments: true,
  coreValues: false,
  physicalFitness: false,
  via: false,
  cca: false,
}

interface GenerateHdpWizardProps {
  students: Array<Student>
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function GenerateHdpWizard({
  students,
  open,
  onOpenChange,
}: GenerateHdpWizardProps) {
  const student = students.at(0)
  const schoolLevel = student ? getSchoolLevel(student.class) : 'secondary'
  const isPrimary = schoolLevel === 'primary'

  const STEPS = isPrimary ? PRIMARY_STEPS : SECONDARY_STEPS
  const availableTerms: Array<Term> = isPrimary
    ? ['Semester 1', 'Semester 2']
    : ['Term 1', 'Term 2', 'Term 3', 'Term 4']

  const [currentStep, setCurrentStep] = useState(0)
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId | null>(
    isPrimary ? 'comprehensive' : null,
  )
  const [selectedTerm, setSelectedTerm] = useState<Term>(availableTerms[0])
  const [selectedSections, setSelectedSections] =
    useState<Record<string, boolean>>(DEFAULT_SECTIONS)
  const [generatedReport, setGeneratedReport] = useState<HolisticReport | null>(
    null,
  )
  const [isSaved, setIsSaved] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Reset state when opened (re-derive from fresh students)
  useEffect(() => {
    if (open) {
      setCurrentStep(0)
      setSelectedTemplate(isPrimary ? 'comprehensive' : null)
      setSelectedTerm(availableTerms[0])
      setSelectedSections(DEFAULT_SECTIONS)
      setGeneratedReport(null)
      setIsSaved(false)
    }
  }, [open, isPrimary]) // re-run when open or school level changes

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

  const previewStep = isPrimary ? 1 : 2

  function handleNext() {
    if (currentStep === previewStep - 1) {
      // Moving to preview — generate report for first student
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
    // Generate and save reports for all selected students
    for (const s of students) {
      const report = generateReportFromStudent(
        s,
        selectedTerm,
        CURRENT_ACADEMIC_YEAR,
      )
      addReport(report)
    }
    setIsSaved(true)
  }

  const canGoNext = isPrimary
    ? currentStep < previewStep
    : currentStep === 0
      ? selectedTemplate !== null
      : currentStep < previewStep

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Header */}
      <div className="shrink-0 border-b px-6 py-4">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div>
            <h1 className="text-base font-semibold">Generate HDP</h1>
            <p className="text-sm text-muted-foreground">
              {students.length} student{students.length !== 1 ? 's' : ''}{' '}
              &middot; {student?.class ?? ''}
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
          {/* P1 primary flow: Configure → Preview → Save */}
          {isPrimary && currentStep === 0 && (
            <HdpTemplateStep
              selectedTemplate={selectedTemplate}
              onSelectTemplate={handleSelectTemplate}
              selectedTerm={selectedTerm}
              onSelectTerm={setSelectedTerm}
              availableTerms={availableTerms}
              isPrimary
              selectedSections={selectedSections}
              onToggleSection={handleToggleSection}
            />
          )}
          {isPrimary && currentStep === 1 && generatedReport && (
            <HdpPreviewStep
              report={generatedReport}
              selectedSections={selectedSections}
              schoolLevel={schoolLevel}
            />
          )}
          {isPrimary && currentStep === 2 && (
            <SuccessStep
              report={generatedReport}
              isSaved={isSaved}
              studentCount={students.length}
              studentClass={student?.class ?? ''}
              term={selectedTerm}
            />
          )}

          {/* Secondary flow: Template → Selection → Preview → Save */}
          {!isPrimary && currentStep === 0 && (
            <HdpTemplateStep
              selectedTemplate={selectedTemplate}
              onSelectTemplate={handleSelectTemplate}
              selectedTerm={selectedTerm}
              onSelectTerm={setSelectedTerm}
              availableTerms={availableTerms}
            />
          )}
          {!isPrimary && currentStep === 1 && (
            <HdpDataStep
              selectedSections={selectedSections}
              onToggleSection={handleToggleSection}
              templateId={selectedTemplate}
            />
          )}
          {!isPrimary && currentStep === 2 && generatedReport && (
            <HdpPreviewStep
              report={generatedReport}
              selectedSections={selectedSections}
              schoolLevel={schoolLevel}
            />
          )}
          {!isPrimary && currentStep === 3 && (
            <SuccessStep
              report={generatedReport}
              isSaved={isSaved}
              studentCount={1}
              studentClass={student?.class ?? ''}
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
            {currentStep > 0 && currentStep < STEPS.length - 1 && (
              <Button variant="outline" onClick={handleBack}>
                <ChevronLeft className="mr-1 size-4" />
                Back
              </Button>
            )}
            {currentStep === STEPS.length - 1 && (
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Done
              </Button>
            )}
          </div>
          <div>
            {currentStep < previewStep && (
              <Button onClick={handleNext} disabled={!canGoNext}>
                Next
                <ChevronRight className="ml-1 size-4" />
              </Button>
            )}
            {currentStep === previewStep && (
              <Button
                className="bg-orange-9 text-white hover:bg-orange-10"
                onClick={() => {
                  handleNext()
                  handleSave()
                }}
              >
                <Save className="mr-1.5 size-4" />
                Save reports
              </Button>
            )}
            {currentStep === STEPS.length - 1 &&
              isSaved &&
              !isPrimary &&
              generatedReport && (
                <Button
                  className="bg-orange-9 text-white hover:bg-orange-10"
                  render={
                    <Link
                      to="/holistic-reports/$id"
                      params={{ id: generatedReport.id }}
                    />
                  }
                >
                  <Eye className="mr-1.5 size-4" />
                  View report
                </Button>
              )}
          </div>
        </div>
      </div>
    </div>
  )
}

function SuccessStep({
  isSaved,
  studentCount,
  studentClass,
  term,
}: {
  report: HolisticReport | null
  isSaved: boolean
  studentCount: number
  studentClass: string
  term: Term
}) {
  if (!isSaved) {
    return (
      <div className="flex flex-1 items-center justify-center py-16">
        <p className="text-muted-foreground">Saving reports...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-lime-3">
        <CheckCircle className="size-8 text-lime-11" />
      </div>
      <h3 className="text-xl font-semibold">
        {studentCount} report{studentCount !== 1 ? 's' : ''} generated
      </h3>
      <p className="max-w-sm text-sm text-muted-foreground">
        Holistic Development Profiles for{' '}
        <span className="font-medium text-foreground">{studentClass}</span> —{' '}
        {term} have been saved and are pending review.
      </p>
      <div className="mt-2 flex items-center gap-2 rounded-full border border-amber-6 bg-amber-2 px-4 py-2 text-xs font-medium text-amber-11">
        Pending review — your level head will review and release reports to
        students
      </div>
    </div>
  )
}
