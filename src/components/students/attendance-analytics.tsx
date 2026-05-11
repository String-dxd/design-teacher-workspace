import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  Maximize2,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  TooltipContent,
  TooltipTrigger,
  Tooltip as TooltipUI,
} from '@/components/ui/tooltip'
import type { Student } from '@/types/student'
import { mockStudents } from '@/data/mock-students'
import { LevelDropdown } from '@/components/students/academic-analytics'
import { AttendanceRing } from '@/components/reports/attendance-ring'

const studentIdByName = new Map(mockStudents.map((s) => [s.name, s.id]))

const RING_SIZE = 140
const RING_STROKE = 22
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2
const RING_C = 2 * Math.PI * RING_RADIUS

interface MonthlyEntry {
  month: string
  latecoming: number | null
  absentNoValid: number | null
  absentValidPrivate: number | null
  absentValidOfficial: number | null
  absentMC: number | null
  pendingReason: number | null
}

// null = no occurrences that month (prevents empty bar slots)
const MONTHLY_DATA: Array<MonthlyEntry> = [
  {
    month: 'Jan',
    latecoming: 1,
    absentNoValid: 2,
    absentValidPrivate: 1,
    absentValidOfficial: 1,
    absentMC: 1,
    pendingReason: null,
  },
  {
    month: 'Feb',
    latecoming: 1,
    absentNoValid: 3,
    absentValidPrivate: 1,
    absentValidOfficial: 1,
    absentMC: 1,
    pendingReason: null,
  },
  {
    month: 'Mar',
    latecoming: null,
    absentNoValid: 1,
    absentValidPrivate: null,
    absentValidOfficial: 1,
    absentMC: null,
    pendingReason: null,
  },
  {
    month: 'Apr',
    latecoming: 2,
    absentNoValid: 4,
    absentValidPrivate: 2,
    absentValidOfficial: 1,
    absentMC: 1,
    pendingReason: null,
  },
  {
    month: 'May',
    latecoming: 1,
    absentNoValid: 2,
    absentValidPrivate: 3,
    absentValidOfficial: 1,
    absentMC: 1,
    pendingReason: null,
  },
  {
    month: 'Jun',
    latecoming: 2,
    absentNoValid: 3,
    absentValidPrivate: 2,
    absentValidOfficial: 2,
    absentMC: 1,
    pendingReason: null,
  },
  {
    month: 'Jul',
    latecoming: 1,
    absentNoValid: 1,
    absentValidPrivate: 1,
    absentValidOfficial: 1,
    absentMC: null,
    pendingReason: null,
  },
  {
    month: 'Aug',
    latecoming: 1,
    absentNoValid: 2,
    absentValidPrivate: 2,
    absentValidOfficial: 1,
    absentMC: 1,
    pendingReason: null,
  },
  {
    month: 'Sep',
    latecoming: 2,
    absentNoValid: 4,
    absentValidPrivate: 2,
    absentValidOfficial: 1,
    absentMC: 1,
    pendingReason: null,
  },
  {
    month: 'Oct',
    latecoming: 1,
    absentNoValid: 3,
    absentValidPrivate: 1,
    absentValidOfficial: 1,
    absentMC: 1,
    pendingReason: 1,
  },
]

const ABSENCE_DETAILS = [
  // Oct
  {
    date: '20 Oct 2026',
    type: 'Pending reason',
    typeColor: '#e03131',
    subReason: '—',
    remarks: 'Parent informed',
  },
  {
    date: '19 Oct 2026',
    type: 'Absent without valid reason',
    typeColor: '#f76707',
    subReason: '—',
    remarks: 'Skipped school',
  },
  {
    date: '16 Oct 2026',
    type: 'Late',
    typeColor: null,
    subReason: '—',
    remarks: 'Noted',
  },
  {
    date: '15 Oct 2026',
    type: 'Absent without valid reason',
    typeColor: '#f76707',
    subReason: '—',
    remarks: 'Skipped school',
  },
  {
    date: '14 Oct 2026',
    type: 'MC',
    typeColor: null,
    subReason: '—',
    remarks: '—',
  },
  {
    date: '13 Oct 2026',
    type: 'Late',
    typeColor: null,
    subReason: '—',
    remarks: 'Bus delay',
  },
  {
    date: '08 Oct 2026',
    type: 'Absent without valid reason',
    typeColor: '#f76707',
    subReason: '—',
    remarks: 'Skipped school',
  },
  {
    date: '07 Oct 2026',
    type: 'Pending reason',
    typeColor: '#e03131',
    subReason: '—',
    remarks: '—',
  },
  {
    date: '06 Oct 2026',
    type: 'Late',
    typeColor: null,
    subReason: '—',
    remarks: 'Noted',
  },
  {
    date: '01 Oct 2026',
    type: 'Absent (valid reason)',
    typeColor: null,
    subReason: 'Family event',
    remarks: 'Parent letter',
  },
  // Sep
  {
    date: '30 Sep 2026',
    type: 'Pending reason',
    typeColor: '#e03131',
    subReason: '—',
    remarks: 'Parent not reachable',
  },
  {
    date: '25 Sep 2026',
    type: 'Absent without valid reason',
    typeColor: '#f76707',
    subReason: '—',
    remarks: 'Skipped school',
  },
  {
    date: '24 Sep 2026',
    type: 'Late',
    typeColor: null,
    subReason: '—',
    remarks: 'Traffic',
  },
  {
    date: '22 Sep 2026',
    type: 'MC',
    typeColor: null,
    subReason: '—',
    remarks: '—',
  },
  {
    date: '17 Sep 2026',
    type: 'Absent (valid reason)',
    typeColor: null,
    subReason: 'CCA competition',
    remarks: 'Teacher approved',
  },
  {
    date: '11 Sep 2026',
    type: 'Late',
    typeColor: null,
    subReason: '—',
    remarks: 'Noted',
  },
  // Aug
  {
    date: '28 Aug 2026',
    type: 'Absent without valid reason',
    typeColor: '#f76707',
    subReason: '—',
    remarks: 'Skipped school',
  },
  {
    date: '26 Aug 2026',
    type: 'Pending reason',
    typeColor: '#e03131',
    subReason: '—',
    remarks: '—',
  },
  {
    date: '21 Aug 2026',
    type: 'MC',
    typeColor: null,
    subReason: '—',
    remarks: '—',
  },
  {
    date: '14 Aug 2026',
    type: 'Late',
    typeColor: null,
    subReason: '—',
    remarks: 'Bus delay',
  },
  {
    date: '05 Aug 2026',
    type: 'Absent (valid reason)',
    typeColor: null,
    subReason: 'Medical appointment',
    remarks: 'Parent letter',
  },
  // Jul
  {
    date: '29 Jul 2026',
    type: 'Late',
    typeColor: null,
    subReason: '—',
    remarks: 'Noted',
  },
  {
    date: '23 Jul 2026',
    type: 'Absent without valid reason',
    typeColor: '#f76707',
    subReason: '—',
    remarks: 'Skipped school',
  },
  {
    date: '16 Jul 2026',
    type: 'MC',
    typeColor: null,
    subReason: '—',
    remarks: '—',
  },
  // Jun
  {
    date: '25 Jun 2026',
    type: 'Pending reason',
    typeColor: '#e03131',
    subReason: '—',
    remarks: 'Parent informed',
  },
  {
    date: '23 Jun 2026',
    type: 'Absent without valid reason',
    typeColor: '#f76707',
    subReason: '—',
    remarks: 'Skipped school',
  },
  {
    date: '18 Jun 2026',
    type: 'Late',
    typeColor: null,
    subReason: '—',
    remarks: 'Noted',
  },
  {
    date: '11 Jun 2026',
    type: 'Absent (valid reason)',
    typeColor: null,
    subReason: 'Family event',
    remarks: 'Parent letter',
  },
  {
    date: '04 Jun 2026',
    type: 'MC',
    typeColor: null,
    subReason: '—',
    remarks: '—',
  },
  // May
  {
    date: '27 May 2026',
    type: 'Absent without valid reason',
    typeColor: '#f76707',
    subReason: '—',
    remarks: 'Skipped school',
  },
  {
    date: '20 May 2026',
    type: 'Late',
    typeColor: null,
    subReason: '—',
    remarks: 'Traffic',
  },
  {
    date: '13 May 2026',
    type: 'MC',
    typeColor: null,
    subReason: '—',
    remarks: '—',
  },
  {
    date: '06 May 2026',
    type: 'Pending reason',
    typeColor: '#e03131',
    subReason: '—',
    remarks: '—',
  },
  // Apr
  {
    date: '29 Apr 2026',
    type: 'Late',
    typeColor: null,
    subReason: '—',
    remarks: 'Noted',
  },
  {
    date: '23 Apr 2026',
    type: 'Absent without valid reason',
    typeColor: '#f76707',
    subReason: '—',
    remarks: 'Skipped school',
  },
  {
    date: '22 Apr 2026',
    type: 'MC',
    typeColor: null,
    subReason: '—',
    remarks: '—',
  },
  {
    date: '15 Apr 2026',
    type: 'Absent (valid reason)',
    typeColor: null,
    subReason: 'Sports day',
    remarks: 'Teacher approved',
  },
  {
    date: '08 Apr 2026',
    type: 'Pending reason',
    typeColor: '#e03131',
    subReason: '—',
    remarks: 'Parent informed',
  },
  // Mar
  {
    date: '25 Mar 2026',
    type: 'Absent without valid reason',
    typeColor: '#f76707',
    subReason: '—',
    remarks: 'Skipped school',
  },
  {
    date: '18 Mar 2026',
    type: 'Late',
    typeColor: null,
    subReason: '—',
    remarks: 'Bus delay',
  },
  // Feb
  {
    date: '25 Feb 2026',
    type: 'Pending reason',
    typeColor: '#e03131',
    subReason: '—',
    remarks: '—',
  },
  {
    date: '18 Feb 2026',
    type: 'Absent without valid reason',
    typeColor: '#f76707',
    subReason: '—',
    remarks: 'Skipped school',
  },
  {
    date: '11 Feb 2026',
    type: 'MC',
    typeColor: null,
    subReason: '—',
    remarks: '—',
  },
  {
    date: '04 Feb 2026',
    type: 'Late',
    typeColor: null,
    subReason: '—',
    remarks: 'Noted',
  },
  // Jan
  {
    date: '28 Jan 2026',
    type: 'Late',
    typeColor: null,
    subReason: '—',
    remarks: 'Traffic',
  },
  {
    date: '21 Jan 2026',
    type: 'Absent without valid reason',
    typeColor: '#f76707',
    subReason: '—',
    remarks: 'Skipped school',
  },
  {
    date: '14 Jan 2026',
    type: 'MC',
    typeColor: null,
    subReason: '—',
    remarks: '—',
  },
  {
    date: '07 Jan 2026',
    type: 'Absent (valid reason)',
    typeColor: null,
    subReason: 'Medical appointment',
    remarks: 'Parent letter',
  },
]

