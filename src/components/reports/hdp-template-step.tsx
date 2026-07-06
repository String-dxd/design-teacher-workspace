import { BarChart3, ClipboardList, Pencil } from 'lucide-react'
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
    tags: ['Academic Performance', 'Attendance', 'Behavior & Discipline'],
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
      'Academic Performance',
      'Attendance',
      'Behavior & Discipline',
      'Wellbeing',
      'Family & Housing',
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
    name: 'Custom Report',
    description: 'Select your own sections to create a personalized report',
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
}

export function HdpTemplateStep({
  selectedTemplate,
  onSelectTemplate,
  selectedTerm,
  onSelectTerm,
  availableTerms,
}: HdpTemplateStepProps) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="text-base font-semibold">Select a Template</h3>
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
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
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
