import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
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
import { Link, useNavigate } from '@tanstack/react-router'
import {
  ATTENDANCE_SEVERITY,
  CHART_GRID,
  CHART_LABEL,
  CHART_SURFACE,
  CHART_TICK,
  CHART_TOOLTIP_BORDER,
  GRADE_FILL,
  PRESENT_RING,
  SERIES_BLUE,
  SERIES_BLUE_COBALT,
  SERIES_BLUE_LIGHT,
} from '@/lib/chart-colors'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  TooltipContent,
  TooltipTrigger,
  Tooltip as TooltipUI,
} from '@/components/ui/tooltip'
import { groupedClassOptions, mockStudents } from '@/data/mock-students'

// Build a name → student ID lookup from the real student roster
const studentIdByName = new Map(mockStudents.map((s) => [s.name, s.id]))

// ---------------------------------------------------------------------------
// Data constants — Trends section
// ---------------------------------------------------------------------------

const SUBJECTS_BANDING = [
  { subject: 'Geography (G2)', grade: 'C5' },
  { subject: 'Mother Tongue (G2)', grade: 'C5' },
  { subject: 'English (G3)', grade: 'B4' },
  { subject: 'Mathematics (G3)', grade: 'A2' },
  { subject: 'Science (G3)', grade: 'C5' },
  { subject: 'History (G3)', grade: 'B3' },
]

const PERFORMANCE_DATA = [
  {
    subject: 'Geography',
    term1WA: 60,
    term2WA: 64,
    term3WA: 65,
    endOfYear: 64,
    overall: 63,
  },
  {
    subject: 'Mother Tongue',
    term1WA: 92,
    term2WA: 94,
    term3WA: 88,
    endOfYear: 88,
    overall: 85,
  },
  {
    subject: 'English',
    term1WA: 89,
    term2WA: 85,
    term3WA: 81,
    endOfYear: 79,
    overall: 80,
  },
  {
    subject: 'Mathematics',
    term1WA: 73,
    term2WA: 80,
    term3WA: 74,
    endOfYear: 70,
    overall: 70,
  },
  {
    subject: 'Science',
    term1WA: 92,
    term2WA: 92,
    term3WA: 87,
    endOfYear: 81,
    overall: 86,
  },
  {
    subject: 'History',
    term1WA: 76,
    term2WA: 75,
    term3WA: 68,
    endOfYear: 72,
    overall: 72,
  },
]

const G2_COUNT = 2
const G3_COUNT = 4
const TOTAL_SUBJECTS = G2_COUNT + G3_COUNT

const BAR_COLORS = {
  term1WA: SERIES_BLUE_COBALT, // cobalt blue — matches attendance chart
  term2WA: SERIES_BLUE, // blue
  term3WA: SERIES_BLUE_LIGHT, // light blue
  endOfYear: ATTENDANCE_SEVERITY.late, // yellow
  overall: ATTENDANCE_SEVERITY.nonVRAbsence, // orange
}

const LEGEND_ITEMS = [
  { key: 'term1WA', label: 'Term 1 WA', color: BAR_COLORS.term1WA },
  { key: 'term2WA', label: 'Term 2 WA', color: BAR_COLORS.term2WA },
  { key: 'term3WA', label: 'Term 3 WA', color: BAR_COLORS.term3WA },
  { key: 'endOfYear', label: 'End-of-year Exam', color: BAR_COLORS.endOfYear },
  { key: 'overall', label: 'Overall', color: BAR_COLORS.overall },
]

const CHART_TOOLTIP_FORMATTER = (value: number, name: string) => {
  const labels: Record<string, string> = {
    term1WA: 'Term 1 WA',
    term2WA: 'Term 2 WA',
    term3WA: 'Term 3 WA',
    endOfYear: 'End-of-year Exam',
    overall: 'Overall',
  }
  return [`${value}%`, labels[name] ?? name]
}

// ---------------------------------------------------------------------------
// Data constants — Distribution section (Monitoring tab)
// ---------------------------------------------------------------------------

const MOE_SUBJECT_GROUPS = [
  {
    group: 'Languages',
    subjects: [
      { value: 'el-g1', label: 'EL - G1' },
      { value: 'el-g2', label: 'EL - G2' },
      { value: 'el-g3', label: 'EL - G3' },
      { value: 'mt-g1', label: 'MT - G1' },
      { value: 'mt-g2', label: 'MT - G2' },
      { value: 'mt-g3', label: 'MT - G3' },
    ],
  },
  {
    group: 'Mathematics',
    subjects: [
      { value: 'math-g1', label: 'Math - G1' },
      { value: 'math-g2', label: 'Math - G2' },
      { value: 'math-g3', label: 'Math - G3' },
      { value: 'amath-g3', label: 'A Math - G3' },
    ],
  },
  {
    group: 'Sciences',
    subjects: [
      { value: 'sci-g2', label: 'Sci - G2' },
      { value: 'sci-g3', label: 'Sci - G3' },
      { value: 'bio-g2', label: 'Biology - G2' },
      { value: 'bio-g3', label: 'Biology - G3' },
      { value: 'chem-g2', label: 'Chemistry - G2' },
      { value: 'chem-g3', label: 'Chemistry - G3' },
      { value: 'phy-g2', label: 'Physics - G2' },
      { value: 'phy-g3', label: 'Physics - G3' },
    ],
  },
  {
    group: 'Humanities',
    subjects: [
      { value: 'geog-g2', label: 'Geography - G2' },
      { value: 'geog-g3', label: 'Geography - G3' },
      { value: 'hist-g2', label: 'History - G2' },
      { value: 'hist-g3', label: 'History - G3' },
      { value: 'lit-g2', label: 'Literature - G2' },
      { value: 'lit-g3', label: 'Literature - G3' },
    ],
  },
  {
    group: 'Others',
    subjects: [
      { value: 'art-g2', label: 'Art - G2' },
      { value: 'art-g3', label: 'Art - G3' },
      { value: 'dt-g2', label: 'D&T - G2' },
      { value: 'dt-g3', label: 'D&T - G3' },
      { value: 'fce-g2', label: 'FCE - G2' },
      { value: 'fce-g3', label: 'FCE - G3' },
      { value: 'music-g2', label: 'Music - G2' },
      { value: 'music-g3', label: 'Music - G3' },
      { value: 'poa-g2', label: 'Principles of Acc - G2' },
      { value: 'poa-g3', label: 'Principles of Acc - G3' },
      { value: 'comp-g2', label: 'Computing - G2' },
      { value: 'comp-g3', label: 'Computing - G3' },
    ],
  },
]

const ASSESSMENT_OPTIONS = [
  { value: 'term1wa', label: 'Term 1 WA' },
  { value: 'term2wa', label: 'Term 2 WA' },
  { value: 'term3wa', label: 'Term 3 WA' },
  { value: 'eoy', label: 'End-of-year Exam' },
  { value: 'overall', label: 'Overall' },
]

