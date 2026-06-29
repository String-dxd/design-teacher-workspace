import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronsDown, Plus, RotateCcw, X } from 'lucide-react'

import { ProfileGroupCriteriaRow } from './profile-group-criteria-row'
import type { FilterCriterion } from '@/types/student'
import type { ProfileGroup, ProfileGroupBucket } from '@/types/profile-group'
import { filterFieldConfigs, isFilterComplete } from '@/data/filter-config'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

interface ProfileGroupModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Existing group when editing; undefined for create */
  initialGroup?: ProfileGroup
  /** Called with the saved group (named) — store + close */
  onSave: (group: ProfileGroup) => void
  /** Called when user clicks Apply — store applied id without naming flow */
  onApply: (group: ProfileGroup) => void
}

const generateId = () =>
  `pg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

function defaultCriterion(): FilterCriterion {
  return {
    id: generateId(),
    field: '',
    operator: 'is',
    value: '',
  }
}

function defaultBuckets(): Array<ProfileGroupBucket> {
  return [
    {
      id: generateId(),
      name: '',
      rule: { kind: 'meet_at_least', count: 1 },
    },
    {
      id: generateId(),
      name: '',
      rule: { kind: 'meet_at_least', count: 1 },
    },
    {
      id: generateId(),
      name: '',
      rule: { kind: 'all_remaining' },
    },
  ]
}

type Step = 'edit' | 'review'

function operatorLabel(op: string) {
  switch (op) {
    case 'gt':
      return 'greater than'
    case 'gte':
      return 'greater than or equal to'
    case 'lt':
      return 'less than'
    case 'lte':
      return 'less than or equal to'
    case 'eq':
      return 'equals'
    case 'neq':
      return 'not equal to'
    case 'is':
      return 'is'
    case 'is_not':
      return 'is not'
    case 'contains':
      return 'contains'
    case 'not_contains':
      return 'does not contain'
    case 'is_empty':
      return 'is empty'
    case 'is_not_empty':
      return 'is not empty'
    default:
      return op
  }
}

export function ProfileGroupModal({
  open,
  onOpenChange,
  initialGroup,
  onSave,
  onApply,
}: ProfileGroupModalProps) {
  const [step, setStep] = useState<Step>('edit')
  const [criteria, setCriteria] = useState<Array<FilterCriterion>>([])
  const [buckets, setBuckets] = useState<Array<ProfileGroupBucket>>([])
  const [nameDialogOpen, setNameDialogOpen] = useState(false)
  const [draftName, setDraftName] = useState('')

  // Reset state whenever the modal opens with a (possibly different) group
  useEffect(() => {
    if (!open) return
    setStep('edit')
    if (initialGroup) {
      setCriteria(initialGroup.criteria.map((c) => ({ ...c })))
      setBuckets(initialGroup.buckets.map((b) => ({ ...b })))
      setDraftName(initialGroup.name)
    } else {
      setCriteria([defaultCriterion()])
      setBuckets(defaultBuckets())
      setDraftName('')
    }
  }, [open, initialGroup])

  const completeCount = useMemo(
    () => criteria.filter((c) => c.field && isFilterComplete(c)).length,
    [criteria],
  )

  const canApply = completeCount > 0

  const handleAddCriterion = () => {
    setCriteria((prev) => [...prev, defaultCriterion()])
  }

  const handleAddBucket = () => {
    setBuckets((prev) => {
      const nonRemaining = prev.filter((b) => b.rule.kind !== 'all_remaining')
      const remaining = prev.find((b) => b.rule.kind === 'all_remaining')
      return [
        ...nonRemaining,
        {
          id: generateId(),
          name: '',
          rule: { kind: 'meet_at_least', count: 1 },
        },
        ...(remaining ? [remaining] : []),
      ]
    })
  }

  const handleReset = () => {
    setCriteria([defaultCriterion()])
    setBuckets(defaultBuckets())
  }

  const buildGroup = (name: string, isUnsaved: boolean): ProfileGroup => {
    const now = new Date().toISOString()
    return {
      id: initialGroup?.id ?? generateId(),
      name: name || initialGroup?.name || 'Untitled group',
      criteria: criteria.filter((c) => c.field && isFilterComplete(c)),
      buckets,
      isUnsaved,
      createdAt: initialGroup?.createdAt ?? now,
      updatedAt: now,
    }
  }

  const handleApply = () => {
    if (!canApply) return
    // Preserve saved status if editing a saved group; otherwise mark as unsaved
    const wasSaved = initialGroup && !initialGroup.isUnsaved
    onApply(buildGroup(initialGroup?.name ?? 'Unsaved group', !wasSaved))
    onOpenChange(false)
  }

  const handleSaveClick = () => {
    if (!canApply) return
    setStep('review')
  }

  const handleConfirmSave = () => {
    if (initialGroup && !initialGroup.isUnsaved) {
      onSave(buildGroup(initialGroup.name, false))
      onOpenChange(false)
      return
    }
    setNameDialogOpen(true)
  }

  const handleNameSave = () => {
    const name = draftName.trim()
    if (!name) return
    onSave(buildGroup(name, false))
    setNameDialogOpen(false)
    onOpenChange(false)
  }

  const isEdit = !!initialGroup

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          showCloseButton={false}
          className="sm:max-w-none top-0 left-0 translate-x-0 translate-y-0 grid h-screen w-screen max-w-[100vw] grid-rows-[auto_1fr_auto] gap-0 rounded-none bg-background p-0"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b px-6 py-4">
            <DialogTitle className="text-base font-semibold">
              {step === 'edit'
                ? isEdit
                  ? 'Edit group'
                  : 'Create group'
                : 'Save group'}
            </DialogTitle>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded p-1 text-muted-foreground hover:text-foreground"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="overflow-y-auto">
            {step === 'edit' ? (
              <EditStep
                criteria={criteria}
                onCriteriaChange={setCriteria}
                buckets={buckets}
                onBucketsChange={setBuckets}
                completeCount={completeCount}
                onAddCriterion={handleAddCriterion}
                onAddBucket={handleAddBucket}
              />
            ) : (
              <ReviewStep criteria={criteria} buckets={buckets} />
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t bg-background px-6 py-3">
            {step === 'edit' ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  className="gap-2 text-muted-foreground"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </Button>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSaveClick}
                    disabled={!canApply}
                  >
                    Save group
                  </Button>
                  <Button size="sm" onClick={handleApply} disabled={!canApply}>
                    Apply group
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep('edit')}
                  className="gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Go back and edit
                </Button>
                <Button size="sm" onClick={handleConfirmSave}>
                  Save group
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Name dialog */}
      <Dialog open={nameDialogOpen} onOpenChange={setNameDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle className="text-base font-semibold">
            Create group name
          </DialogTitle>
          <div className="space-y-2">
            <label htmlFor="profile-group-name" className="text-sm font-medium">
              Name
            </label>
            <Input
              id="profile-group-name"
              autoFocus
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && draftName.trim()) handleNameSave()
              }}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setNameDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleNameSave} disabled={!draftName.trim()}>
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

interface EditStepProps {
  criteria: Array<FilterCriterion>
  onCriteriaChange: (next: Array<FilterCriterion>) => void
  buckets: Array<ProfileGroupBucket>
  onBucketsChange: (next: Array<ProfileGroupBucket>) => void
  completeCount: number
  onAddCriterion: () => void
  onAddBucket: () => void
}

function EditStep({
  criteria,
  onCriteriaChange,
  buckets,
  onBucketsChange,
  completeCount,
  onAddCriterion,
  onAddBucket,
}: EditStepProps) {
  const handleCriterionChange = (index: number, next: FilterCriterion) => {
    const updated = [...criteria]
    updated[index] = next
    onCriteriaChange(updated)
  }

  const handleCriterionRemove = (index: number) => {
    onCriteriaChange(criteria.filter((_, i) => i !== index))
  }

  const handleBucketNameChange = (id: string, name: string) => {
    onBucketsChange(buckets.map((b) => (b.id === id ? { ...b, name } : b)))
  }

  const handleBucketCountChange = (id: string, count: number) => {
    onBucketsChange(
      buckets.map((b) =>
        b.id === id && b.rule.kind === 'meet_at_least'
          ? { ...b, rule: { kind: 'meet_at_least', count } }
          : b,
      ),
    )
  }

  const handleBucketRemove = (id: string) => {
    onBucketsChange(buckets.filter((b) => b.id !== id))
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      {/* Section 1 */}
      <section>
        <h2 className="text-xl font-semibold">
          Group students by how many criteria they meet
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Identify and prioritise students for support, opportunities, or
          programmes based on your criteria
        </p>
        <div className="mt-5 rounded-2xl bg-slate-3 p-5">
          <div className="space-y-3">
            {criteria.map((c, i) => (
              <ProfileGroupCriteriaRow
                key={c.id}
                index={i}
                criterion={c}
                takenFields={criteria
                  .filter((_, j) => j !== i)
                  .map((x) => x.field)
                  .filter(Boolean)}
                onChange={(next) => handleCriterionChange(i, next)}
                onRemove={() => handleCriterionRemove(i)}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={onAddCriterion}
            className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-input bg-card px-3.5 py-1.5 text-sm font-semibold shadow-sm hover:bg-accent"
          >
            <Plus className="h-4 w-4" />
            Add criteria
          </button>
        </div>
      </section>

      {/* Divider */}
      <div className="my-8 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <ChevronsDown className="h-4 w-4 text-muted-foreground" />
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* Section 2 */}
      <section>
        <h2 className="text-xl font-semibold">
          How should the students be grouped?
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Specify how many criteria students must meet to be placed in each
          group
        </p>
        <div className="mt-2">
          <span
            className={
              completeCount > 0
                ? 'inline-flex rounded-md bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground'
                : 'inline-flex rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground'
            }
          >
            {completeCount} criteria added
          </span>
        </div>
        <div className="mt-5 space-y-3">
          {buckets.map((b, i) => {
            const isRemaining = b.rule.kind === 'all_remaining'
            const placeholder =
              i === 0
                ? 'Group name (e.g. High priority)'
                : i === 1
                  ? 'Group name (e.g. Medium priority)'
                  : 'Group name (e.g. Low priority)'
            const countDisabled = completeCount === 0
            return (
              <div key={b.id} className="flex items-center gap-4">
                <Input
                  value={b.name}
                  onChange={(e) => handleBucketNameChange(b.id, e.target.value)}
                  placeholder={placeholder}
                  className="h-9 w-[280px] rounded-[14px]"
                />
                {isRemaining ? (
                  <span className="text-sm text-foreground">
                    all remaining students
                  </span>
                ) : (
                  <>
                    <span className="text-sm text-foreground">
                      meet at least
                    </span>
                    <Input
                      type="number"
                      min={1}
                      value={
                        countDisabled
                          ? ''
                          : b.rule.kind === 'meet_at_least'
                            ? b.rule.count
                            : 1
                      }
                      placeholder="1"
                      disabled={countDisabled}
                      onChange={(e) =>
                        handleBucketCountChange(
                          b.id,
                          Math.max(1, Number(e.target.value) || 1),
                        )
                      }
                      className={
                        countDisabled
                          ? 'h-9 w-14 rounded-md bg-muted text-center disabled:opacity-100'
                          : 'h-9 w-14 rounded-md text-center'
                      }
                    />
                    <span className="text-sm text-foreground">criteria</span>
                    <button
                      type="button"
                      onClick={() => handleBucketRemove(b.id)}
                      className="rounded p-1 text-muted-foreground hover:text-foreground"
                      aria-label="Remove bucket"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            )
          })}
        </div>
        <button
          type="button"
          onClick={onAddBucket}
          className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-twblue-11 hover:text-twblue-12"
        >
          <Plus className="h-4 w-4" />
          Add group
        </button>
      </section>
    </div>
  )
}

interface ReviewStepProps {
  criteria: Array<FilterCriterion>
  buckets: Array<ProfileGroupBucket>
}

function ReviewStep({ criteria, buckets }: ReviewStepProps) {
  const completeCriteria = criteria.filter(
    (c) => c.field && isFilterComplete(c),
  )

  return (
    <div className="mx-auto max-w-3xl space-y-8 py-8 px-6">
      <div>
        <h2 className="text-xl font-semibold">
          Review your criteria and groups
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          You can make changes later if needed
        </p>
      </div>

      <section>
        <h3 className="mb-3 text-base font-semibold">
          Criteria ({completeCriteria.length})
        </h3>
        <div className="rounded-xl bg-muted/40 p-4">
          <ul className="space-y-1.5 text-sm">
            {completeCriteria.map((c) => {
              const config = filterFieldConfigs.find((f) => f.field === c.field)
              const valueDisplay = formatValue(c.value)
              return (
                <li key={c.id} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground" />
                  <span>
                    <span className="font-semibold">
                      {config?.label ?? c.field}
                    </span>{' '}
                    {operatorLabel(c.operator)} {valueDisplay}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      </section>

      <div className="flex items-center justify-center">
        <ChevronsDown className="h-5 w-5 text-muted-foreground" />
      </div>

      <section>
        <h3 className="mb-3 text-base font-semibold">
          Groups ({buckets.length})
        </h3>
        <div className="space-y-3">
          {buckets.map((b) => (
            <div key={b.id}>
              <p className="text-sm font-semibold">{b.name || '—'}</p>
              <p className="text-sm text-muted-foreground">
                {b.rule.kind === 'all_remaining'
                  ? 'All remaining students'
                  : `At least ${b.rule.count} criteria`}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function formatValue(value: unknown): string {
  if (Array.isArray(value)) return value.join(', ')
  if (value === null || value === undefined || value === '') return ''
  return String(value)
}
