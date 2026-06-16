import { useState } from 'react'
import { Columns3, RotateCcw } from 'lucide-react'

import type { FilterField, TemporalType } from '@/types/student'
import { useFeatureFlags } from '@/lib/feature-flags'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export interface ColumnConfig {
  id: string
  label: string
  visible: boolean
  sortable?: boolean
  filterable?: boolean
  filterField?: FilterField
  source?: string
  lastUpdated?: string
  /** Optional override for the "Last synced:" / "Last uploaded:" label */
  dateLabel?: string
  temporalType?: TemporalType
  /** True for columns added via the Import Data wizard */
  imported?: boolean
}

export const CURRENT_TERM_KEY = 'T1 2026'
export const CURRENT_TERM_LABEL = 'Current term'
export const PREV_TERM_KEY = 'T4 2025'
export const PREV_TERM_LABEL = 'Previous term (Term 4, 2025)'

export const defaultColumns: Array<ColumnConfig> = [
  {
    id: 'index',
    label: '#',
    visible: true,
    sortable: false,
    filterable: false,
  },
  {
    id: 'name',
    label: 'Name',
    visible: true,
    sortable: true,
    filterable: true,
    filterField: 'name',
    source: 'School Cockpit, RE_SDT_041',
    lastUpdated: '16 Sep 2025',
  },
  {
    id: 'class',
    label: 'Class',
    visible: true,
    sortable: true,
    filterable: true,
    filterField: 'class',
    source: 'School Cockpit, RE_SDT_041',
    lastUpdated: '16 Sep 2025',
  },
  {
    id: 'cca',
    label: 'CCA',
    visible: true,
    sortable: true,
    filterable: false,
    source: 'School Cockpit, RE_SDT_041',
    lastUpdated: '16 Sep 2025',
  },
  {
    id: 'attentionTags',
    label: 'Attention tag',
    visible: true,
    sortable: false,
    filterable: false,
  },
  {
    id: 'attendance',
    label: 'Attendance (%)',
    visible: true,
    sortable: true,
    filterable: false,
    source: 'School Cockpit, RE_AT_002',
    lastUpdated: '16 Sep 2025',
    temporalType: 'accumulating',
  },
  {
    id: 'lateComing',
    label: 'Late-coming (days)',
    visible: true,
    sortable: true,
    filterable: true,
    filterField: 'lateComing',
    source: 'School Cockpit, RE_AT_002',
    lastUpdated: '16 Sep 2025',
    temporalType: 'accumulating',
  },
  {
    id: 'absences',
    label: 'Non-VR absences (days)',
    visible: true,
    sortable: true,
    filterable: true,
    filterField: 'absences',
    source: 'School Cockpit, RE_AT_002',
    lastUpdated: '16 Sep 2025',
    temporalType: 'accumulating',
  },
  {
    id: 'ccaMissed',
    label: 'CCA attendance(%)',
    visible: true,
    sortable: true,
    filterable: true,
    filterField: 'ccaMissed',
    source: 'School Cockpit, RE_AT_002',
    lastUpdated: '16 Sep 2025',
    temporalType: 'accumulating',
  },
  {
    id: 'offences',
    label: 'Offences',
    visible: true,
    sortable: true,
    filterable: true,
    filterField: 'offences',
    source: 'School Cockpit, RE_DI_003',
    lastUpdated: '16 Sep 2025',
    temporalType: 'accumulating',
  },
  {
    id: 'counsellingSessions',
    label: 'Counselling cases',
    visible: true,
    sortable: true,
    filterable: true,
    filterField: 'counsellingSessions',
    source: 'School Cockpit, RE_WB_004',
    lastUpdated: '16 Sep 2025',
    temporalType: 'accumulating',
  },
  {
    id: 'sen',
    label: 'SEN',
    visible: true,
    sortable: true,
    filterable: true,
    filterField: 'sen',
    source: 'School Cockpit, RE_WB_004',
    lastUpdated: '16 Sep 2025',
    temporalType: 'fixed',
  },
  {
    id: 'conduct',
    label: 'Conduct grade',
    visible: true,
    sortable: true,
    filterable: true,
    filterField: 'conduct',
    source: 'School Cockpit, RE_SDT_041, Latest available (Term 4, 2025)',
    lastUpdated: '16 Sep 2025',
    temporalType: 'event-based',
  },
  {
    id: 'riskIndicators',
    label: 'TCI risk indicators',
    visible: true,
    sortable: true,
    filterable: true,
    filterField: 'riskIndicators',
    source: 'School Cockpit, RE_SDT_041, Latest available (Term 4, 2025)',
    lastUpdated: '16 Sep 2025',
    temporalType: 'event-based',
  },
  {
    id: 'lowMoodFlagged',
    label: 'Low mood flagged 2+ terms',
    visible: true,
    sortable: true,
    filterable: true,
    filterField: 'lowMoodFlagged',
    source: 'School Cockpit, RE_WB_004',
    lastUpdated: '16 Sep 2025',
    temporalType: 'cross-term',
  },
  {
    id: 'socialLinks',
    label: 'Social links',
    visible: true,
    sortable: true,
    filterable: true,
    filterField: 'socialLinks',
    source: 'School Cockpit, RE_SDT_041, Latest available (Term 4, 2025)',
    lastUpdated: '16 Sep 2025',
    temporalType: 'event-based',
  },
  {
    id: 'overallPercentage',
    label: 'Overall % across selected subjects',
    visible: true,
    sortable: true,
    filterable: true,
    filterField: 'overallPercentage',
    source: 'School Cockpit, RE_SDT_041, Latest available (Term 4, 2025)',
    lastUpdated: '16 Sep 2025',
    temporalType: 'event-based',
  },
  {
    id: 'approvedMtl',
    label: 'Approved MTL',
    visible: true,
    sortable: true,
    filterable: false,
    source: 'School Cockpit, RE_AC_005',
    lastUpdated: '16 Sep 2025',
  },
  {
    id: 'learningSupport',
    label: 'Learning support',
    visible: true,
    sortable: true,
    filterable: true,
    filterField: 'learningSupport',
    source: 'School Cockpit, RE_AC_005',
    lastUpdated: '16 Sep 2025',
  },
  {
    id: 'postSecEligibility',
    label: 'Post-Sec Eligibility',
    visible: true,
    sortable: true,
    filterable: true,
    filterField: 'postSecEligibility',
    source: 'School Cockpit, RE_AC_005',
    lastUpdated: '16 Sep 2025',
  },
  {
    id: 'parentsConsideringDivorce',
    label: 'Parent enrolled in CCP',
    visible: true,
    sortable: true,
    filterable: true,
    filterField: 'parentsConsideringDivorce',
    source: 'MSF via Uplift Office',
    lastUpdated: '19 May 2025',
    dateLabel: 'Last synced:',
    temporalType: 'fixed',
  },
  {
    id: 'nonIntactFamily',
    label: 'Parents are divorced',
    visible: true,
    sortable: true,
    filterable: true,
    filterField: 'nonIntactFamily',
    source: 'School Cockpit, MSF via Uplift Office',
    lastUpdated: '19 May 2025',
    dateLabel: 'Last synced:',
    temporalType: 'fixed',
  },
  {
    id: 'supportedByComLink',
    label: 'Supported by ComLink+',
    visible: true,
    sortable: true,
    filterable: true,
    filterField: 'supportedByComLink',
    source: 'MSF via Uplift Office',
    lastUpdated: '19 May 2025',
    dateLabel: 'Last synced:',
    temporalType: 'fixed',
  },
  {
    id: 'supportedByFsc',
    label: 'Supported by FSC',
    visible: true,
    sortable: true,
    filterable: true,
    filterField: 'supportedByFsc',
    source: 'MSF via Uplift Office',
    lastUpdated: '19 May 2025',
    dateLabel: 'Last synced:',
    temporalType: 'fixed',
  },
  {
    id: 'fas',
    label: 'FAS',
    visible: true,
    sortable: true,
    filterable: true,
    filterField: 'fas',
    source: 'School Cockpit, RE_FA_006',
    lastUpdated: '16 Sep 2025',
    temporalType: 'fixed',
  },
  {
    id: 'housing',
    label: 'Housing',
    visible: true,
    sortable: true,
    filterable: true,
    filterField: 'housing',
    source: 'School Cockpit, RE_FA_006',
    lastUpdated: '16 Sep 2025',
    temporalType: 'fixed',
  },
  {
    id: 'housingType',
    label: 'Housing ownership',
    visible: true,
    sortable: true,
    filterable: true,
    filterField: 'housingType',
    source: 'School Cockpit, RE_FA_006',
    lastUpdated: '16 Sep 2025',
    temporalType: 'fixed',
  },
  {
    id: 'siblings',
    label: 'Siblings',
    visible: true,
    sortable: true,
    filterable: true,
    filterField: 'siblings',
    source: 'School Cockpit, RE_FA_006',
    lastUpdated: '16 Sep 2025',
    temporalType: 'fixed',
  },
  {
    id: 'commuterStatus',
    label: 'Commuter status',
    visible: true,
    sortable: true,
    filterable: false,
    source: 'School Cockpit, RE_FA_006',
    lastUpdated: '16 Sep 2025',
    temporalType: 'fixed',
  },
  {
    id: 'afterSchoolArrangement',
    label: 'After-school arrangement',
    visible: true,
    sortable: true,
    filterable: false,
    source: 'School Cockpit, RE_FA_006',
    lastUpdated: '16 Sep 2025',
    temporalType: 'fixed',
  },
]