const INDICATOR_OPTIONS = ['Distinction', 'Pass'] as const

// Mock results data — Secondary 4, EL-G3, Term 1 WA
const QUICK_STATS = { total: 120, distinction: 42, pass: 68 }

const GRADE_DATA = [
  { grade: 'A1', count: 15 },
  { grade: 'A2', count: 27 },
  { grade: 'B3', count: 22 },
  { grade: 'B4', count: 18 },
  { grade: 'C5', count: 16 },
  { grade: 'C6', count: 12 },
  { grade: 'D7', count: 7 },
  { grade: 'VR', count: 3 },
]

const GRADE_BADGE_STYLE: Record<
  string,
  { backgroundColor: string; color: string }
> = {
  A1: {
    backgroundColor: `color-mix(in srgb, ${SERIES_BLUE} 15%, transparent)`,
    color: 'var(--color-twblue-12)',
  },
  A2: {
    backgroundColor: `color-mix(in srgb, ${SERIES_BLUE_LIGHT} 25%, transparent)`,
    color: 'var(--color-twblue-11)',
  },
  B3: {
    backgroundColor: `color-mix(in srgb, ${PRESENT_RING} 15%, transparent)`,
    color: PRESENT_RING,
  },
  B4: {
    backgroundColor: `color-mix(in srgb, ${GRADE_FILL.B4} 25%, transparent)`,
    color: PRESENT_RING,
  },
  C5: {
    backgroundColor: `color-mix(in srgb, ${ATTENDANCE_SEVERITY.nonVRAbsence} 15%, transparent)`,
    color: ATTENDANCE_SEVERITY.nonVRAbsenceStrong,
  },
  C6: {
    backgroundColor: `color-mix(in srgb, ${ATTENDANCE_SEVERITY.absentExcl} 25%, transparent)`,
    color: ATTENDANCE_SEVERITY.nonVRAbsenceStrong,
  },
  D7: {
    backgroundColor: `color-mix(in srgb, ${ATTENDANCE_SEVERITY.pendingReason} 15%, transparent)`,
    color: ATTENDANCE_SEVERITY.pendingReasonStrong,
  },
  VR: {
    backgroundColor: `color-mix(in srgb, ${GRADE_FILL.VR} 30%, transparent)`,
    color: CHART_LABEL,
  },
}

const BOX_PLOT_DATA = [
  { class: '4A', min: 52, q1: 65, median: 74, q3: 85, max: 97 },
  { class: '4B', min: 45, q1: 58, median: 68, q3: 78, max: 94 },
  { class: '4C', min: 40, q1: 52, median: 62, q3: 73, max: 90 },
  { class: '4D', min: 35, q1: 48, median: 57, q3: 68, max: 85 },
]

// ---------------------------------------------------------------------------
// Helpers — derive breakdown data from filter selection
// ---------------------------------------------------------------------------

function hashFilters(s: string): number {
  let h = 5381
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h) ^ s.charCodeAt(i)
  }
  return Math.abs(h)
}

const BASE_GRADE_COUNTS = [15, 27, 22, 18, 16, 12, 7, 3]

type BreakdownData = {
  quickStats: { total: number; distinction: number; pass: number }
  gradeData: Array<{ grade: string; count: number }>
  boxPlotData: typeof BOX_PLOT_DATA
}

function computeBreakdownData(
  level: string,
  subject: string,
  assessment: string,
): BreakdownData {
  const h = hashFilters(`${level}:${subject}:${assessment}`)

  const gradeData = GRADE_DATA.map((g, i) => ({
    grade: g.grade,
    count: Math.max(1, BASE_GRADE_COUNTS[i] + (((h >> (i * 4)) & 0xf) - 7)),
  }))

  const total = gradeData.reduce((sum, g) => sum + g.count, 0)
  const distinction = gradeData[0].count + gradeData[1].count
  const pass = gradeData.slice(0, 6).reduce((sum, g) => sum + g.count, 0)

  const offset = (h & 0x1f) - 15
  const boxPlotData = BOX_PLOT_DATA.map((d) => ({
    class: d.class,
    min: Math.max(0, d.min + offset),
    q1: Math.max(0, d.q1 + offset),
    median: Math.max(0, d.median + offset),
    q3: Math.min(100, d.q3 + offset),
    max: Math.min(100, d.max + offset),
  }))

  return { quickStats: { total, distinction, pass }, gradeData, boxPlotData }
}