const DETAILS_PAGE_SIZE = 5

const BAR_CATEGORIES = [
  { key: 'pendingReason', label: 'Pending reason', color: '#fa5252' }, // red — top
  { key: 'absentNoValid', label: 'Non-VR absences', color: '#fd7e14' }, // orange
  { key: 'latecoming', label: 'Late', color: '#fac53e' }, // yellow — matches reports
  { key: 'absentMC', label: 'MC', color: '#74c0fc' }, // blue-3 (lightest)
  {
    key: 'absentValidPrivate',
    label: 'Valid reason (private)',
    color: '#228be6',
  }, // blue — matches reports
  {
    key: 'absentValidOfficial',
    label: 'Valid reason (official)',
    color: '#4d79e0',
  }, // cobalt blue H=222° — shifted from sky-blue to contrast against slate-12
]

const CHART_COMMON_PROPS = {
  margin: { top: 20, right: 8, left: -20, bottom: 4 },
  barCategoryGap: '20%' as const,
  barGap: 0,
}

function AbsenceBarChart({
  barSize,
  data = MONTHLY_DATA,
  onSegmentClick,
}: {
  barSize?: number
  data?: Array<MonthlyEntry>
  onSegmentClick?: (month: string, categoryKey: string, count: number) => void
}) {
  const reversedCategories = [...BAR_CATEGORIES].reverse()

  // For each month, determine which category key sits at the top of the stack
  const topKeyByMonth: Record<string, string> = {}
  for (const entry of data) {
    for (const cat of BAR_CATEGORIES) {
      if ((Number(entry[cat.key as keyof MonthlyEntry]) || 0) > 0) {
        topKeyByMonth[entry.month] = cat.key
        break
      }
    }
  }

  return (
    <BarChart {...CHART_COMMON_PROPS} data={data} barSize={barSize}>
      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e9ecef" />
      <XAxis
        dataKey="month"
        tick={{ fontSize: 12, fill: '#868e96' }}
        axisLine={false}
        tickLine={false}
      />
      <YAxis
        tick={{ fontSize: 12, fill: '#868e96' }}
        axisLine={false}
        tickLine={false}
        allowDecimals={false}
      />
      <Tooltip
        content={<CustomBarTooltip clickable={!!onSegmentClick} />}
        cursor={{ fill: 'rgba(0,0,0,0.04)' }}
      />
      {reversedCategories.map((cat, i) => (
        <Bar
          key={cat.key}
          dataKey={cat.key}
          fill={cat.color}
          stackId="a"
          shape={(shapeProps: any) => {
            const { x, y, width, height, fill } = shapeProps
            const h = Number(height)
            const w = Number(width)
            if (h <= 0 || w <= 0) return <g />
            const isTop = topKeyByMonth[shapeProps.month as string] === cat.key
            if (!isTop) {
              return <rect x={x} y={y} width={w} height={h} fill={fill} />
            }
            const r = Math.min(4, w / 2, h / 2)
            const d = `M${Number(x) + r},${y} H${Number(x) + w - r} Q${Number(x) + w},${y} ${Number(x) + w},${Number(y) + r} V${Number(y) + h} H${x} V${Number(y) + r} Q${x},${y} ${Number(x) + r},${y} Z`
            return <path d={d} fill={fill} />
          }}
          cursor={onSegmentClick ? 'pointer' : undefined}
          onClick={
            onSegmentClick
              ? (((entry: Record<string, unknown>) => {
                  const count = Number(entry[cat.key]) || 0
                  if (count > 0)
                    onSegmentClick(entry.month as string, cat.key, count)
                }) as any)
              : undefined
          }
        >
          <LabelList
            dataKey={cat.key}
            content={(props: {
              x?: number
              y?: number
              width?: number
              height?: number
              value?: number | null
            }) => {
              const { x, y, width, height, value } = props
              const numVal = Number(value) || 0
              if (numVal <= 0) return null
              const cx = Number(x) + Number(width) / 2
              const cy = Number(y) + Number(height) / 2
              return (
                <text
                  x={cx}
                  y={cy}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={10}
                  fontWeight={500}
                  fill="var(--slate-12)"
                >
                  {numVal}
                </text>
              )
            }}
          />
          {i === reversedCategories.length - 1 && (
            <LabelList
              position="top"
              content={({
                x,
                y,
                width,
                index,
              }: {
                x?: number
                y?: number
                width?: number
                index?: number
              }) => {
                if (index === undefined) return null
                const entry = data[index]
                const total = BAR_CATEGORIES.reduce(
                  (sum, c) =>
                    sum + (Number(entry[c.key as keyof MonthlyEntry]) || 0),
                  0,
                )
                if (total === 0) return null
                return (
                  <text
                    x={Number(x) + Number(width) / 2}
                    y={Number(y) - 4}
                    textAnchor="middle"
                    fontSize={10}
                    fontWeight={600}
                    fill="#495057"
                  >
                    {total}
                  </text>
                )
              }}
            />
          )}
        </Bar>
      ))}
    </BarChart>
  )
}

