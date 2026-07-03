import { useCallback, useEffect, useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'

import type {
  FilterCriterion,
  FilterField,
  SortConfig,
  SortDirection,
  Student,
} from '@/types/student'
import type { ColumnConfig } from '@/components/students/column-visibility-popover'
import type { FlagColumnSpec } from '@/lib/apply-flag-columns'
import { useFeatureFlag } from '@/hooks/use-feature-flag'
import { useSetBreadcrumbs } from '@/hooks/use-breadcrumbs'
import {
  LATEST_PERIOD,
  filterFieldConfigs,
  isFilterComplete,
  periodYears,
} from '@/data/filter-config'
import { DataCard } from '@/components/data-card'
import { StudentFilters } from '@/components/students/student-filters'
import { StudentTable } from '@/components/students/student-table'
import { ClassSelector } from '@/components/students/class-selector'
import {
  CURRENT_TERM_KEY,
  defaultColumns,
} from '@/components/students/column-visibility-popover'
import { ProfileGroupControl } from '@/components/students/profile-group-control'
import {
  ALL_SUBJECTS,
  SubjectSelectorDialog,
} from '@/components/students/subject-selector-dialog'

import { getMetrics, mockStudents } from '@/data/mock-students'
import { getImportedColumns, saveImportedColumns } from '@/lib/imported-columns'
import { applyFlagColumns } from '@/lib/apply-flag-columns'
import { useProfileGroups } from '@/lib/profile-group-storage'
import {
  computeStudentOverall,
  evaluateCriterion,
} from '@/lib/filter-evaluation'

const SUBJECT_SELECTION_KEY = 'overall-pct-subjects'

function loadSelectedSubjects(): Array<string> | null {
  try {
    const raw = localStorage.getItem(SUBJECT_SELECTION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return null
    // If any current subject is missing from the saved list, the list is stale
    // (subjects were added after the user last saved) — reset to all selected
    const hasNewSubjects = ALL_SUBJECTS.some((s) => !parsed.includes(s))
    if (hasNewSubjects) {
      localStorage.removeItem(SUBJECT_SELECTION_KEY)
      return null
    }
    const isAll = ALL_SUBJECTS.every((s) => parsed.includes(s))
    return isAll ? null : parsed
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

export const Route = createFileRoute('/students/')({
  component: StudentsPage,
})

// Map a Date-range filter value ('2025-T4') to a termly-data key ('T4 2025')
function periodValueToTermKey(value: string): string {
  const [year, term] = value.split('-')
  return `${term} ${year}`
}

// Single representative term key for the active Date-range selection, used to
// drive the temporal columns so displayed values mimic the chosen period.
// Multiple terms -> most recent selected; "Latest available"/none -> current term.
function getPeriodTermKey(filters: Array<FilterCriterion>): string {
  const dateRange = filters.find((f) => f.field === 'dateRange')
  const values = Array.isArray(dateRange?.value) ? dateRange.value : []
  const terms = values.filter((v) => v !== LATEST_PERIOD)
  if (terms.length === 0) return CURRENT_TERM_KEY
  // periodYears is ordered most-recent-first (by year, then term)
  for (const year of periodYears) {
    for (const t of year.terms) {
      if (terms.includes(t.value)) return periodValueToTermKey(t.value)
    }
  }
  return CURRENT_TERM_KEY
}

function StudentsPage() {
  const studentAnalyticsEnabled = useFeatureFlag('student-analytics')
  const studentAnalyticsBasicEnabled = useFeatureFlag('student-analytics-basic')
  const msfUpliftEnabled = useFeatureFlag('msf-uplift-data')
  const attentionTagEnabled = useFeatureFlag('attention-tag')
  const overallPercentageEnabled = useFeatureFlag('overall-percentage')
  const socialLinksEnabled = useFeatureFlag('social-links')
  const importDataEnabled = useFeatureFlag('import-data')
  const isStudentInsightsView =
    !studentAnalyticsEnabled && !studentAnalyticsBasicEnabled
  const pageTitle = isStudentInsightsView
    ? 'Student Insights'
    : 'Student Profiles'
  useSetBreadcrumbs([{ label: pageTitle, href: '/students' }])

  const [selectedClass, setSelectedClass] = useState('Secondary 4')
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<Array<FilterCriterion>>([])
  const { appliedGroup } = useProfileGroups()
  const [columns, setColumns] = useState<Array<ColumnConfig>>(() => {
    const insightsFiltered = isStudentInsightsView
      ? defaultColumns.filter(
          (c) =>
            c.id !== 'approvedMtl' &&
            c.id !== 'postSecEligibility' &&
            c.id !== 'commuterStatus' &&
            c.id !== 'afterSchoolArrangement',
        )
      : defaultColumns
    const msfFiltered = msfUpliftEnabled
      ? insightsFiltered
      : insightsFiltered.filter(
          (c) =>
            c.id !== 'supportedByComLink' &&
            c.id !== 'supportedByFsc' &&
            c.id !== 'parentsConsideringDivorce' &&
            c.id !== 'nonIntactFamily',
        )
    const attentionFiltered = attentionTagEnabled
      ? msfFiltered
      : msfFiltered.filter((c) => c.id !== 'attentionTags')
    // The Social links column only appears when its flag is on.
    const socialFiltered = socialLinksEnabled
      ? attentionFiltered
      : attentionFiltered.filter((c) => c.id !== 'socialLinks')
    // The Overall % across selected subjects column only appears when its flag
    // is on.
    const baseColumns = overallPercentageEnabled
      ? socialFiltered
      : socialFiltered.filter((c) => c.id !== 'overallPercentage')
    // Imported columns (e.g. "VIA missed", "Next steps", "Teacher's remarks")
    // only appear when the Import Data flag is on.
    const saved = importDataEnabled ? getImportedColumns() : []
    if (saved.length === 0) return baseColumns
    const now = new Date()
    const dateStr = now.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
    const restoredImported: Array<ColumnConfig> = saved.map((c) => ({
      id: c.id,
      label: c.label,
      visible: true,
      sortable: true,
      imported: true,
      source: 'Imported by user',
      lastUpdated: `${dateStr} by You`,
    }))
    return [
      ...baseColumns.filter(
        (c) => !restoredImported.some((ic) => ic.id === c.id),
      ),
      ...restoredImported,
    ]
  })
  const importedColumns = columns.filter((c) => c.imported)

  // Sync flag-gated columns when their feature flags toggle at runtime.
  // One table-driven pass: each spec inserts its columns at an anchor when
  // enabled, or removes them when disabled. Spec order matters — the
  // overallPercentage spec anchors on 'socialLinks', which the socialLinks
  // spec may insert earlier in the same pass.
  useEffect(() => {
    const specs: Array<FlagColumnSpec> = [
      {
        enabled: msfUpliftEnabled,
        ids: [
          'supportedByComLink',
          'supportedByFsc',
          'parentsConsideringDivorce',
          'nonIntactFamily',
        ],
        anchorId: 'fas',
        position: 'before',
      },
      {
        enabled: attentionTagEnabled,
        ids: ['attentionTags'],
        anchorId: 'cca',
        position: 'after',
      },
      {
        enabled: socialLinksEnabled,
        ids: ['socialLinks'],
        anchorId: 'lowMoodFlagged',
        position: 'after',
      },
      {
        enabled: overallPercentageEnabled,
        ids: ['overallPercentage'],
        anchorId: 'socialLinks',
        position: 'after',
      },
    ]
    setColumns((prev) => applyFlagColumns(prev, specs, defaultColumns))
  }, [
    msfUpliftEnabled,
    attentionTagEnabled,
    socialLinksEnabled,
    overallPercentageEnabled,
  ])

  // Sync imported columns when the Import Data flag toggles at runtime.
  // When off, hide previously-imported columns; when on, restore them from
  // the saved import (localStorage).
  useEffect(() => {
    setColumns((prev) => {
      const hasImported = prev.some((c) => c.imported)
      if (!importDataEnabled && hasImported) {
        return prev.filter((c) => !c.imported)
      }
      if (importDataEnabled && !hasImported) {
        const saved = getImportedColumns()
        if (saved.length === 0) return prev
        const dateStr = new Date().toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
        const restoredImported: Array<ColumnConfig> = saved.map((c) => ({
          id: c.id,
          label: c.label,
          visible: true,
          sortable: true,
          imported: true,
          source: 'Imported by user',
          lastUpdated: `${dateStr} by You`,
        }))
        return [
          ...prev.filter((c) => !restoredImported.some((ic) => ic.id === c.id)),
          ...restoredImported,
        ]
      }
      return prev
    })
  }, [importDataEnabled])

  const [sort, setSort] = useState<SortConfig | null>(null)
  const [selectedSubjects, setSelectedSubjects] =
    useState<Array<string> | null>(() => loadSelectedSubjects())
  const [subjectDialogOpen, setSubjectDialogOpen] = useState(false)
  const [isRecalculating, setIsRecalculating] = useState(false)

  const handleSubjectsApply = useCallback((subjects: Array<string> | null) => {
    setSelectedSubjects(subjects)
    saveSelectedSubjects(subjects)
    setIsRecalculating(true)
    setTimeout(() => setIsRecalculating(false), 1000)
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
          evaluateCriterion(student, filter, {
            unknownField: 'match',
            selectedSubjects,
          }),
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
        const getSortVal = (s: Student) => {
          if (sort.field === 'overallPercentage')
            return computeStudentOverall(s, selectedSubjects)
          if (sort.field === 'attendance')
            return s.totalSchoolDays > 0
              ? s.daysPresent / s.totalSchoolDays
              : null
          return s[sort.field as keyof Student]
        }
        const aVal = getSortVal(a)
        const bVal = getSortVal(b)

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

  // Term key driven by the Date range filter — temporal columns use this so the
  // table's mock values reflect the selected period.
  const periodTermKey = useMemo(() => getPeriodTermKey(filters), [filters])

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

        {/* Metrics Cards — only shown when Student Analytics is enabled */}
        {studentAnalyticsEnabled && (
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
              label="Attendance"
              value={metrics.tier2_3Students}
              description="Non-VR absences (days)"
              trend="stable"
            />
          </div>
        )}

        {/* Filters */}
        <StudentFilters
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          filters={filters}
          onFiltersChange={setFilters}
          columns={columns}
          onColumnsChange={setColumns}
          importedColumns={importedColumns.map((c) => ({
            id: c.id,
            label: c.label,
          }))}
          onImportComplete={(importedColumns) => {
            setColumns((prev) => [
              ...prev.filter(
                (c) => !importedColumns.some((ic) => ic.id === c.id),
              ),
              ...importedColumns,
            ])
            saveImportedColumns(
              importedColumns.map((c) => ({ id: c.id, label: c.label })),
            )
          }}
          matchedCount={hasActiveFilters ? matchedIds.size : undefined}
          totalCount={hasActiveFilters ? classStudents.length : undefined}
          className="px-6 pb-4"
          rightSlot={<ProfileGroupControl />}
        />
      </div>

      {/* Student Table — rendered with optional grouping */}
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
        isRecalculating={isRecalculating}
        onDeleteColumn={(columnId) =>
          setColumns((prev) => prev.filter((c) => c.id !== columnId))
        }
        group={appliedGroup}
        periodTermKey={periodTermKey}
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