const MOCK_CANDIDATES = [
  { id: '1', name: 'Chen Jun Kai', class: '4A', score: 92, grade: 'A1' },
  { id: '2', name: 'Vincent Koh Xin Yi', class: '4A', score: 91, grade: 'A1' },
  { id: '3', name: 'Mei Lin Huang', class: '4B', score: 90, grade: 'A1' },
  {
    id: '4',
    name: 'Darren Ong Wei Sheng',
    class: '4C',
    score: 89,
    grade: 'A1',
  },
  {
    id: '5',
    name: 'Isabelle Tay Hui Xian',
    class: '4A',
    score: 88,
    grade: 'A1',
  },
  { id: '6', name: 'Marcus Loh Jian Hao', class: '4D', score: 87, grade: 'A1' },
  {
    id: '7',
    name: 'Felicia Kwan Mei Yan',
    class: '4B',
    score: 86,
    grade: 'A1',
  },
  { id: '8', name: 'Ethan Goh Zhi Wei', class: '4C', score: 85, grade: 'A1' },
  { id: '9', name: 'Natasha Sim Jing Yi', class: '4A', score: 84, grade: 'A1' },
  {
    id: '10',
    name: 'Brandon Lee Yong Jun',
    class: '4D',
    score: 83,
    grade: 'A1',
  },
  { id: '11', name: 'Sim Xin Yi', class: '4B', score: 82, grade: 'A1' },
  { id: '12', name: 'Jing Wei Tan', class: '4C', score: 81, grade: 'A1' },
  { id: '13', name: 'Ryan Seah Kok Wee', class: '4A', score: 80, grade: 'A1' },
  { id: '14', name: 'Lau Hui Wen', class: '4D', score: 79, grade: 'A1' },
  { id: '15', name: 'Zachary Ng Jun Hao', class: '4B', score: 78, grade: 'A1' },
  { id: '16', name: 'Sarah Chan Jun Kai', class: '4A', score: 77, grade: 'A2' },
  { id: '17', name: 'Lam Wei Jie', class: '4B', score: 76, grade: 'A2' },
  {
    id: '18',
    name: 'Jessica Foo Mei Ling',
    class: '4C',
    score: 75,
    grade: 'A2',
  },
  {
    id: '19',
    name: 'Kenji Tan Yong Xian',
    class: '4D',
    score: 74,
    grade: 'A2',
  },
  { id: '20', name: 'Lena Chua Shu Min', class: '4A', score: 73, grade: 'A2' },
  { id: '21', name: 'Daniel Woo Kai Xin', class: '4B', score: 72, grade: 'A2' },
  { id: '22', name: 'Tricia Ho Yan Ling', class: '4C', score: 71, grade: 'A2' },
  { id: '23', name: 'Pang Wei Sheng', class: '4D', score: 70, grade: 'A2' },
  { id: '24', name: 'Chloe Lim Jia Hui', class: '4A', score: 69, grade: 'A2' },
  { id: '25', name: 'Wei Jie Pang', class: '4B', score: 68, grade: 'A2' },
  {
    id: '26',
    name: 'Jonathan Yeo Zhi Heng',
    class: '4C',
    score: 67,
    grade: 'A2',
  },
  { id: '27', name: 'Kenneth Koh Xin Yi', class: '4C', score: 66, grade: 'B3' },
  { id: '28', name: 'Liang Wei Jie', class: '4B', score: 65, grade: 'B3' },
  { id: '29', name: 'Sarah Tan Jun Kai', class: '4A', score: 64, grade: 'B3' },
  {
    id: '30',
    name: 'Wayne Cheng Xin Yi',
    class: '4D',
    score: 63,
    grade: 'B3',
  },
  {
    id: '31',
    name: 'Amanda Koh Shu Ling',
    class: '4A',
    score: 62,
    grade: 'B3',
  },
  {
    id: '32',
    name: 'Nicholas Tan Wei Xin',
    class: '4B',
    score: 61,
    grade: 'B3',
  },
  { id: '33', name: 'Toh Jia Wei', class: '4C', score: 60, grade: 'B3' },
  {
    id: '34',
    name: 'Joanne Lau Hui Shan',
    class: '4D',
    score: 59,
    grade: 'B3',
  },
  {
    id: '35',
    name: 'Javier Phua Boon Kiat',
    class: '4A',
    score: 58,
    grade: 'B3',
  },
  {
    id: '36',
    name: 'Valerie Chia Mei Xuan',
    class: '4B',
    score: 57,
    grade: 'B3',
  },
  {
    id: '37',
    name: 'Derrick Seow Jun Rui',
    class: '4C',
    score: 56,
    grade: 'B3',
  },
  {
    id: '38',
    name: 'Lim Shu Hui',
    class: '4D',
    score: 55,
    grade: 'B3',
  },
  { id: '39', name: 'Tan Wei Jie', class: '4B', score: 54, grade: 'B4' },
  { id: '40', name: 'Jason Chua Jun Kai', class: '4C', score: 53, grade: 'B4' },
  { id: '41', name: 'Lim Jun Hao', class: '4A', score: 52, grade: 'B4' },
  {
    id: '42',
    name: 'Cheryl Wong Xiu Min',
    class: '4D',
    score: 51,
    grade: 'B4',
  },
  { id: '43', name: 'Kelvin Ho Jia Ren', class: '4A', score: 50, grade: 'B4' },
  { id: '44', name: 'Sze Ying Ong', class: '4B', score: 49, grade: 'B4' },
  {
    id: '45',
    name: 'Reuben Lim Beng Seng',
    class: '4C',
    score: 48,
    grade: 'B4',
  },
  { id: '46', name: 'Nadia Tan Zhi Ling', class: '4D', score: 47, grade: 'B4' },
  { id: '47', name: 'Ong Kai Wen', class: '4A', score: 46, grade: 'B4' },
  { id: '48', name: 'Lim Xin Ying', class: '4B', score: 45, grade: 'B4' },
  {
    id: '49',
    name: 'Timothy Goh Kai Hong',
    class: '4C',
    score: 44,
    grade: 'B4',
  },
  { id: '50', name: 'Tan Shu Min', class: '4C', score: 43, grade: 'C5' },
  {
    id: '51',
    name: 'Rachel Wong Mei Ling',
    class: '4D',
    score: 42,
    grade: 'C5',
  },
  { id: '52', name: 'Kevin Ng Wei Ming', class: '4B', score: 41, grade: 'C5' },
  { id: '53', name: 'Goh Wei Liang', class: '4D', score: 40, grade: 'C5' },
  {
    id: '54',
    name: 'Serene Chua Jia Lin',
    class: '4A',
    score: 39,
    grade: 'C5',
  },
  { id: '55', name: 'Edwin Toh Kah Meng', class: '4B', score: 38, grade: 'C5' },
  {
    id: '56',
    name: 'Quek Mei Xuan',
    class: '4C',
    score: 37,
    grade: 'C5',
  },
  {
    id: '57',
    name: 'Gabriel Tan Jing Wei',
    class: '4D',
    score: 36,
    grade: 'C5',
  },
  {
    id: '58',
    name: 'Beatrice Kok Shu Xian',
    class: '4A',
    score: 35,
    grade: 'C5',
  },
  { id: '59', name: 'Alvin Png Wei Hao', class: '4B', score: 34, grade: 'C5' },
  { id: '60', name: 'Soph Yeo Jia Ning', class: '4C', score: 33, grade: 'C5' },
  { id: '61', name: 'Deon Lim Kang Wen', class: '4D', score: 32, grade: 'C5' },
  {
    id: '62',
    name: 'Samantha Quek Hui Ping',
    class: '4A',
    score: 31,
    grade: 'C5',
  },
  { id: '63', name: 'Lucas Wee Jun Xian', class: '4B', score: 30, grade: 'C5' },
  { id: '64', name: 'Soh Wei Jun', class: '4C', score: 29, grade: 'C5' },
  { id: '65', name: 'Hui Ying Chan', class: '4D', score: 28, grade: 'C5' },
  { id: '66', name: 'Emily Tan Shu Wen', class: '4A', score: 27, grade: 'C6' },
  { id: '67', name: 'Ryan Lim Zhi Hao', class: '4B', score: 26, grade: 'C6' },
  {
    id: '68',
    name: 'Chua Xin Tong',
    class: '4C',
    score: 25,
    grade: 'C6',
  },
  {
    id: '69',
    name: 'Stanley Foo Boon Tiong',
    class: '4D',
    score: 24,
    grade: 'C6',
  },
  { id: '70', name: 'Peiyi Tan Hui Jing', class: '4A', score: 23, grade: 'C6' },
  { id: '71', name: 'Foo Zhi Hong', class: '4B', score: 22, grade: 'C6' },
  {
    id: '72',
    name: 'Clarissa Ho Jia Hui',
    class: '4C',
    score: 21,
    grade: 'C6',
  },
  { id: '73', name: 'Wayne Sng Tze Wei', class: '4D', score: 20, grade: 'C6' },
  {
    id: '74',
    name: 'Jasmine Koh Wei Lin',
    class: '4A',
    score: 19,
    grade: 'C6',
  },
  { id: '75', name: 'Bryan Tan Jia Jun', class: '4B', score: 18, grade: 'C6' },
  {
    id: '76',
    name: 'Wee Jia Yi',
    class: '4C',
    score: 17,
    grade: 'C6',
  },
  {
    id: '77',
    name: 'Malcolm Lee Zheng Yi',
    class: '4D',
    score: 16,
    grade: 'C6',
  },
  {
    id: '78',
    name: 'Joshua Lee Wei Xuan',
    class: '4D',
    score: 15,
    grade: 'D7',
  },
  {
    id: '79',
    name: 'Yap Mei Qi',
    class: '4A',
    score: 14,
    grade: 'D7',
  },
  {
    id: '80',
    name: 'Ivan Chow Jun Sheng',
    class: '4B',
    score: 13,
    grade: 'D7',
  },
  { id: '81', name: 'Mei Qi Chia', class: '4C', score: 12, grade: 'D7' },
  { id: '82', name: 'Cheng Yong Han', class: '4D', score: 11, grade: 'D7' },
  {
    id: '83',
    name: 'Yolanda Sim Jia Hui',
    class: '4A',
    score: 10,
    grade: 'D7',
  },
  {
    id: '84',
    name: 'Patrick Chng Boon Seng',
    class: '4B',
    score: 9,
    grade: 'D7',
  },
  { id: '85', name: 'Fiona Loh Xiu Ting', class: '4C', score: 8, grade: 'VR' },
  { id: '86', name: 'Tay Kai Ming', class: '4D', score: 7, grade: 'VR' },
  { id: '87', name: 'Cheryl Ang Mei Kuan', class: '4A', score: 6, grade: 'VR' },
]

