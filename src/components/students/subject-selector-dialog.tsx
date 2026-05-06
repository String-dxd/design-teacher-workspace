import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'

export const SUBJECT_GROUPS = [
  {
    group: 'Languages',
    subjects: [
      'English',
      'Chinese',
      'Higher Chinese',
      'Basic Chinese',
      'Malay',
      'Basic Malay',
      'Tamil',
      'Hindi',
      'Bengali',
      'Burmese',
    ],
  },
  {
    group: 'Mathematics',
    subjects: ['Mathematics', 'Additional Mathematics'],
  },
  {
    group: 'Sciences',
    subjects: ['Science'],
  },
  {
    group: 'Humanities',
    subjects: [
      'Geography',
      'History',
      'Literature in English',
      'Social Studies',
    ],
  },
  {
    group: 'Others',
    subjects: [
      'Art',
      'Computer Applications',
      'Design & Technology',
      'Food & Consumer Education',
      'Music',
      'Physical Education',
    ],
  },
]

export const ALL_SUBJECTS = SUBJECT_GROUPS.flatMap((g) => g.subjects)

interface SubjectSelectorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedSubjects: Array<string> | null
  onApply: (subjects: Array<string> | null) => void
}

export function SubjectSelectorDialog({
  open,
  onOpenChange,
  selectedSubjects,
  onApply,
}: SubjectSelectorDialogProps) {
  // Local draft state while dialog is open
  const [draft, setDraft] = useState<Set<string>>(
    () => new Set(selectedSubjects ?? ALL_SUBJECTS),
  )

  // Re-sync draft when dialog opens
  const handleOpenChange = (next: boolean) => {
    if (next) {
      setDraft(new Set(selectedSubjects ?? ALL_SUBJECTS))
    }
    onOpenChange(next)
  }

  const toggle = (subject: string) => {
    setDraft((prev) => {
      const next = new Set(prev)
      if (next.has(subject)) {
        next.delete(subject)
      } else {
        next.add(subject)
      }
      return next
    })
  }

  const toggleGroup = (subjects: Array<string>) => {
    const allSelected = subjects.every((s) => draft.has(s))
    setDraft((prev) => {
      const next = new Set(prev)
      if (allSelected) {
        subjects.forEach((s) => next.delete(s))
      } else {
        subjects.forEach((s) => next.add(s))
      }
      return next
    })
  }

  const handleApply = () => {
    // If all subjects selected, treat as "no filter" (null)
    const isAll = ALL_SUBJECTS.every((s) => draft.has(s))
    onApply(isAll ? null : Array.from(draft))
    onOpenChange(false)
  }

  const handleReset = () => {
    setDraft(new Set(ALL_SUBJECTS))
    onApply(null)
    onOpenChange(false)
  }

  const selectedCount = draft.size
  const totalCount = ALL_SUBJECTS.length
  const isCustom = selectedCount < totalCount

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md gap-4">
        <DialogHeader className="gap-2">
          <DialogTitle className="text-lg font-semibold">
            Select subjects for Overall %
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Choose subjects to include in the calculation
          </p>
        </DialogHeader>

        <div className="space-y-8">
          {SUBJECT_GROUPS.map(({ group, subjects }) => {
            const groupSelected = subjects.filter((s) => draft.has(s))
            const allGroupSelected = groupSelected.length === subjects.length
            const someGroupSelected =
              groupSelected.length > 0 && !allGroupSelected

            return (
              <div key={group}>
                {/* Group header */}
                <button
                  type="button"
                  onClick={() => toggleGroup(subjects)}
                  className="flex items-start gap-2 mb-2 w-full text-left"
                >
                  <Checkbox
                    checked={allGroupSelected}
                    indeterminate={someGroupSelected}
                    tabIndex={-1}
                  />
                  <span className="text-sm font-semibold">{group}</span>
                </button>

                {/* Subjects */}
                <div className="grid grid-cols-2 gap-y-1 pl-6">
                  {subjects.map((subject) => (
                    <label
                      key={subject}
                      className="flex items-start gap-2 cursor-pointer py-0.5"
                    >
                      <Checkbox
                        checked={draft.has(subject)}
                        onCheckedChange={() => toggle(subject)}
                      />
                      <span className="text-sm">{subject}</span>
                    </label>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        <DialogFooter className="flex-row items-center gap-2 sm:justify-between">
          <p className="text-xs text-muted-foreground">
            {isCustom ? (
              <span className="text-blue-600 font-medium">
                {selectedCount} of {totalCount} subjects selected
              </span>
            ) : (
              <span>All {totalCount} subjects selected</span>
            )}
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={handleReset}>
              Reset
            </Button>
            <Button size="sm" onClick={handleApply} disabled={draft.size === 0}>
              Apply
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