function AbsenceLegend() {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-4 text-xs">
      {BAR_CATEGORIES.map((cat) => (
        <div key={cat.key} className="flex items-center gap-1.5">
          <span
            className="h-3 w-3 shrink-0 rounded-sm"
            style={{ backgroundColor: cat.color }}
          />
          <span className="text-muted-foreground">{cat.label}</span>
        </div>
      ))}
    </div>
  )
}

function CustomBarTooltip({
  active,
  payload,
  label,
  clickable,
}: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color?: string }>
  label?: string
  clickable?: boolean
}) {
  if (!active || !payload || payload.length === 0) return null
  const itemsWithValue = [...payload].reverse().filter((p) => p.value > 0)
  const total = itemsWithValue.reduce((sum, p) => sum + p.value, 0)
  if (total === 0) return null
  return (
    <div className="w-[220px] rounded-lg border border-border/60 bg-white px-3 py-2.5 shadow-lg text-xs">
      <p className="mb-2 text-[11px] font-semibold text-foreground">{label}</p>
      <div className="space-y-1.5">
        {itemsWithValue.map((item) => {
          const cat = BAR_CATEGORIES.find((c) => c.key === item.name)
          return (
            <div
              key={item.name}
              className="flex items-center justify-between gap-3"
            >
              <div className="flex min-w-0 items-center gap-1.5">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: cat?.color ?? item.color }}
                />
                <span className="truncate text-muted-foreground">
                  {cat?.label ?? item.name}
                </span>
              </div>
              <span className="font-semibold tabular-nums text-foreground">
                {item.value}
              </span>
            </div>
          )
        })}
      </div>
      {itemsWithValue.length > 1 && (
        <div className="mt-2 flex justify-between border-t pt-2 font-semibold text-foreground">
          <span>Total</span>
          <span className="tabular-nums">{total}</span>
        </div>
      )}
      {clickable && (
        <p className="mt-2 border-t pt-2 text-[10px] text-muted-foreground/70">
          Click a segment to view students
        </p>
      )}
    </div>
  )
}

// ─── Level-based attendance mock data ────────────────────────────────────────

interface LevelAttendance {
  present: number
  lta: number
  total: number
}

const LEVEL_ATTENDANCE_DATA: Record<string, LevelAttendance> = {
  'Secondary 5': { present: 52, lta: 2, total: 55 },
  'Secondary 4': { present: 118, lta: 3, total: 122 },
  'Secondary 3': { present: 95, lta: 4, total: 101 },
  'Secondary 2': { present: 102, lta: 5, total: 109 },
  'Secondary 1': { present: 88, lta: 6, total: 96 },
  'Primary 6': { present: 38, lta: 1, total: 40 },
  'Primary 5': { present: 34, lta: 2, total: 36 },
  'Primary 4': { present: 30, lta: 1, total: 32 },
  'Primary 3': { present: 27, lta: 2, total: 30 },
}

function makeLevelMonthlyData(scale: number) {
  return MONTHLY_DATA.map((m) => ({
    ...m,
    latecoming:
      m.latecoming != null ? Math.round(m.latecoming * scale) || 1 : null,
    absentNoValid:
      m.absentNoValid != null ? Math.round(m.absentNoValid * scale) || 1 : null,
    absentValidPrivate:
      m.absentValidPrivate != null
        ? Math.round(m.absentValidPrivate * scale)
        : null,
    absentValidOfficial:
      m.absentValidOfficial != null
        ? Math.round(m.absentValidOfficial * scale) || 1
        : null,
    absentMC: m.absentMC != null ? Math.round(m.absentMC * scale) : null,
    pendingReason:
      m.pendingReason != null ? Math.round(m.pendingReason * scale) || 1 : null,
  }))
}

const LEVEL_MONTHLY: Record<string, typeof MONTHLY_DATA> = {
  'Secondary 5': makeLevelMonthlyData(1.2),
  'Secondary 4': makeLevelMonthlyData(2.5),
  'Secondary 3': makeLevelMonthlyData(2.1),
  'Secondary 2': makeLevelMonthlyData(2.3),
  'Secondary 1': makeLevelMonthlyData(1.9),
  'Primary 6': makeLevelMonthlyData(0.9),
  'Primary 5': makeLevelMonthlyData(0.8),
  'Primary 4': makeLevelMonthlyData(0.7),
  'Primary 3': makeLevelMonthlyData(0.6),
}

// ─── Level ring helpers ───────────────────────────────────────────────────────

function buildLevelRingSegments(att: LevelAttendance) {
  const absent = att.total - att.present - att.lta
  const segments = [
    { name: 'Present', value: att.present, color: '#12b886' },
    { name: 'LTA', value: att.lta, color: '#fd7e14' },
    { name: 'Absent', value: Math.max(absent, 0), color: '#fa5252' },
  ]
  let acc = 0
  return segments.map((seg) => {
    const len = (seg.value / att.total) * RING_C
    const dashoffset = acc === 0 ? 0 : RING_C - acc
    acc += len
    return { ...seg, len, dashoffset }
  })
}

// ─── Attendance Students Table ────────────────────────────────────────────────

const ATT_PAGE_SIZE = 10
const ATT_ALL_CLASSES = ['4A', '4B', '4C', '4D']

interface AttendanceStudent {
  id: string
  name: string
  class: string
  late: number
  mc: number
  absentPendingReason: number
  nonVRAbsences: number
  absentValidPrivate: number
  absentValidOfficial: number
}

// Derive attendance table rows from mockStudents so the count matches
const ATTENDANCE_STUDENTS: Array<AttendanceStudent> = mockStudents.map(
  (s, i) => {
    // Spread values deterministically from existing student data
    const seed = i + 1
    const late = s.lateComing
    const mc = Math.max(0, (seed * 3) % 6)
    const absentPendingReason = Math.max(0, (seed * 2) % 5)
    const nonVRAbsences = s.absences
    const absentValidPrivate = Math.max(0, (seed * 4) % 4)
    const absentValidOfficial = Math.max(0, (seed * 6) % 3)
    return {
      id: s.id,
      name: s.name,
      class: s.class,
      late,
      mc,
      absentPendingReason,
      nonVRAbsences,
      absentValidPrivate,
      absentValidOfficial,
    }
  },
)