// ---------------------------------------------------------------------------
// Shared sub-components — Trends charts
// ---------------------------------------------------------------------------

function PerformanceBarChart({ barSize }: { barSize?: number }) {
  return (
    <BarChart
      data={PERFORMANCE_DATA}
      margin={{ top: 20, right: 8, left: -20, bottom: 4 }}
      barCategoryGap="20%"
      barGap={0}
      barSize={barSize}
    >
      <CartesianGrid
        strokeDasharray="3 3"
        vertical={false}
        stroke={CHART_GRID}
      />
      <XAxis
        dataKey="subject"
        tick={{ fontSize: 12, fill: CHART_TICK }}
        axisLine={false}
        tickLine={false}
      />
      <YAxis
        domain={[0, 100]}
        ticks={[0, 25, 50, 75, 100]}
        tick={{ fontSize: 12, fill: CHART_TICK }}
        axisLine={false}
        tickLine={false}
      />
      <Tooltip
        formatter={CHART_TOOLTIP_FORMATTER}
        contentStyle={{
          fontSize: 12,
          borderRadius: 6,
          border: `1px solid ${CHART_TOOLTIP_BORDER}`,
        }}
      />
      <Bar dataKey="term1WA" fill={BAR_COLORS.term1WA} radius={[2, 2, 0, 0]}>
        <LabelList position="top" style={{ fontSize: 10, fill: CHART_LABEL }} />
      </Bar>
      <Bar dataKey="term2WA" fill={BAR_COLORS.term2WA} radius={[2, 2, 0, 0]}>
        <LabelList position="top" style={{ fontSize: 10, fill: CHART_LABEL }} />
      </Bar>
      <Bar dataKey="term3WA" fill={BAR_COLORS.term3WA} radius={[2, 2, 0, 0]}>
        <LabelList position="top" style={{ fontSize: 10, fill: CHART_LABEL }} />
      </Bar>
      <Bar
        dataKey="endOfYear"
        fill={BAR_COLORS.endOfYear}
        radius={[2, 2, 0, 0]}
      >
        <LabelList position="top" style={{ fontSize: 10, fill: CHART_LABEL }} />
      </Bar>
      <Bar dataKey="overall" fill={BAR_COLORS.overall} radius={[2, 2, 0, 0]}>
        <LabelList position="top" style={{ fontSize: 10, fill: CHART_LABEL }} />
      </Bar>
    </BarChart>
  )
}