interface ColumnVisibilityPopoverProps {
  columns: Array<ColumnConfig>
  onColumnsChange: (columns: Array<ColumnConfig>) => void
  className?: string
}

export function ColumnVisibilityPopover({
  columns,
  onColumnsChange,
  className,
}: ColumnVisibilityPopoverProps) {
  const { isEnabled } = useFeatureFlags()
  const isStudentInsightsView =
    !isEnabled('student-analytics') && !isEnabled('student-analytics-basic')
  const msfUpliftEnabled = isEnabled('msf-uplift-data')
  const [open, setOpen] = useState(false)

  const visibleCount = columns.filter((c) => c.visible).length

  const handleToggle = (id: string) => {
    onColumnsChange(
      columns.map((col) =>
        col.id === id ? { ...col, visible: !col.visible } : col,
      ),
    )
  }

  const handleReset = () => {
    const baseReset = isStudentInsightsView
      ? defaultColumns.filter(
          (c) => c.id !== 'approvedMtl' && c.id !== 'postSecEligibility',
        )
      : defaultColumns
    const resetColumns = msfUpliftEnabled
      ? baseReset
      : baseReset.filter(
          (c) =>
            c.id !== 'supportedByComLink' &&
            c.id !== 'supportedByFsc' &&
            c.id !== 'parentsConsideringDivorce' &&
            c.id !== 'nonIntactFamily',
        )
    onColumnsChange(resetColumns)
  }

  const handleShowAll = () => {
    onColumnsChange(columns.map((col) => ({ ...col, visible: true })))
  }

  const handleHideAll = () => {
    // Keep at least name and index visible
    onColumnsChange(
      columns.map((col) => ({
        ...col,
        visible: col.id === 'name' || col.id === 'index',
      })),
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger
          render={
            <PopoverTrigger
              render={
                <Button
                  variant="outline"
                  size="icon"
                  className={cn(className)}
                />
              }
            >
              <Columns3 className="h-4 w-4" />
            </PopoverTrigger>
          }
        />
        <TooltipContent>Show/hide columns</TooltipContent>
      </Tooltip>
      <PopoverContent className="w-[280px] p-0" align="end">
        {/* Quick actions */}
        <div className="flex items-center gap-2 border-b p-3">
          <Button variant="outline" size="sm" onClick={handleShowAll}>
            Show all
          </Button>
          <Button variant="outline" size="sm" onClick={handleHideAll}>
            Hide all
          </Button>
        </div>

        {/* Column list */}
        <ScrollArea className="h-[300px]">
          <div className="p-2">
            {columns.map((column) => (
              <label
                key={column.id}
                className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 hover:bg-accent"
              >
                <Checkbox
                  checked={column.visible}
                  onCheckedChange={() => handleToggle(column.id)}
                  disabled={
                    column.visible &&
                    visibleCount <= 2 &&
                    (column.id === 'name' || column.id === 'index')
                  }
                />
                <span className="text-sm">{column.label}</span>
              </label>
            ))}
          </div>
        </ScrollArea>

        {/* Reset button */}
        <div className="border-t p-3">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <RotateCcw className="h-4 w-4" />
            Reset to default
          </button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