// ─── Filter / sort helpers for the attendance table ──────────────────────────

type FilterOp = 'gt' | 'gte' | 'lt' | 'lte' | 'eq'
type AttSortField =
  | 'name'
  | 'class'
  | 'late'
  | 'mc'
  | 'absentPendingReason'
  | 'nonVRAbsences'
  | 'absentValidPrivate'
  | 'absentValidOfficial'
  | 'total'
type AttSortDir = 'asc' | 'desc'

interface NumericFilter {
  op: FilterOp
  value: string
}

const OP_LABELS: Record<FilterOp, string> = {
  gt: 'greater than',
  gte: 'greater than or equal to',
  lt: 'less than',
  lte: 'less than or equal to',
  eq: 'equals',
}

const AVAILABLE_MONTHS = MONTHLY_DATA.map((m) => m.month)
// Reverse-chronological for the dropdown (most recent first)
const MONTH_OPTIONS = [...AVAILABLE_MONTHS].reverse()
// Current month abbreviation (Mar for 2026-03-10)
const DEFAULT_MONTH = AVAILABLE_MONTHS[AVAILABLE_MONTHS.length - 1] ?? 'all'
const DEFAULT_FILTER: NumericFilter = { op: 'gt', value: '' }

function matchesNumericFilter(value: number, filter: NumericFilter): boolean {
  if (filter.value === '') return true
  const n = Number(filter.value)
  if (isNaN(n)) return true
  switch (filter.op) {
    case 'gt':
      return value > n
    case 'gte':
      return value >= n
    case 'lt':
      return value < n
    case 'lte':
      return value <= n
    case 'eq':
      return value === n
  }
}

// Deterministically assign months to students based on their counts
const STUDENT_MONTHS: Array<Array<string>> = ATTENDANCE_STUDENTS.map((s, i) => {
  const total =
    s.nonVRAbsences +
    s.late +
    s.mc +
    s.absentPendingReason +
    s.absentValidPrivate +
    s.absentValidOfficial
  const count = Math.min(
    Math.max(Math.round(total / 4), 1),
    AVAILABLE_MONTHS.length,
  )
  const offset = (i * 3) % AVAILABLE_MONTHS.length
  return Array.from(
    { length: count },
    (_, j) => AVAILABLE_MONTHS[(offset + j) % AVAILABLE_MONTHS.length],
  )
})

function AttSortableHeader({
  label,
  field,
  sortField,
  sortDir,
  onSort,
  onClearSort,
  className,
  align = 'left',
  truncate = false,
}: {
  label: string
  field: AttSortField
  sortField: AttSortField | null
  sortDir: AttSortDir
  onSort: (f: AttSortField, dir: AttSortDir) => void
  onClearSort: () => void
  className?: string
  align?: 'left' | 'right'
  /** Truncate label with ellipsis when column is narrow */
  truncate?: boolean
}) {
  const [open, setOpen] = useState(false)
  const active = sortField === field
  const dir = active ? sortDir : null

  const triggerButton = (
    <PopoverTrigger
      render={
        <button
          type="button"
          className={cn(
            'inline-flex w-full items-center gap-1 overflow-hidden rounded-md px-2 py-1 -ml-2 transition-colors hover:bg-accent hover:text-accent-foreground cursor-pointer',
            align === 'right' && 'justify-end',
            active && 'text-primary',
          )}
        />
      }
    >
      <span className={cn('min-w-0', truncate ? 'truncate' : 'shrink-0')}>
        {label}
      </span>
      <span className="shrink-0">
        {dir === 'asc' ? (
          <ArrowUp className="h-3 w-3" />
        ) : dir === 'desc' ? (
          <ArrowDown className="h-3 w-3" />
        ) : (
          <ChevronDown className="h-3 w-3 opacity-40" />
        )}
      </span>
    </PopoverTrigger>
  )

  return (
    <th
      className={cn(
        'h-12 px-4 align-middle font-medium text-muted-foreground overflow-hidden',
        align === 'right' ? 'text-right' : 'text-left',
        className,
      )}
    >
      <Popover open={open} onOpenChange={setOpen}>
        {truncate ? (
          <TooltipUI>
            <TooltipTrigger
              render={
                <span style={{ display: 'inline-flex', width: '100%' }} />
              }
            >
              {triggerButton}
            </TooltipTrigger>
            <TooltipContent side="top">{label}</TooltipContent>
          </TooltipUI>
        ) : (
          triggerButton
        )}
        <PopoverContent
          align={align === 'right' ? 'end' : 'start'}
          className="w-52 gap-1 p-3"
        >
          <button
            type="button"
            onClick={() => {
              if (dir === 'asc') onClearSort()
              else onSort(field, 'asc')
              setOpen(false)
            }}
            className={cn(
              'flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-[var(--slate-5)]',
              dir === 'asc' && 'bg-[var(--slate-5)]',
            )}
          >
            <ArrowUp className="h-4 w-4 text-[var(--slate-11)]" />
            Sort ascending
            {dir === 'asc' && (
              <Check className="ml-auto h-4 w-4 text-[var(--slate-11)]" />
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              if (dir === 'desc') onClearSort()
              else onSort(field, 'desc')
              setOpen(false)
            }}
            className={cn(
              'flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-[var(--slate-5)]',
              dir === 'desc' && 'bg-[var(--slate-5)]',
            )}
          >
            <ArrowDown className="h-4 w-4 text-[var(--slate-11)]" />
            Sort descending
            {dir === 'desc' && (
              <Check className="ml-auto h-4 w-4 text-[var(--slate-11)]" />
            )}
          </button>
        </PopoverContent>
      </Popover>
    </th>
  )
}

function NumericFilterRow({
  label,
  filter,
  onChange,
}: {
  label: string
  filter: NumericFilter
  onChange: (f: NumericFilter) => void
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <Select
          value={filter.op}
          onValueChange={(v) => onChange({ ...filter, op: v as FilterOp })}
        >
          <SelectTrigger className="h-9 w-[180px] shrink-0 rounded-[14px] bg-white text-sm">
            <SelectValue>{OP_LABELS[filter.op]}</SelectValue>
          </SelectTrigger>
          <SelectContent
            className="min-w-max"
            align="start"
            alignItemWithTrigger={false}
          >
            {(Object.entries(OP_LABELS) as Array<[FilterOp, string]>).map(
              ([op, lbl]) => (
                <SelectItem key={op} value={op}>
                  {lbl}
                </SelectItem>
              ),
            )}
          </SelectContent>
        </Select>
        <Input
          placeholder="Enter number"
          value={filter.value}
          onChange={(e) => onChange({ ...filter, value: e.target.value })}
          className="h-8 text-sm"
          type="number"
          min={0}
        />
      </div>
    </div>
  )
}

