import {
  Activity,
  ClipboardCheck,
  GraduationCap,
  Heart,
  Info,
  MessageSquare,
  Star,
  Trophy,
  User,
} from 'lucide-react'
import type { TemplateId } from './hdp-template-step'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface SectionDef {
  key: string
  label: string
  description: string
  icon: React.ReactNode
  iconBg: string
  required?: boolean
}

const SECTION_DEFS: Array<SectionDef> = [
  {
    key: 'studentInfo',
    label: 'Student Information',
    description: 'Name, class, index number, form teacher',
    icon: <User className="size-4 text-twblue-11" />,
    iconBg: 'bg-twblue-3',
    required: true,
  },
  {
    key: 'attendance',
    label: 'Attendance & Conduct',
    description: 'Days present, absences, late-coming, conduct grade',
    icon: <ClipboardCheck className="size-4 text-lime-11" />,
    iconBg: 'bg-lime-3',
  },
  {
    key: 'academic',
    label: 'Academic Performance',
    description: 'Subject results, grades, and learning outcomes',
    icon: <GraduationCap className="size-4 text-violet-11" />,
    iconBg: 'bg-violet-3',
  },
  {
    key: 'teacherComments',
    label: 'Teacher Comments',
    description: 'Observations and next steps from form teacher',
    icon: <MessageSquare className="size-4 text-orange-11" />,
    iconBg: 'bg-orange-3',
  },
  {
    key: 'coreValues',
    label: 'Core Values',
    description: 'Character development assessment and radar chart',
    icon: <Star className="size-4 text-amber-11" />,
    iconBg: 'bg-amber-3',
  },
  {
    key: 'physicalFitness',
    label: 'Physical Fitness',
    description: 'BMI category and NAPFA results',
    icon: <Activity className="size-4 text-crimson-11" />,
    iconBg: 'bg-crimson-3',
  },
  {
    key: 'via',
    label: 'Values in Action (VIA)',
    description: 'Community service activities and hours',
    icon: <Heart className="size-4 text-crimson-11" />,
    iconBg: 'bg-crimson-3',
  },
  {
    key: 'cca',
    label: 'Co-Curricular Activities (CCA)',
    description: 'CCA participation, role, and achievements',
    icon: <Trophy className="size-4 text-twblue-11" />,
    iconBg: 'bg-twblue-3',
  },
]

interface HdpDataStepProps {
  selectedSections: Record<string, boolean>
  onToggleSection: (key: string) => void
  templateId: TemplateId | null
}

export function HdpDataStep({
  selectedSections,
  onToggleSection,
  templateId: _templateId,
}: HdpDataStepProps) {
  const enabledCount = Object.values(selectedSections).filter(Boolean).length

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h3 className="text-base font-semibold">Customize Data Selection</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Select the sections and specific fields to include in the report card
        </p>
      </div>

      <div className="flex items-center gap-2 rounded-lg bg-twblue-3 px-4 py-3 text-sm text-twblue-11">
        <Info className="size-4 shrink-0" />
        <span>
          Only data you have permission to access will be included. Restricted
          fields are hidden based on your access level.
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {SECTION_DEFS.map((section) => {
          const checked = section.required || selectedSections[section.key]
          const disabled = section.required

          return (
            <label
              key={section.key}
              className={cn(
                'flex items-center gap-4 rounded-lg border px-4 py-3 transition-colors',
                disabled
                  ? 'cursor-default bg-muted/30'
                  : 'cursor-pointer hover:bg-muted/50',
                checked && !disabled && 'border-primary/30 bg-primary/5',
              )}
            >
              <Checkbox
                checked={checked}
                disabled={disabled}
                onCheckedChange={() => {
                  if (!disabled) onToggleSection(section.key)
                }}
              />
              <div
                className={cn(
                  'flex size-8 shrink-0 items-center justify-center rounded-lg',
                  section.iconBg,
                )}
              >
                {section.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{section.label}</span>
                  {section.required && (
                    <Badge variant="secondary" className="text-[10px]">
                      Required
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {section.description}
                </p>
              </div>
            </label>
          )
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        {enabledCount} of {SECTION_DEFS.length} sections selected
      </p>
    </div>
  )
}
