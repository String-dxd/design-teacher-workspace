import { BarChart3, ClipboardList, Lock, Pencil } from 'lucide-react'
import { HdpDataStep } from './hdp-data-step'
import type { Term } from '@/types/report'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

export type TemplateId = 'quarterly' | 'comprehensive' | 'custom'

interface HdpTemplate {
  id: TemplateId
  name: string
  description: string
  icon: React.ReactNode
  tags: Array<string>
  sections: Record<string, boolean>
}

export const TEMPLATES: Array<HdpTemplate> = [
  {
    id: 'quarterly',
    name: 'Quarterly Academic Report',
    description:
      'Focus on academic performance with grades, attendance, and overall progress',
    icon: <BarChart3 className="size-5 text-twblue-11" />,
    tags: ['Academic performance', 'Attendance', 'Behaviour & discipline'],
    sections: {
      studentInfo: true,
      attendance: true,
      academic: true,
      teacherComments: true,
      coreValues: false,
      physicalFitness: false,
      via: false,
      cca: false,
    },
  },
  {
    id: 'comprehensive',
    name: 'Comprehensive Student Report',
    description:
      'Full overview including academics, behavior, wellbeing, and family information',
    icon: <ClipboardList className="size-5 text-lime-11" />,
    tags: [
      'Academic performance',
      'Attendance',
      'Behaviour & discipline',
      'Wellbeing',
    ],
    sections: {
      studentInfo: true,
      attendance: true,
      academic: true,
      teacherComments: true,
      coreValues: true,
      physicalFitness: true,
      via: true,
      cca: true,
    },
  },
  {
    id: 'custom',
    name: 'Custom report',
    description: 'Select your own sections to create a personalised report',
    icon: <Pencil className="size-5 text-amber-11" />,
    tags: ['Customisable'],
    sections: {
      studentInfo: true,
      attendance: true,
      academic: true,
      teacherComments: true,
      coreValues: true,
      physicalFitness: true,
      via: true,
      cca: true,
    },
  },
]

interface HdpTemplateStepProps {
  selectedTemplate: TemplateId | null
  onSelectTemplate: (id: TemplateId) => void
  selectedTerm: Term
  onSelectTerm: (term: Term) => void
  availableTerms: Array<Term>
  isPrimary?: boolean
  selectedSections?: Record<string, boolean>
  onToggleSection?: (key: string) => void
}

export function HdpTemplateStep({
  selectedTemplate,
  onSelectTemplate,
  selectedTerm,
  onSelectTerm,
  availableTerms,
  isPrimary = false,
  selectedSections,
  onToggleSection,
}: HdpTemplateStepProps) {
  if (isPrimary) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h3 className="text-base font-semibold">Configure HDP</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose the semester and which sections to include
          </p>
        </div>

        {/* Template — locked to Standard for P1 */}
        <div className="flex items-start gap-4 rounded-xl border border-border bg-muted/40 p-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-background">
            <ClipboardList className="size-5 text-lime-11" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold">Standard HDP</p>
              <Lock className="size-3 text-muted-foreground" />
            </div>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Subjects with learning outcomes and qualitative descriptors,
              attendance, conduct, and teacher remarks.
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {[
                'Academic performance',
                'Attendance & conduct',
                'Teacher remarks',
              ].map((tag) => (
                <Badge key={tag} variant="secondary" className="text-[10px]">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Semester selector */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">Semester:</span>
          <Select
            value={selectedTerm}
            onValueChange={(val) => onSelectTerm(val as Term)}
          >
            <SelectTrigger className="w-[160px]">{selectedTerm}</SelectTrigger>
            <SelectContent>
              {availableTerms.map((term) => (
                <SelectItem key={term} value={term}>
                  {term}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Optional sections */}
        {selectedSections && onToggleSection && (
          <div>
            <p className="mb-3 text-sm font-medium">Optional sections</p>
            <HdpDataStep
              selectedSections={selectedSections}
              onToggleSection={onToggleSection}
              templateId={selectedTemplate}
            />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="text-base font-semibold">Select a template</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose a pre-configured template or create a custom report
        </p>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">Term:</span>
        <Select
          value={selectedTerm}
          onValueChange={(val) => onSelectTerm(val as Term)}
        >
          <SelectTrigger className="w-[140px]">{selectedTerm}</SelectTrigger>
          <SelectContent>
            {availableTerms.map((term) => (
              <SelectItem key={term} value={term}>
                {term}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-3">
        {TEMPLATES.map((template) => (
          <button
            key={template.id}
            type="button"
            onClick={() => onSelectTemplate(template.id)}
            className={cn(
              'flex items-start gap-4 rounded-xl border p-5 text-left transition-all hover:border-primary/50',
              selectedTemplate === template.id
                ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                : 'border-border',
            )}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
              {template.icon}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">{template.name}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {template.description}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {template.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-[10px]">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