function AttendanceStudentsTable({
  segment,
  onClearSegment,
}: {
  segment?: SegmentSelection | null
  onClearSegment?: () => void
}) {
  const navigate = useNavigate()
  const tableRef = useRef<HTMLDivElement>(null)
  const [search, setSearch] = useState('')
  const [filterClass, setFilterClass] = useState('all')
  const [filterMonth, setFilterMonth] = useState(DEFAULT_MONTH)
  const [filterLate, setFilterLate] = useState<NumericFilter>(DEFAULT_FILTER)
  const [filterMc, setFilterMc] = useState<NumericFilter>(DEFAULT_FILTER)
  const [filterPend, setFilterPend] = useState<NumericFilter>(DEFAULT_FILTER)
  const [filterNonVR, setFilterNonVR] = useState<NumericFilter>(DEFAULT_FILTER)
  const [filterValidPrivate, setFilterValidPrivate] =
    useState<NumericFilter>(DEFAULT_FILTER)
  const [filterValidOfficial, setFilterValidOfficial] =
    useState<NumericFilter>(DEFAULT_FILTER)
  const [filterOpen, setFilterOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [sortField, setSortField] = useState<AttSortField | null>('total')
  const [sortDir, setSortDir] = useState<AttSortDir>('desc')

  // Apply segment filter when chart segment is clicked
  useEffect(() => {
    if (!segment) return
    const { month, categoryKey } = segment
    // Reset all numeric filters first, then apply the relevant one
    setFilterMonth(month)
    setFilterLate(DEFAULT_FILTER)
    setFilterMc(DEFAULT_FILTER)
    setFilterPend(DEFAULT_FILTER)
    setFilterNonVR(DEFAULT_FILTER)
    setFilterValidPrivate(DEFAULT_FILTER)
    setFilterValidOfficial(DEFAULT_FILTER)
    const active: NumericFilter = { op: 'gte', value: '1' }
    if (categoryKey === 'latecoming') setFilterLate(active)
    else if (categoryKey === 'absentNoValid') setFilterNonVR(active)
    else if (categoryKey === 'absentMC') setFilterMc(active)
    else if (categoryKey === 'pendingReason') setFilterPend(active)
    else if (categoryKey === 'absentValidPrivate') setFilterValidPrivate(active)
    else if (categoryKey === 'absentValidOfficial')
      setFilterValidOfficial(active)
    // LTA uses an explicit student-ID filter (top N by total absences),
    // so no numeric filter is applied here.
    setPage(1)
    // Scroll table into view
    setTimeout(() => {
      tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
  }, [segment])

  const hasPopoverFilters =
    filterClass !== 'all' ||
    filterLate.value !== '' ||
    filterMc.value !== '' ||
    filterPend.value !== '' ||
    filterNonVR.value !== '' ||
    filterValidPrivate.value !== '' ||
    filterValidOfficial.value !== ''

  const activeFilterCount = [
    filterClass !== 'all',
    filterLate.value !== '',
    filterMc.value !== '',
    filterPend.value !== '',
    filterNonVR.value !== '',
    filterValidPrivate.value !== '',
    filterValidOfficial.value !== '',
  ].filter(Boolean).length

  const clearFilters = () => {
    setFilterClass('all')
    setFilterLate(DEFAULT_FILTER)
    setFilterMc(DEFAULT_FILTER)
    setFilterPend(DEFAULT_FILTER)
    setFilterNonVR(DEFAULT_FILTER)
    setFilterValidPrivate(DEFAULT_FILTER)
    setFilterValidOfficial(DEFAULT_FILTER)
    setPage(1)
  }

  const handleSort = (field: AttSortField, dir: AttSortDir) => {
    setSortField(field)
    setSortDir(dir)
    setPage(1)
  }

  const clearSort = () => {
    setSortField(null)
    setPage(1)
  }

  const ltaStudentIds = useMemo(() => {
    if (segment?.categoryKey !== 'lta') return null
    const totalOf = (s: AttendanceStudent) =>
      s.nonVRAbsences +
      s.absentPendingReason +
      s.mc +
      s.absentValidPrivate +
      s.absentValidOfficial
    const ranked = [...ATTENDANCE_STUDENTS].sort(
      (a, b) => totalOf(b) - totalOf(a),
    )
    return new Set(ranked.slice(0, segment.count).map((s) => s.id))
  }, [segment])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return ATTENDANCE_STUDENTS.filter((s, i) => {
      if (ltaStudentIds && !ltaStudentIds.has(s.id)) return false
      if (q && !s.name.toLowerCase().includes(q)) return false
      if (filterClass !== 'all' && s.class !== filterClass) return false
      if (filterMonth !== 'all' && !STUDENT_MONTHS[i]?.includes(filterMonth))
        return false
      if (!matchesNumericFilter(s.late, filterLate)) return false
      if (!matchesNumericFilter(s.mc, filterMc)) return false
      if (!matchesNumericFilter(s.absentPendingReason, filterPend)) return false
      if (!matchesNumericFilter(s.nonVRAbsences, filterNonVR)) return false
      if (!matchesNumericFilter(s.absentValidPrivate, filterValidPrivate))
        return false
      if (!matchesNumericFilter(s.absentValidOfficial, filterValidOfficial))
        return false
      return true
    })
  }, [
    ltaStudentIds,
    search,
    filterClass,
    filterMonth,
    filterLate,
    filterMc,
    filterPend,
    filterNonVR,
    filterValidPrivate,
    filterValidOfficial,
  ])

  const sorted = useMemo(() => {
    if (!sortField) return filtered
    return [...filtered].sort((a, b) => {
      let cmp = 0
      if (sortField === 'name') cmp = a.name.localeCompare(b.name)
      else if (sortField === 'class') cmp = a.class.localeCompare(b.class)
      else if (sortField === 'total')
        cmp =
          a.nonVRAbsences +
          a.absentPendingReason +
          a.mc +
          a.absentValidPrivate +
          a.absentValidOfficial -
          (b.nonVRAbsences +
            b.absentPendingReason +
            b.mc +
            b.absentValidPrivate +
            b.absentValidOfficial)
      else cmp = a[sortField] - b[sortField]
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [filtered, sortField, sortDir])

  const totalPages = Math.max(1, Math.ceil(sorted.length / ATT_PAGE_SIZE))
  const paged = sorted.slice((page - 1) * ATT_PAGE_SIZE, page * ATT_PAGE_SIZE)

  const segmentCat = segment
    ? segment.categoryKey === 'lta'
      ? { key: 'lta', label: 'LTA', color: '#fd7e14' }
      : BAR_CATEGORIES.find((c) => c.key === segment.categoryKey)
    : null

  return (
    <div ref={tableRef} className="scroll-mt-8 rounded-lg border bg-white p-4">
      <div className="mb-3 flex items-center gap-2">
        <p className="text-sm font-semibold text-foreground">
          Students sorted by absences / late-coming
        </p>
        {segment && segmentCat && (
          <span className="flex items-center gap-1.5 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
            <span
              className="inline-block h-2 w-2 shrink-0 rounded-sm"
              style={{ backgroundColor: segmentCat.color }}
            />
            {segment.month !== 'all' && `${segment.month} · `}
            {segmentCat.label}
            <button
              type="button"
              onClick={onClearSegment}
              className="ml-0.5 rounded-full hover:text-blue-900"
              aria-label="Clear segment filter"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        )}
      </div>

      {/* Search + month selector + filter button */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative max-w-xs flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search name…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="h-8 pl-9 text-sm"
          />
        </div>

        {/* Month selector — always visible, visually prominent */}
        <Select
          value={filterMonth}
          onValueChange={(v) => {
            setFilterMonth(v)
            setPage(1)
          }}
        >
          <SelectTrigger
            size="sm"
            className="h-8 w-auto gap-1.5 rounded-[14px] border border-border bg-white px-3 text-sm hover:bg-muted"
          >
            <SelectValue>
              {filterMonth === 'all' ? 'All' : filterMonth}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {MONTH_OPTIONS.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Advanced filters */}
        <Popover open={filterOpen} onOpenChange={setFilterOpen}>
          <PopoverTrigger
            render={
              <button
                type="button"
                className={cn(
                  'border-border flex h-8 items-center gap-1.5 rounded-full border px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                  hasPopoverFilters
                    ? 'border-blue-300 bg-blue-50 text-blue-700'
                    : 'bg-white hover:bg-muted',
                )}
              />
            }
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filter
            {hasPopoverFilters && (
              <span className="ml-0.5 rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-medium leading-none text-white">
                {activeFilterCount}
              </span>
            )}
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4" align="end">
            <div className="space-y-4">
              <p className="text-sm font-semibold">Filter students</p>

              {/* Class */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Class
                </label>
                <Select
                  value={filterClass}
                  onValueChange={(v) => {
                    setFilterClass(v)
                    setPage(1)
                  }}
                >
                  <SelectTrigger size="sm" className="h-8 w-full">
                    <SelectValue>
                      {filterClass === 'all' ? 'All classes' : filterClass}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All classes</SelectItem>
                    {ATT_ALL_CLASSES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <NumericFilterRow
                label="Late"
                filter={filterLate}
                onChange={(f) => {
                  setFilterLate(f)
                  setPage(1)
                }}
              />
              <NumericFilterRow
                label="Non-VR absences"
                filter={filterNonVR}
                onChange={(f) => {
                  setFilterNonVR(f)
                  setPage(1)
                }}
              />
              <NumericFilterRow
                label="Pending reason"
                filter={filterPend}
                onChange={(f) => {
                  setFilterPend(f)
                  setPage(1)
                }}
              />
              <NumericFilterRow
                label="MC"
                filter={filterMc}
                onChange={(f) => {
                  setFilterMc(f)
                  setPage(1)
                }}
              />
              <NumericFilterRow
                label="Valid reason (private)"
                filter={filterValidPrivate}
                onChange={(f) => {
                  setFilterValidPrivate(f)
                  setPage(1)
                }}
              />
              <NumericFilterRow
                label="Valid reason (official)"
                filter={filterValidOfficial}
                onChange={(f) => {
                  setFilterValidOfficial(f)
                  setPage(1)
                }}
              />

              {hasPopoverFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-full gap-1.5 text-xs font-medium text-[var(--slate-12)]"
                  onClick={() => {
                    clearFilters()
                    setFilterOpen(false)
                  }}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full table-fixed text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="w-[96px] h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                Profile
              </th>
              <AttSortableHeader
                label="Name"
                field="name"
                sortField={sortField}
                sortDir={sortDir}
                onSort={handleSort}
                onClearSort={clearSort}
                className="w-[192px]"
              />
              <AttSortableHeader
                label="Class"
                field="class"
                sortField={sortField}
                sortDir={sortDir}
                onSort={handleSort}
                onClearSort={clearSort}
                className="w-[140px]"
              />
              <AttSortableHeader
                label="Total absences (days)"
                field="total"
                sortField={sortField}
                sortDir={sortDir}
                onSort={handleSort}
                onClearSort={clearSort}
                className="w-[200px]"
              />
              <AttSortableHeader
                label="Late"
                field="late"
                sortField={sortField}
                sortDir={sortDir}
                onSort={handleSort}
                onClearSort={clearSort}
                className="w-[140px]"
              />
              <AttSortableHeader
                label="Non-VR absences"
                field="nonVRAbsences"
                sortField={sortField}
                sortDir={sortDir}
                onSort={handleSort}
                onClearSort={clearSort}
                className="w-[140px]"
                truncate
              />
              <AttSortableHeader
                label="Pending reason"
                field="absentPendingReason"
                sortField={sortField}
                sortDir={sortDir}
                onSort={handleSort}
                onClearSort={clearSort}
                className="w-[140px]"
                truncate
              />
              <AttSortableHeader
                label="MC"
                field="mc"
                sortField={sortField}
                sortDir={sortDir}
                onSort={handleSort}
                onClearSort={clearSort}
                className="w-[140px]"
              />
              <AttSortableHeader
                label="Valid reason (private)"
                field="absentValidPrivate"
                sortField={sortField}
                sortDir={sortDir}
                onSort={handleSort}
                onClearSort={clearSort}
                className="w-[140px]"
                truncate
              />
              <AttSortableHeader
                label="Valid reason (official)"
                field="absentValidOfficial"
                sortField={sortField}
                sortDir={sortDir}
                onSort={handleSort}
                onClearSort={clearSort}
                className="w-[140px]"
                truncate
              />
            </tr>
          </thead>
          <tbody className="divide-y">
            {paged.map((s) => {
              const realId = studentIdByName.get(s.name)
              return (
              <tr
                key={s.id}
                className={cn(
                  'transition-colors hover:bg-muted/50',
                  realId && 'cursor-pointer',
                )}
                onClick={() => {
                  if (realId) navigate({ to: '/students/$id', params: { id: realId } })
                }}
              >
                <td className="w-[96px] p-4 align-middle">
                  <TooltipUI>
                    <TooltipTrigger>
                      {realId ? (
                        <Link
                          to="/students/$id"
                          params={{ id: realId }}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center justify-center rounded p-0.5 text-blue-500 hover:bg-blue-50 hover:text-blue-600"
                        >
                          <FileText className="h-4 w-4" />
                        </Link>
                      ) : (
                        <span className="flex items-center justify-center rounded p-0.5 text-muted-foreground">
                          <FileText className="h-4 w-4" />
                        </span>
                      )}
                    </TooltipTrigger>
                    <TooltipContent>
                      {realId
                        ? 'View student profile'
                        : 'Profile not available'}
                    </TooltipContent>
                  </TooltipUI>
                </td>
                <td className="w-[192px] p-4 align-middle font-medium">
                  {s.name}
                </td>
                <td className="min-w-[140px] p-4 align-middle">{s.class}</td>
                <td className="min-w-[200px] p-4 align-middle tabular-nums">
                  {s.nonVRAbsences +
                    s.absentPendingReason +
                    s.mc +
                    s.absentValidPrivate +
                    s.absentValidOfficial}
                </td>
                <td className="min-w-[140px] p-4 align-middle tabular-nums">
                  {s.late}
                </td>
                <td className="min-w-[140px] p-4 align-middle tabular-nums">
                  {s.nonVRAbsences}
                </td>
                <td className="min-w-[140px] p-4 align-middle tabular-nums">
                  {s.absentPendingReason}
                </td>
                <td className="min-w-[140px] p-4 align-middle tabular-nums">
                  {s.mc}
                </td>
                <td className="min-w-[140px] p-4 align-middle tabular-nums">
                  {s.absentValidPrivate}
                </td>
                <td className="min-w-[140px] p-4 align-middle tabular-nums">
                  {s.absentValidOfficial}
                </td>
              </tr>
              )
            })}
            {paged.length === 0 && (
              <tr>
                <td
                  colSpan={10}
                  className="px-4 py-8 text-center text-sm text-muted-foreground"
                >
                  No students match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="text-xs text-muted-foreground">
          {(page - 1) * ATT_PAGE_SIZE + 1}–
          {Math.min(page * ATT_PAGE_SIZE, sorted.length)} of {sorted.length}{' '}
          records
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(
              (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1,
            )
            .reduce<Array<number | '…'>>((acc, p, i, arr) => {
              if (i > 0 && p - arr[i - 1] > 1) acc.push('…')
              acc.push(p)
              return acc
            }, [])
            .map((p, i) =>
              p === '…' ? (
                <span
                  key={`ellipsis-${i}`}
                  className="px-1 text-muted-foreground"
                >
                  …
                </span>
              ) : (
                <Button
                  key={p}
                  variant={p === page ? 'default' : 'outline'}
                  size="icon"
                  className="h-7 w-7 text-xs"
                  onClick={() => setPage(p)}
                >
                  {p}
                </Button>
              ),
            )}
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Level Attendance Analytics (for Student Analytics page) ─────────────────

interface SegmentSelection {
  month: string
  categoryKey: string
  count: number
}

function getStudentsForSegment(
  categoryKey: string,
  count: number,
): typeof mockStudents {
  // Deterministically pick students based on category key
  const offset = BAR_CATEGORIES.findIndex((c) => c.key === categoryKey)
  const pool = [...mockStudents]
  // rotate the pool by offset to get different students per category
  const rotated = [
    ...pool.slice(offset % pool.length),
    ...pool.slice(0, offset % pool.length),
  ]
  return rotated.slice(0, Math.min(count, rotated.length))
}

export function AttendanceLevelAnalytics() {
  const [level, setLevel] = useState('Secondary 4')
  const [chartExpanded, setChartExpanded] = useState(false)
  const [selectedSegment, setSelectedSegment] =
    useState<SegmentSelection | null>(null)

  const attendance = LEVEL_ATTENDANCE_DATA[level] ?? {
    present: 100,
    lta: 2,
    total: 105,
  }
  const monthlyData = LEVEL_MONTHLY[level] ?? MONTHLY_DATA
  const ringSegments = buildLevelRingSegments(attendance)
  const presentPct = Math.round((attendance.present / attendance.total) * 100)
  const ltaPct = ((attendance.lta / attendance.total) * 100).toFixed(1)

  return (
    <div className="mt-6 space-y-10">
      <div>
        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-2">
          <LevelDropdown value={level} onValueChange={setLevel} />
        </div>

        {/* Cards */}
        <div className="mt-4 grid grid-cols-1 gap-4">
          {/* Current Attendance card */}
          <div className="rounded-lg border bg-white p-4">
            <p className="mb-4 text-sm font-semibold text-foreground">
              Current attendance
            </p>
            <div className="flex items-center gap-6">
              <AttendanceRing
                percentage={presentPct}
                size={100}
                color="#228be6"
              />
              <div className="flex items-center gap-5">
                <div>
                  <p className="text-xs text-muted-foreground">Term 4</p>
                  <p className="text-2xl font-semibold">
                    {attendance.present} / {attendance.total}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Students present
                  </p>
                </div>
                <div className="space-y-1.5 border-l pl-5 text-xs">
                  <p className="flex items-baseline gap-2">
                    <span className="w-8 text-right font-semibold tabular-nums text-foreground">
                      {attendance.present}
                    </span>
                    <span className="text-muted-foreground">
                      Present ({presentPct}%)
                    </span>
                  </p>
                  <TooltipUI>
                    <TooltipTrigger
                      render={
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedSegment({
                              month: 'all',
                              categoryKey: 'lta',
                              count: attendance.lta,
                            })
                          }
                          className="-mx-2 flex items-center gap-2 rounded-md px-2 py-1 transition-colors hover:bg-accent cursor-pointer"
                        />
                      }
                    >
                      <span className="w-8 text-right font-semibold tabular-nums text-foreground">
                        {attendance.lta}
                      </span>
                      <span className="text-muted-foreground">
                        LTA ({ltaPct}%)
                      </span>
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent side="top">View students</TooltipContent>
                  </TooltipUI>
                </div>
              </div>
            </div>
          </div>

          {/* Absences / Late-coming by Month card */}
          <div className="rounded-lg border bg-white p-4 [&_svg:focus]:outline-none [&_svg]:outline-none">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">
                Absences / Late-coming by month
              </p>
              <button
                onClick={() => setChartExpanded(true)}
                className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Expand chart"
              >
                <Maximize2 className="h-4 w-4" />
              </button>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <AbsenceBarChart
                data={monthlyData}
                onSegmentClick={(month, categoryKey, count) =>
                  setSelectedSegment({ month, categoryKey, count })
                }
              />
            </ResponsiveContainer>
            <AbsenceLegend />
          </div>
        </div>
      </div>

      {/* Students sorted by absences / late-coming */}
      <AttendanceStudentsTable
        segment={selectedSegment}
        onClearSegment={() => setSelectedSegment(null)}
      />

      {/* Expanded overlay */}
      {chartExpanded && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/20"
            onClick={() => setChartExpanded(false)}
            role="presentation"
          />
          <div
            className="fixed inset-6 z-50 flex flex-col rounded-xl border bg-white p-6 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-label="Absences / Late-coming by Month"
            tabIndex={-1}
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Escape') setChartExpanded(false)
            }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">
                Absences / Late-coming by month
              </h3>
              <button
                onClick={() => setChartExpanded(false)}
                className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Close chart"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="min-h-0 flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <AbsenceBarChart
                  data={monthlyData}
                  barSize={36}
                  onSegmentClick={(month, categoryKey, count) => {
                    setChartExpanded(false)
                    setSelectedSegment({ month, categoryKey, count })
                  }}
                />
              </ResponsiveContainer>
            </div>
            <AbsenceLegend />
          </div>
        </>
      )}
    </div>
  )
}

// ─── Individual Student Attendance Analytics ──────────────────────────────────

const DETAILS_TYPE_OPTIONS = [...new Set(ABSENCE_DETAILS.map((r) => r.type))]

interface AttendanceAnalyticsProps {
  student: Student
}

export function AttendanceAnalytics({ student }: AttendanceAnalyticsProps) {
  const [chartExpanded, setChartExpanded] = useState(false)
  const [detailsPage, setDetailsPage] = useState(1)
  const [detailsFilterMonth, setDetailsFilterMonth] = useState('all')
  const [detailsFilterType, setDetailsFilterType] = useState('all')

  const attendancePct =
    student.totalSchoolDays > 0
      ? Math.round((student.daysPresent / student.totalSchoolDays) * 100)
      : 0

  const currentAttendance = useMemo(() => {
    const total = 12
    const present = Math.max(0, Math.min(total, Math.round((attendancePct * total) / 100)))
    return { present, total }
  }, [attendancePct])

  const ringSegments = useMemo(() => {
    const total = currentAttendance.total
    const present = currentAttendance.present
    const remaining = total - present
    // Distribute remaining days across Late, Absent pending, Absent excl
    const late = Math.max(0, Math.round(remaining * 0.2))
    const absentPending = Math.max(0, Math.round(remaining * 0.45))
    const absentExcl = Math.max(0, remaining - late - absentPending)
    let acc = 0
    return [
      { name: 'Present', value: present, color: '#12b886' },
      { name: 'Late', value: late, color: '#fd7e14' },
      { name: 'Absent pending reason', value: absentPending, color: '#fa5252' },
      { name: 'Absent (excl pending reason)', value: absentExcl, color: '#ffa94d' },
    ].map((seg) => {
      const len = total > 0 ? (seg.value / total) * RING_C : 0
      const dashoffset = acc === 0 ? 0 : RING_C - acc
      acc += len
      return { ...seg, len, dashoffset }
    })
  }, [currentAttendance])

  const weeklyRate = useMemo(() => {
    const variations = [1.15, 0.6, 1.1, 0.95, 1.2]
    return variations.map((v, i) => ({
      week: `Week ${i + 1}`,
      rate: Math.max(0, Math.min(100, Math.round(attendancePct * v))),
    }))
  }, [attendancePct])

  const filteredDetails = ABSENCE_DETAILS.filter((r) => {
    const month = r.date.split(' ')[1]
    if (detailsFilterMonth !== 'all' && month !== detailsFilterMonth)
      return false
    if (detailsFilterType !== 'all' && r.type !== detailsFilterType)
      return false
    return true
  })

  const detailsTotalPages = Math.max(
    1,
    Math.ceil(filteredDetails.length / DETAILS_PAGE_SIZE),
  )
  const pagedDetails = filteredDetails.slice(
    (detailsPage - 1) * DETAILS_PAGE_SIZE,
    detailsPage * DETAILS_PAGE_SIZE,
  )

  return (
    <div className="mt-6 space-y-8 border-t pt-6">
      {/* 1. Current term */}
      <div>
        <h3 className="mb-4 text-sm font-semibold text-foreground">
          Current attendance
        </h3>
        <div className="flex items-center gap-6">
          <AttendanceRing
            percentage={
              (currentAttendance.present / currentAttendance.total) * 100
            }
            size={100}
            color="#228be6"
          />
          <div className="flex items-center gap-5">
            <div>
              <p className="text-xs text-muted-foreground">Attendance</p>
              <p className="text-2xl font-semibold">
                {currentAttendance.present} / {currentAttendance.total}
              </p>
              <p className="text-xs text-muted-foreground">Days present</p>
            </div>
            <div className="space-y-1 border-l pl-5 text-xs text-muted-foreground">
              {ringSegments.filter((s) => s.name !== 'Present').map((s) => (
                <p key={s.name} className="flex items-baseline gap-2">
                  <span className="font-semibold text-foreground">
                    {s.value}
                  </span>
                  {s.name}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Weekly Attendance Rate */}
      <div>
        <h3 className="mb-4 text-sm font-semibold text-foreground">
          Weekly Attendance Rate
        </h3>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart
            data={weeklyRate}
            margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#e9ecef"
            />
            <XAxis
              dataKey="week"
              tick={{ fontSize: 12, fill: '#868e96' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              tick={{ fontSize: 12, fill: '#868e96' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={(value: number) => [`${value}%`, 'Attendance rate']}
              contentStyle={{
                fontSize: 12,
                borderRadius: 6,
                border: '1px solid #dee2e6',
              }}
            />
            <Line
              type="monotone"
              dataKey="rate"
              stroke="#228be6"
              strokeWidth={2}
              dot={{ fill: '#228be6', r: 4, strokeWidth: 0 }}
              label={{
                position: 'top',
                fontSize: 11,
                fill: '#495057',
                formatter: (v: number) => (v < 100 ? `${v}%` : ''),
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 3. Absences / Late-coming by Month */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">
            Absences / Late-coming by month
          </h3>
          <button
            onClick={() => setChartExpanded(true)}
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Expand chart"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <AbsenceBarChart />
        </ResponsiveContainer>
        <AbsenceLegend />
      </div>

      {/* Expanded overlay */}
      {chartExpanded && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/20"
            onClick={() => setChartExpanded(false)}
            role="presentation"
          />
          <div
            className="fixed inset-6 z-50 flex flex-col rounded-xl border bg-white p-6 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-label="Absences / Late-coming by Month"
            tabIndex={-1}
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Escape') setChartExpanded(false)
            }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">
                Absences / Late-coming by month
              </h3>
              <button
                onClick={() => setChartExpanded(false)}
                className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Close chart"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="min-h-0 flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <AbsenceBarChart barSize={36} />
              </ResponsiveContainer>
            </div>
            <AbsenceLegend />
          </div>
        </>
      )}

      {/* 4. Absences / Late-coming details */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">
            Absences / Late-coming details
          </h3>
          <div className="flex items-center gap-2">
            {/* Month filter */}
            <Select
              value={detailsFilterMonth}
              onValueChange={(v) => {
                setDetailsFilterMonth(v)
                setDetailsPage(1)
              }}
            >
              <SelectTrigger
                size="sm"
                className="h-8 w-auto gap-1.5 rounded-[14px] border border-border bg-white px-3 text-sm hover:bg-muted"
              >
                <SelectValue>
                  {detailsFilterMonth === 'all'
                    ? 'Current year'
                    : detailsFilterMonth}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Current year</SelectItem>
                {MONTH_OPTIONS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* Type filter */}
            <Select
              value={detailsFilterType}
              onValueChange={(v) => {
                setDetailsFilterType(v)
                setDetailsPage(1)
              }}
            >
              <SelectTrigger
                size="sm"
                className="h-8 w-auto gap-1.5 rounded-[14px] border border-border bg-white px-3 text-sm hover:bg-muted"
              >
                <SelectValue>
                  {detailsFilterType === 'all'
                    ? 'All types'
                    : detailsFilterType}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="min-w-max">
                <SelectItem value="all">All types</SelectItem>
                {DETAILS_TYPE_OPTIONS.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Date
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Absences / Latecoming
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Sub-reason
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Remarks
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {pagedDetails.map((row, i) => (
                <tr key={i} className="bg-white">
                  <td className="px-4 py-3 text-sm text-foreground">
                    {row.date}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-[var(--slate-12)]">
                    {row.type}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {row.subReason}
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground">
                    {row.remarks}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="text-xs text-muted-foreground">
            {filteredDetails.length === 0
              ? '0 records'
              : `${(detailsPage - 1) * DETAILS_PAGE_SIZE + 1}–${Math.min(detailsPage * DETAILS_PAGE_SIZE, filteredDetails.length)} of ${filteredDetails.length} records`}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              disabled={detailsPage === 1}
              onClick={() => setDetailsPage((p) => p - 1)}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            {Array.from({ length: detailsTotalPages }, (_, i) => i + 1)
              .filter(
                (p) =>
                  p === 1 ||
                  p === detailsTotalPages ||
                  Math.abs(p - detailsPage) <= 1,
              )
              .reduce<Array<number | '…'>>((acc, p, i, arr) => {
                if (i > 0 && p - arr[i - 1] > 1) acc.push('…')
                acc.push(p)
                return acc
              }, [])
              .map((p, i) =>
                p === '…' ? (
                  <span
                    key={`ellipsis-${i}`}
                    className="px-1 text-muted-foreground"
                  >
                    …
                  </span>
                ) : (
                  <Button
                    key={p}
                    variant={p === detailsPage ? 'default' : 'outline'}
                    size="icon"
                    className="h-7 w-7 text-xs"
                    onClick={() => setDetailsPage(p)}
                  >
                    {p}
                  </Button>
                ),
              )}
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              disabled={detailsPage === detailsTotalPages}
              onClick={() => setDetailsPage((p) => p + 1)}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
