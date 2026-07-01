import { useCallback, useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'

import type {
  FilterCriterion,
  FilterField,
  SortConfig,
  SortDirection,
  Student,
} from '@/types/student'
import type { ColumnConfig } from '@/components/students/column-visibility-popover'
import { useFeatureFlag } from '@/hooks/use-feature-flag'
import { useSetBreadcrumbs } from '@/hooks/use-breadcrumbs'
import { filterFieldConfigs, isFilterComplete } from '@/data/filter-config'
import { DataCard } from '@/components/data-card'
import { StudentFilters } from '@/components/students/student-filters'
import { StudentTable } from '@/components/students/student-table'
import { ClassSelector } from '@/components/students/class-selector'
import { defaultColumns } from '@/components/students/column-visibility-popover'
import { SubjectSelectorDialog } from '@/components/students/subject-selector-dialog'

import { getMetrics, mockStudents } from '@/data/mock-students'

const SUBJECT_SELECTION_KEY = 'overall-pct-subjects'

function loadSelectedSubjects(): Array<string> | null {
  try {
    const raw = localStorage.getItem(SUBJECT_SELECTION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

function saveSelectedSubjects(subjects: Array<string> | null) {
  if (subjects === null) {
    localStorage.removeItem(SUBJECT_SELECTION_KEY)
  } else {
    localStorage.setItem(SUBJECT_SELECTION_KEY, JSON.stringify(subjects))
  }
}

function computeStudentOverall(
  student: Student,
  selectedSubjects: Array<string> | null,
): number {
  if (!selectedSubjects || !student.subjectScores) {
    return student.overallPercentage
  }
  const relevant = student.subjectScores.filter((s) =>
    selectedSubjects.includes(s.subject),
  )
  if (relevant.length === 0) return student.overallPercentage
  return Math.round(
    relevant.reduce((sum, s) => sum + s.percentage, 0) / relevant.length,
  )
}

export const Route = createFileRoute('/students/')({
  component: StudentsPage,
})

// Check if a student matches a filter condition
function matchesCondition(
  student: Student,
  filter: FilterCriterion,
  selectedSubjects?: Array<string> | null,
): boolean {
  // For overallPercentage, use the computed value based on selected subjects
  const value =
    filter.field === 'overallPercentage'
      ? computeStudentOverall(student, selectedSubjects ?? null)
      : student[filter.field as keyof Student]

  switch (filter.operator) {
    // Numeric operators
    case 'gt':
      return Number(value) > Number(filter.value)
    case 'gte':
      return Number(value) >= Number(filter.value)
    case 'lt':
      return Number(value) < Number(filter.value)
    case 'lte':
      return Number(value) <= Number(filter.value)
    case 'eq':
      return Number(value) === Number(filter.value)
    case 'neq':
      return Number(value) !== Number(filter.value)
    case 'between': {
      const range = filter.value as { min: number; max: number }
      return Number(value) >= range.min && Number(value) <= range.max
    }
    case 'not_between': {
      const range = filter.value as { min: number; max: number }
      return Number(value) < range.min || Number(value) > range.max
    }
    // Text operators
    case 'contains':
      return String(value ?? '')
        .toLowerCase()
        .includes(String(filter.value).toLowerCase())
    case 'not_contains':
      return !String(value ?? '')
        .toLowerCase()
        .includes(String(filter.value).toLowerCase())
    case 'is':
      if (Array.isArray(filter.value)) {
        return filter.value.includes(String(value ?? ''))
      }
      return String(value ?? '') === String(filter.value)
    case 'is_not':
      return String(value ?? '') !== String(filter.value)
    case 'is_empty':
      return !value || value === ''
    case 'is_not_empty':
      return !!value && value !== ''
    default:
      return false
  }
}

function StudentsPage() {
  const studentAnalyticsEnabled = useFeatureFlag('student-analytics')
  const pageTitle = studentAnalyticsEnabled ? 'Profiles' : 'Student Insights'
  useSetBreadcrumbs([{ label: pageTitle, href: '/students' }])

  const [selectedClass, setSelectedClass] = useState('Secondary 3')
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<Array<FilterCriterion>>([])
  const [columns, setColumns] = useState<Array<ColumnConfig>>(defaultColumns)
  const [sort, setSort] = useState<SortConfig | null>(null)
  const [selectedSubjects, setSelectedSubjects] =
    useState<Array<string> | null>(() => loadSelectedSubjects())
  const [subjectDialogOpen, setSubjectDialogOpen] = useState(false)

  const handleSubjectsApply = useCallback((subjects: Array<string> | null) => {
    setSelectedSubjects(subjects)
    saveSelectedSubjects(subjects)
  }, [])

  // Get students for the selected class/level (this determines the base list)
  const classStudents = useMemo(() => {
    let students = mockStudents

    // Filter by class or level
    if (selectedClass !== 'all') {
      if (selectedClass.startsWith('Secondary')) {
        // Extract level number and filter by classes starting with that number
        const levelNum = selectedClass.replace('Secondary ', '')
        students = students.filter((s) => s.class.startsWith(levelNum))
      } else {
        students = students.filter((s) => s.class === selectedClass)
      }
    }

    return students
  }, [selectedClass])

  // Determine which students match the current filters (search + filter criteria)
  const { matchedIds, hasActiveFilters } = useMemo(() => {
    const hasSearch = !!searchQuery
    const completeFilters = filters.filter(isFilterComplete)
    const hasFilterCriteria = completeFilters.length > 0
    const isFiltering = hasSearch || hasFilterCriteria

    if (!isFiltering) {
      // No filters active - all students are "matched"
      return { matchedIds: new Set<string>(), hasActiveFilters: false }
    }

    const matched = new Set<string>()
    const query = searchQuery.toLowerCase()

    for (const student of classStudents) {
      // Check search query
      const matchesSearch =
        !hasSearch || student.name.toLowerCase().includes(query)

      // Check filter criteria
      const matchesFilters =
        !hasFilterCriteria ||
        completeFilters.every((filter) =>
          matchesCondition(student, filter, selectedSubjects),
        )

      if (matchesSearch && matchesFilters) {
        matched.add(student.id)
      }
    }

    return { matchedIds: matched, hasActiveFilters: isFiltering }
  }, [classStudents, searchQuery, filters, selectedSubjects])

  // Compute active filter fields for header indicators (only complete filters)
  const activeFilterFields = useMemo(
    () => new Set(filters.filter(isFilterComplete).map((f) => f.field)),
    [filters],
  )

  // Sort handlers
  const handleSort = useCallback((field: string, direction: SortDirection) => {
    setSort({ field, direction })
  }, [])

  const handleClearSort = useCallback(() => {
    setSort(null)
  }, [])

  const handleAddQuickFilter = useCallback((field: FilterField) => {
    const fieldConfig = filterFieldConfigs.find((c) => c.field === field)
    if (!fieldConfig) return

    setFilters((prev) => [
      ...prev,
      {
        id: `filter-${Date.now()}`,
        field,
        operator: fieldConfig.defaultOperator,
        value: fieldConfig.defaultValue,
      },
    ])
  }, [])

  const handleClearFilter = useCallback((field: FilterField) => {
    setFilters((prev) => prev.filter((f) => f.field !== field))
  }, [])

  // Sort students: apply column sort first, then partition by filter matches
  const sortedStudents = useMemo(() => {
    const result = [...classStudents]

    // Apply column sort first
    if (sort) {
      result.sort((a, b) => {
        const aVal =
          sort.field === 'overallPercentage'
            ? computeStudentOverall(a, selectedSubjects)
            : a[sort.field as keyof Student]
        const bVal =
          sort.field === 'overallPercentage'
            ? computeStudentOverall(b, selectedSubjects)
            : b[sort.field as keyof Student]

        // Handle null/undefined
        if (aVal == null && bVal == null) return 0
        if (aVal == null) return sort.direction === 'asc' ? 1 : -1
        if (bVal == null) return sort.direction === 'asc' ? -1 : 1

        // Numeric comparison
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sort.direction === 'asc' ? aVal - bVal : bVal - aVal
        }

        // String comparison
        const comparison = String(aVal).localeCompare(String(bVal))
        return sort.direction === 'asc' ? comparison : -comparison
      })
    }

    // Then partition by filter matches (matched students first)
    if (hasActiveFilters) {
      result.sort((a, b) => {
        const aMatched = matchedIds.has(a.id)
        const bMatched = matchedIds.has(b.id)
        if (aMatched && !bMatched) return -1
        if (!aMatched && bMatched) return 1
        return 0
      })
    }

    return result
  }, [classStudents, sort, matchedIds, hasActiveFilters, selectedSubjects])

  // For metrics, we only count the matched students
  const matchedStudents = useMemo(() => {
    if (!hasActiveFilters) {
      return classStudents
    }
    return classStudents.filter((s) => matchedIds.has(s.id))
  }, [classStudents, matchedIds, hasActiveFilters])

  const metrics = useMemo(() => getMetrics(matchedStudents), [matchedStudents])

  return (
    <div className="flex flex-col">
      {/* Fixed content area */}
      <div className="shrink-0 space-y-6 pt-6">
        {/* Page Header */}
        <div className="px-6">
          <h1 className="text-2xl font-semibold">{pageTitle}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Key data to understand your students holistically
          </p>
        </div>

        {/* Class Selector */}
        <div className="px-6">
          <ClassSelector
            value={selectedClass}
            onValueChange={setSelectedClass}
          />
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 gap-4 px-6 md:grid-cols-3">
          <DataCard
            label="Attendance"
            value={`${metrics.absenteeismRate}%`}
            description="Current term"
            trend="declining"
          />
          <DataCard
            label="Attendance"
            value={metrics.lateComing}
            description="Late-coming"
            trend="improving"
          />
          <DataCard
            label="Tier 2-3"
            value={metrics.tier2_3Students}
            description="Students needing support"
            trend="stable"
          />
        </div>

        {/* Filters */}
        <StudentFilters
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          filters={filters}
          onFiltersChange={setFilters}
          columns={columns}
          onColumnsChange={setColumns}
          matchedCount={hasActiveFilters ? matchedIds.size : undefined}
          totalCount={hasActiveFilters ? classStudents.length : undefined}
          className="px-6 pb-4"
        />
      </div>

      {/* Student Table */}
      <StudentTable
        students={sortedStudents}
        columns={columns}
        pageSize={20}
        matchedIds={hasActiveFilters ? matchedIds : undefined}
        matchedCount={hasActiveFilters ? matchedIds.size : 0}
        sort={sort}
        activeFilterFields={activeFilterFields}
        onSort={handleSort}
        onClearSort={handleClearSort}
        onAddQuickFilter={handleAddQuickFilter}
        onClearFilter={handleClearFilter}
        selectedSubjects={selectedSubjects}
        onConfigureSubjects={() => setSubjectDialogOpen(true)}
      />

      <SubjectSelectorDialog
        open={subjectDialogOpen}
        onOpenChange={setSubjectDialogOpen}
        selectedSubjects={selectedSubjects}
        onApply={handleSubjectsApply}
      />
    </div>
  )
}