function PerformanceLegend() {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-4 text-xs">
      {LEGEND_ITEMS.map((item) => (
        <div key={item.key} className="flex items-center gap-1.5">
          <span
            className="h-3 w-3 shrink-0 rounded-sm"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-muted-foreground">{item.label}</span>
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Distribution section sub-components
// ---------------------------------------------------------------------------

// Level dropdown — mirrors ClassSelector style but compact
interface LevelDropdownProps {
  value: string
  onValueChange: (v: string) => void
}

export function LevelDropdown({ value, onValueChange }: LevelDropdownProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const displayLabel = (() => {
    for (const group of groupedClassOptions) {
      if (group.level === value) return group.level
      const match = group.classes.find((c) => c.value === value)
      if (match) return match.label
    }
    return value
  })()

  const filteredGroups = useMemo(() => {
    if (!search) return groupedClassOptions
    const query = search.toLowerCase()
    return groupedClassOptions
      .map((group) => {
        const levelMatches = group.level.toLowerCase().includes(query)
        const matchingClasses = group.classes.filter(
          (c) =>
            c.label.toLowerCase().includes(query) ||
            c.value.toLowerCase().includes(query),
        )
        if (levelMatches) return group
        if (matchingClasses.length > 0)
          return { ...group, classes: matchingClasses }
        return null
      })
      .filter(Boolean) as typeof groupedClassOptions
  }, [search])

  const handleSelect = (v: string) => {
    onValueChange(v)
    setOpen(false)
    setSearch('')
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            type="button"
            className="border-border bg-card hover:bg-muted flex h-8 items-center gap-1.5 rounded-full border px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
          />
        }
      >
        <span className="text-muted-foreground">Level:</span>
        <span>{displayLabel}</span>
        <ChevronDown className="text-muted-foreground ml-0.5 h-4 w-4 shrink-0" />
      </PopoverTrigger>
      <PopoverContent
        className="w-64 overflow-hidden rounded-2xl p-0"
        align="start"
        collisionAvoidance={{ fallbackAxisSide: 'none' }}
      >
        <div className="p-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search filters"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>
        </div>
        <div className="max-h-72 overflow-y-auto p-1">
          {(!search || 'school'.includes(search.toLowerCase())) && (
            <>
              <button
                type="button"
                onClick={() => handleSelect('School')}
                className={cn(
                  'inline-flex w-full items-center gap-2 rounded-lg p-2 text-base font-normal leading-6 outline-none hover:bg-accent',
                  value === 'School' && 'bg-accent font-semibold',
                )}
              >
                <span className="line-clamp-1 flex-1 text-left">School</span>
                {value === 'School' && (
                  <Check className="ml-auto h-4 w-4 shrink-0" />
                )}
              </button>
              {filteredGroups.length > 0 && (
                <div className="my-1 h-px bg-border/50" />
              )}
            </>
          )}
          {filteredGroups.map((group, index) => (
            <div key={group.level}>
              {index > 0 && <div className="my-1 h-px bg-border/50" />}
              <button
                type="button"
                onClick={() => handleSelect(group.level)}
                className={cn(
                  'inline-flex w-full items-center gap-2 rounded-lg p-2 text-base font-normal leading-6 outline-none hover:bg-accent',
                  value === group.level && 'bg-accent font-semibold',
                )}
              >
                <span className="line-clamp-1 flex-1 text-left">
                  {group.level}
                </span>
                {value === group.level && (
                  <Check className="ml-auto h-4 w-4 shrink-0" />
                )}
              </button>
              {group.classes.map((cls) => (
                <button
                  key={cls.value}
                  type="button"
                  onClick={() => handleSelect(cls.value)}
                  className={cn(
                    'inline-flex w-full items-center gap-2 rounded-lg p-2 text-base font-normal leading-6 outline-none hover:bg-accent',
                    value === cls.value && 'bg-accent font-semibold',
                  )}
                >
                  <span className="line-clamp-1 flex-1 text-left">
                    {cls.label}
                  </span>
                  {value === cls.value && (
                    <Check className="ml-auto h-4 w-4 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

// Indicator multi-select
interface IndicatorDropdownProps {
  value: Array<string>
  onValueChange: (v: Array<string>) => void
}

function IndicatorDropdown({ value, onValueChange }: IndicatorDropdownProps) {
  const [open, setOpen] = useState(false)

  const label =
    value.length === 0
      ? 'Indicator'
      : value.length === INDICATOR_OPTIONS.length
        ? 'All indicators'
        : value.join(', ')

  const toggle = (option: string) => {
    onValueChange(
      value.includes(option)
        ? value.filter((v) => v !== option)
        : [...value, option],
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            type="button"
            className="border-border bg-card hover:bg-muted flex h-8 items-center gap-1.5 rounded-full border px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
          />
        }
      >
        <span className="text-muted-foreground">Indicator:</span>
        <span className={cn(value.length === 0 && 'text-muted-foreground')}>
          {label}
        </span>
        <ChevronDown className="text-muted-foreground ml-0.5 h-4 w-4 shrink-0" />
      </PopoverTrigger>
      <PopoverContent className="w-44 gap-0 p-2" align="start">
        {INDICATOR_OPTIONS.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => toggle(option)}
            className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-sm hover:bg-accent"
          >
            <Checkbox
              checked={value.includes(option)}
              className="pointer-events-none"
            />
            {option}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  )
}

// Custom tooltip for grade dist chart — shows "View X students" hint
function GradeDistTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload: { grade: string; count: number } }>
}) {
  if (!active || !payload?.length) return null
  const { grade, count } = payload[0].payload
  return (
    <div
      style={{
        fontSize: 12,
        borderRadius: 6,
        border: `1px solid ${CHART_TOOLTIP_BORDER}`,
        background: CHART_SURFACE,
        padding: '6px 10px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      }}
    >
      <div className="font-semibold text-foreground">{grade}</div>
      <div className="text-muted-foreground">{count} students</div>
    </div>
  )
}

// Grade distribution bar chart
function GradeDistChart({
  data,
  selectedGrade,
  onGradeClick,
}: {
  data: BreakdownData['gradeData']
  selectedGrade: string | null
  onGradeClick: (grade: string) => void
}) {
  const [hoveredGrade, setHoveredGrade] = useState<string | null>(null)

  return (
    <BarChart
      data={data}
      margin={{ top: 20, right: 8, left: -20, bottom: 4 }}
      barCategoryGap="25%"
      style={{ cursor: 'pointer' }}
      onMouseLeave={() => setHoveredGrade(null)}
      onMouseDown={(e: React.MouseEvent) => e.preventDefault()}
    >
      <CartesianGrid
        strokeDasharray="3 3"
        vertical={false}
        stroke={CHART_GRID}
      />
      <XAxis
        dataKey="grade"
        tick={{ fontSize: 12, fill: CHART_TICK }}
        axisLine={false}
        tickLine={false}
      />
      <YAxis
        tick={{ fontSize: 11, fill: CHART_TICK }}
        axisLine={false}
        tickLine={false}
      />
      <Tooltip
        content={<GradeDistTooltip />}
        cursor={{ fill: 'transparent', strokeWidth: 0 }}
      />
      <Bar
        dataKey="count"
        radius={[3, 3, 0, 0]}
        isAnimationActive={false}
        onMouseEnter={(barData: unknown) => {
          const grade = (barData as { grade?: string }).grade
          if (grade) setHoveredGrade(grade)
        }}
        onMouseLeave={() => setHoveredGrade(null)}
      >
        {data.map((entry) => (
          <Cell
            key={entry.grade}
            fill={SERIES_BLUE}
            opacity={1}
            style={{ cursor: 'pointer', outline: 'none' }}
            tabIndex={-1}
            onClick={() => onGradeClick(entry.grade)}
          />
        ))}
        <LabelList
          dataKey="count"
          position="top"
          style={{ fontSize: 11, fill: CHART_LABEL, fontWeight: 500 }}
        />
        <LabelList
          dataKey="count"
          content={(props) => {
            const {
              x = 0,
              y = 0,
              width = 0,
              height = 0,
              index = 0,
            } = props as {
              x?: number
              y?: number
              width?: number
              height?: number
              index?: number
            }
            const entry = data[index]
            if (
              height < 30 ||
              hoveredGrade === null ||
              entry.grade !== hoveredGrade
            )
              return <g />
            const cx = x + width / 2
            const cy = y + height / 2
            return (
              <g style={{ pointerEvents: 'none' }}>
                <text
                  x={cx}
                  y={cy - 6}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={9}
                  fill={CHART_LABEL}
                  fontWeight={500}
                >
                  View
                </text>
                <text
                  x={cx}
                  y={cy + 6}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={9}
                  fill={CHART_LABEL}
                  fontWeight={500}
                >
                  students
                </text>
              </g>
            )
          }}
        />
      </Bar>
    </BarChart>
  )
}

// Box plot — horizontal, pure SVG rendered via ResponsiveContainer
function BoxPlotSVGInner({
  width = 400,
  height = 280,
  data = BOX_PLOT_DATA,
}: {
  width?: number
  height?: number
  data?: BreakdownData['boxPlotData']
}) {
  const ml = 48,
    mr = 20,
    mt = 16,
    mb = 32
  const innerW = width - ml - mr
  const innerH = height - mt - mb
  const toX = (v: number) => ml + (v / 100) * innerW

  const rowH = innerH / data.length
  const bh = Math.max(rowH * 0.58, 16)
  const capH = 5
  const ticks = [0, 20, 40, 60, 80, 100]

  return (
    <svg width={width} height={height}>
      {/* Vertical grid lines */}
      {ticks.map((t) => (
        <line
          key={t}
          x1={toX(t)}
          y1={mt}
          x2={toX(t)}
          y2={height - mb}
          stroke={CHART_GRID}
          strokeDasharray="3 3"
        />
      ))}
      {/* X axis labels */}
      {ticks.map((t) => (
        <text
          key={t}
          x={toX(t)}
          y={height - mb + 16}
          textAnchor="middle"
          fontSize={11}
          fill={CHART_TICK}
        >
          {t}
        </text>
      ))}
      {/* Horizontal box plots */}
      {data.map((d, i) => {
        const cy = mt + rowH * i + rowH / 2
        const xMin = toX(d.min)
        const xQ1 = toX(d.q1)
        const xMed = toX(d.median)
        const xQ3 = toX(d.q3)
        const xMax = toX(d.max)

        return (
          <g key={d.class}>
            {/* Left whisker */}
            <line
              x1={xMin}
              y1={cy}
              x2={xQ1}
              y2={cy}
              stroke={CHART_TICK}
              strokeWidth={1.5}
            />
            <line
              x1={xMin}
              y1={cy - capH}
              x2={xMin}
              y2={cy + capH}
              stroke={CHART_TICK}
              strokeWidth={1.5}
            />
            {/* IQR box */}
            <rect
              x={xQ1}
              y={cy - bh / 2}
              width={xQ3 - xQ1}
              height={bh}
              fill={`color-mix(in srgb, ${SERIES_BLUE} 10%, transparent)`}
              stroke={SERIES_BLUE}
              strokeWidth={1.5}
              rx={2}
            />
            {/* Median line */}
            <line
              x1={xMed}
              y1={cy - bh / 2}
              x2={xMed}
              y2={cy + bh / 2}
              stroke={SERIES_BLUE}
              strokeWidth={2.5}
            />
            {/* Right whisker */}
            <line
              x1={xQ3}
              y1={cy}
              x2={xMax}
              y2={cy}
              stroke={CHART_TICK}
              strokeWidth={1.5}
            />
            <line
              x1={xMax}
              y1={cy - capH}
              x2={xMax}
              y2={cy + capH}
              stroke={CHART_TICK}
              strokeWidth={1.5}
            />
            {/* Class label */}
            <text
              x={ml - 8}
              y={cy + 4}
              textAnchor="end"
              fontSize={12}
              fill={CHART_TICK}
            >
              {d.class}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// ---------------------------------------------------------------------------
// AcademicAnalytics — Student 360 student profile (unchanged)
// ---------------------------------------------------------------------------

export function AcademicAnalytics() {
  const [chartExpanded, setChartExpanded] = useState(false)

  return (
    <div className="mt-6 space-y-8 border-t pt-6">
      {/* 1. Subjects taken and current grades */}
      <div>
        <h3 className="mb-4 text-sm font-semibold text-foreground">
          Subjects taken and current grades
        </h3>
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Subject
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Current grades
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {SUBJECTS_BANDING.map((row) => (
                <tr key={row.subject} className="bg-card">
                  <td className="px-4 py-3 text-sm text-foreground">
                    {row.subject}
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground">
                    {row.grade}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Results over time */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">
            Results over time
          </h3>
          <button
            onClick={() => setChartExpanded(true)}
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            title="Expand chart"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <PerformanceBarChart />
        </ResponsiveContainer>
        <div
          className="flex gap-2"
          style={{ paddingLeft: 28, paddingRight: 8 }}
        >
          <div className="flex flex-1 items-center justify-center border-t border-muted-foreground/30 py-1.5">
            <span className="text-xs font-semibold text-foreground">G2</span>
          </div>
          <div className="flex flex-[2] items-center justify-center border-t border-muted-foreground/30 py-1.5">
            <span className="text-xs font-semibold text-foreground">G3</span>
          </div>
        </div>
        <PerformanceLegend />
      </div>

      {/* Expanded overlay */}
      {chartExpanded && (
        <>
          <div
            className="fixed inset-0 z-40 bg-foreground/20"
            onClick={() => setChartExpanded(false)}
          />
          <div className="fixed inset-6 z-50 flex flex-col rounded-xl border bg-card p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">
                Results over time
              </h3>
              <button
                onClick={() => setChartExpanded(false)}
                className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="min-h-0 flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <PerformanceBarChart barSize={16} />
              </ResponsiveContainer>
            </div>
            <div
              className="flex gap-2"
              style={{ paddingLeft: 28, paddingRight: 8 }}
            >
              <div className="flex flex-1 items-center justify-center border-t border-muted-foreground/30 py-1.5">
                <span className="text-xs font-semibold text-foreground">
                  G2
                </span>
              </div>
              <div className="flex flex-[2] items-center justify-center border-t border-muted-foreground/30 py-1.5">
                <span className="text-xs font-semibold text-foreground">
                  G3
                </span>
              </div>
            </div>
            <PerformanceLegend />
          </div>
        </>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// MonitoringAcademicAnalytics — Student Analytics monitoring tab
// ---------------------------------------------------------------------------

const PAGE_SIZE = 10

const ALL_CLASSES = ['4A', '4B', '4C', '4D']
const ALL_GRADES = ['A1', 'A2', 'B3', 'B4', 'C5', 'C6', 'D7', 'VR']

export function MonitoringAcademicAnalytics() {
  const navigate = useNavigate()
  // Distribution filters
  const [level, setLevel] = useState('Secondary 4')
  const [subject, setSubject] = useState('el-g3')
  const [assessment, setAssessment] = useState('term1wa')
  const [indicators, setIndicators] = useState<Array<string>>([
    'Distinction',
    'Pass',
  ])

  // Trends filters
  const [trendsLevel, setTrendsLevel] = useState('Secondary 4')
  const [trendsSubject, setTrendsSubject] = useState('el-g3')

  // Grade drill-down state
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null)
  const candidatesTableRef = useRef<HTMLDivElement>(null)

  // Derived breakdown data — recomputes when filters change
  const breakdown = useMemo(
    () => computeBreakdownData(level, subject, assessment),
    [level, subject, assessment],
  )

  // Trend data — recomputes when trends filters change
  const trendData = useMemo(
    () =>
      ASSESSMENT_OPTIONS.map(({ value: assessKey, label }) => {
        const { quickStats } = computeBreakdownData(
          trendsLevel,
          trendsSubject,
          assessKey,
        )
        return {
          assessment: label,
          distinction: Math.round(
            (quickStats.distinction / quickStats.total) * 100,
          ),
          pass: Math.round((quickStats.pass / quickStats.total) * 100),
        }
      }),
    [trendsLevel, trendsSubject],
  )

  // Box plot container width
  const boxPlotContainerRef = useRef<HTMLDivElement>(null)
  const [boxPlotWidth, setBoxPlotWidth] = useState(400)
  useEffect(() => {
    const el = boxPlotContainerRef.current
    if (!el) return
    setBoxPlotWidth(el.offsetWidth)
    const observer = new ResizeObserver(([entry]) => {
      setBoxPlotWidth(entry.contentRect.width)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Candidates table — search + column filters
  const [candidateSearch, setCandidateSearch] = useState('')
  const [filterClass, setFilterClass] = useState<string>('all')
  const [filterGrade, setFilterGrade] = useState<string>('all')
  const [filterScoreMin, setFilterScoreMin] = useState('')
  const [filterScoreMax, setFilterScoreMax] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const [page, setPage] = useState(1)

  // Sync selectedGrade → filterGrade
  const handleGradeClick = (grade: string) => {
    const next = selectedGrade === grade ? null : grade
    setSelectedGrade(next)
    setFilterGrade(next ?? 'all')
    setPage(1)
    setTimeout(() => {
      candidatesTableRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }, 50)
  }

  const filteredCandidates = useMemo(() => {
    const q = candidateSearch.toLowerCase()
    const minScore = filterScoreMin !== '' ? Number(filterScoreMin) : null
    const maxScore = filterScoreMax !== '' ? Number(filterScoreMax) : null
    return MOCK_CANDIDATES.filter((c) => {
      if (
        q &&
        !c.name.toLowerCase().includes(q) &&
        !c.class.toLowerCase().includes(q)
      )
        return false
      if (filterClass !== 'all' && c.class !== filterClass) return false
      if (filterGrade !== 'all' && c.grade !== filterGrade) return false
      if (minScore !== null && c.score < minScore) return false
      if (maxScore !== null && c.score > maxScore) return false
      return true
    })
  }, [
    candidateSearch,
    filterClass,
    filterGrade,
    filterScoreMin,
    filterScoreMax,
  ])

  const totalPages = Math.max(
    1,
    Math.ceil(filteredCandidates.length / PAGE_SIZE),
  )
  const pagedCandidates = filteredCandidates.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  )

  const hasActiveTableFilters =
    filterClass !== 'all' ||
    filterGrade !== 'all' ||
    filterScoreMin !== '' ||
    filterScoreMax !== ''

  const clearTableFilters = () => {
    setFilterClass('all')
    setFilterGrade('all')
    setFilterScoreMin('')
    setFilterScoreMax('')
    setSelectedGrade(null)
    setPage(1)
  }

  return (
    <div className="mt-6 space-y-10 border-t pt-6">
      {/* ================================================================
          Section 1 — Distribution of subject performance
          ================================================================ */}
      <div>
        <h3 className="mb-4 text-xl font-semibold text-foreground">
          Breakdown of subject performance
        </h3>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-2">
          <LevelDropdown value={level} onValueChange={setLevel} />

          <Select value={subject} onValueChange={setSubject}>
            <SelectTrigger
              size="sm"
              className="h-8 w-auto gap-1.5 rounded-full border-border bg-card"
            >
              <span className="text-muted-foreground text-sm">Subject:</span>
              <SelectValue>
                {MOE_SUBJECT_GROUPS.flatMap((g) => g.subjects).find(
                  (s) => s.value === subject,
                )?.label ?? subject}
              </SelectValue>
            </SelectTrigger>
            <SelectContent align="start" alignItemWithTrigger={false}>
              {MOE_SUBJECT_GROUPS.map((grp) => (
                <SelectGroup key={grp.group}>
                  <SelectLabel>{grp.group}</SelectLabel>
                  {grp.subjects.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>

          <Select value={assessment} onValueChange={setAssessment}>
            <SelectTrigger
              size="sm"
              className="h-8 w-auto gap-1.5 rounded-full border-border bg-card"
            >
              <span className="text-muted-foreground text-sm">Assessment:</span>
              <SelectValue>
                {ASSESSMENT_OPTIONS.find((o) => o.value === assessment)
                  ?.label ?? assessment}
              </SelectValue>
            </SelectTrigger>
            <SelectContent align="start" alignItemWithTrigger={false}>
              {ASSESSMENT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <IndicatorDropdown value={indicators} onValueChange={setIndicators} />
        </div>

        {/* ── Quick stats ─────────────────────────────────────────────── */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="rounded-lg border bg-card p-4">
            <p className="text-xs text-muted-foreground">No. of students sat</p>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {breakdown.quickStats.total}
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-xs text-muted-foreground">
              Students with distinction
            </p>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {Math.round(
                (breakdown.quickStats.distinction /
                  breakdown.quickStats.total) *
                  100,
              )}
              %
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-xs text-muted-foreground">Students with pass</p>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {Math.round(
                (breakdown.quickStats.pass / breakdown.quickStats.total) * 100,
              )}
              %
            </p>
          </div>
        </div>

        {/* ── Charts row ──────────────────────────────────────────────── */}
        <div className="mt-4 grid grid-cols-1 gap-4">
          {/* No. of students in each grade */}
          <div className="rounded-lg border bg-card p-4 [&_svg:focus]:outline-none [&_svg]:outline-none">
            <p className="mb-3 text-sm font-semibold text-foreground">
              No. of students in each grade
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <GradeDistChart
                data={breakdown.gradeData}
                selectedGrade={selectedGrade}
                onGradeClick={handleGradeClick}
              />
            </ResponsiveContainer>
          </div>

          {/* Scores by class */}
          <div className="rounded-lg border bg-card overflow-hidden">
            <p className="px-4 pt-4 pb-3 text-sm font-semibold text-foreground">
              Scores by class
            </p>
            <div ref={boxPlotContainerRef} className="w-full">
              <BoxPlotSVGInner
                width={boxPlotWidth}
                height={280}
                data={breakdown.boxPlotData}
              />
            </div>
            <div className="px-4 pb-4 mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <span className="inline-block h-3 w-4 rounded-sm border border-twblue-6 bg-twblue-9/10" />
                IQR (Q1–Q3)
              </div>
              <div className="flex items-center gap-1.5">
                <span className="inline-block h-[2px] w-4 bg-twblue-9" />
                Median
              </div>
              <div className="flex items-center gap-1.5">
                <span className="inline-block h-3 w-px bg-slate-9" />
                Min / Max
              </div>
            </div>
          </div>
        </div>

        {/* ── Students sorted by results ──────────────────────────────── */}
        <div
          ref={candidatesTableRef}
          className="mt-4 scroll-mt-8 rounded-lg border bg-card p-4"
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-foreground">
                Students sorted by results
              </p>
              {selectedGrade && (
                <span
                  className="rounded-full px-2 py-0.5 text-xs font-medium"
                  style={
                    GRADE_BADGE_STYLE[selectedGrade] ?? {
                      backgroundColor: `color-mix(in srgb, ${GRADE_FILL.VR} 30%, transparent)`,
                      color: CHART_LABEL,
                    }
                  }
                >
                  {selectedGrade} — {filteredCandidates.length} students
                </span>
              )}
            </div>
          </div>

          {/* Search + filter bar */}
          <div className="mb-3 flex items-center gap-2">
            <div className="relative max-w-xs flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search name…"
                value={candidateSearch}
                onChange={(e) => {
                  setCandidateSearch(e.target.value)
                  setPage(1)
                }}
                className="h-8 pl-9 text-sm"
              />
            </div>

            <Popover open={filterOpen} onOpenChange={setFilterOpen}>
              <PopoverTrigger
                render={
                  <button
                    type="button"
                    className={cn(
                      'border-border flex h-8 items-center gap-1.5 rounded-full border px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                      hasActiveTableFilters
                        ? 'bg-twblue-3 border-twblue-6 text-twblue-11'
                        : 'bg-card hover:bg-muted',
                    )}
                  />
                }
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Filter
                {hasActiveTableFilters && (
                  <span className="ml-0.5 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground leading-none">
                    {
                      [
                        filterClass !== 'all',
                        filterGrade !== 'all',
                        filterScoreMin !== '',
                        filterScoreMax !== '',
                      ].filter(Boolean).length
                    }
                  </span>
                )}
              </PopoverTrigger>
              <PopoverContent className="w-64 p-4" align="end">
                <div className="space-y-4">
                  <p className="text-sm font-semibold">Filter students</p>

                  {/* Class filter */}
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
                        {ALL_CLASSES.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Grade filter */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Grade
                    </label>
                    <Select
                      value={filterGrade}
                      onValueChange={(v) => {
                        setFilterGrade(v)
                        setSelectedGrade(v === 'all' ? null : v)
                        setPage(1)
                      }}
                    >
                      <SelectTrigger size="sm" className="h-8 w-full">
                        <SelectValue>
                          {filterGrade === 'all' ? 'All grades' : filterGrade}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All grades</SelectItem>
                        {ALL_GRADES.map((g) => (
                          <SelectItem key={g} value={g}>
                            {g}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Score range */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Score range
                    </label>
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Min"
                        value={filterScoreMin}
                        onChange={(e) => {
                          setFilterScoreMin(e.target.value)
                          setPage(1)
                        }}
                        className="h-8 text-sm"
                        type="number"
                        min={0}
                        max={100}
                      />
                      <span className="text-muted-foreground text-xs">–</span>
                      <Input
                        placeholder="Max"
                        value={filterScoreMax}
                        onChange={(e) => {
                          setFilterScoreMax(e.target.value)
                          setPage(1)
                        }}
                        className="h-8 text-sm"
                        type="number"
                        min={0}
                        max={100}
                      />
                    </div>
                  </div>

                  {hasActiveTableFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-full gap-1.5 text-xs font-medium text-slate-12"
                      onClick={() => {
                        clearTableFilters()
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
                  {(
                    ['Profile', 'Name', 'Class', 'Score', 'Grade'] as const
                  ).map((label, i) => (
                    <th
                      key={label}
                      className={cn(
                        'h-12 px-4 text-left align-middle font-medium text-muted-foreground',
                        i === 0 && 'w-[96px]',
                        i === 1 && 'w-[300px]',
                        (i === 2 || i === 3 || i === 4) && 'w-[140px]',
                      )}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {pagedCandidates.map((c) => {
                  const realId = studentIdByName.get(c.name)
                  return (
                    <tr
                      key={c.id}
                      className={cn(
                        'transition-colors hover:bg-muted/50',
                        realId && 'cursor-pointer',
                      )}
                      onClick={() => {
                        if (realId)
                          navigate({
                            to: '/students/$id',
                            params: { id: realId },
                          })
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
                                className="flex items-center justify-center rounded p-0.5 text-twblue-11 hover:bg-twblue-3 hover:text-twblue-12"
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
                      <td className="w-[300px] p-4 align-middle font-medium">
                        {c.name}
                      </td>
                      <td className="w-[140px] p-4 align-middle">{c.class}</td>
                      <td className="w-[140px] p-4 align-middle tabular-nums">
                        {c.score}
                      </td>
                      <td className="w-[140px] p-4 align-middle">{c.grade}</td>
                    </tr>
                  )
                })}
                {pagedCandidates.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
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
          {totalPages > 1 && (
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-muted-foreground text-xs">
                {(page - 1) * PAGE_SIZE + 1}–
                {Math.min(page * PAGE_SIZE, filteredCandidates.length)} of{' '}
                {filteredCandidates.length} records
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
                    (p) =>
                      p === 1 || p === totalPages || Math.abs(p - page) <= 1,
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
          )}
        </div>
      </div>

      {/* Divider */}
      <hr className="border-border" />

      {/* ================================================================
          Section 2 — Trends of subject performance
          ================================================================ */}
      <div>
        <h3 className="mb-4 text-xl font-semibold text-foreground">
          Trends of subject performance
        </h3>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-2">
          <LevelDropdown value={trendsLevel} onValueChange={setTrendsLevel} />

          <Select value={trendsSubject} onValueChange={setTrendsSubject}>
            <SelectTrigger
              size="sm"
              className="h-8 w-auto gap-1.5 rounded-full border-border bg-card"
            >
              <span className="text-muted-foreground text-sm">Subject:</span>
              <SelectValue>
                {MOE_SUBJECT_GROUPS.flatMap((g) => g.subjects).find(
                  (s) => s.value === trendsSubject,
                )?.label ?? trendsSubject}
              </SelectValue>
            </SelectTrigger>
            <SelectContent align="start" alignItemWithTrigger={false}>
              {MOE_SUBJECT_GROUPS.map((grp) => (
                <SelectGroup key={grp.group}>
                  <SelectLabel>{grp.group}</SelectLabel>
                  {grp.subjects.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Subject performance over time */}
        <div className="mt-4 rounded-lg border bg-card p-4">
          <p className="mb-3 text-sm font-semibold text-foreground">
            Subject performance over time
          </p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={trendData}
              margin={{ top: 20, right: 8, left: -10, bottom: 4 }}
              barCategoryGap="30%"
              barGap={2}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke={CHART_GRID}
              />
              <XAxis
                dataKey="assessment"
                tick={{ fontSize: 12, fill: CHART_TICK }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
                tick={{ fontSize: 12, fill: CHART_TICK }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => `${v}%`}
              />
              <Tooltip
                formatter={(value: number, name: string) => [
                  `${value}%`,
                  name === 'distinction' ? '% with distinction' : '% with pass',
                ]}
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 6,
                  border: `1px solid ${CHART_TOOLTIP_BORDER}`,
                }}
              />
              <Bar
                dataKey="distinction"
                fill={SERIES_BLUE}
                radius={[2, 2, 0, 0]}
              >
                <LabelList
                  position="top"
                  formatter={(v: number) => `${v}%`}
                  style={{ fontSize: 10, fill: CHART_LABEL }}
                />
              </Bar>
              <Bar dataKey="pass" fill={PRESENT_RING} radius={[2, 2, 0, 0]}>
                <LabelList
                  position="top"
                  formatter={(v: number) => `${v}%`}
                  style={{ fontSize: 10, fill: CHART_LABEL }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span
                className="h-3 w-3 shrink-0 rounded-sm"
                style={{ backgroundColor: SERIES_BLUE }}
              />
              <span className="text-muted-foreground">% with distinction</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className="h-3 w-3 shrink-0 rounded-sm"
                style={{ backgroundColor: PRESENT_RING }}
              />
              <span className="text-muted-foreground">% with pass</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
