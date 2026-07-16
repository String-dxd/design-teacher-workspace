import * as React from 'react'
import { Link } from '@tanstack/react-router'
import { DispositionMixBar } from './disposition-mix-bar'
import { PatternCard } from './pattern-card'
import { StreamItem } from './stream-item'
import { useTagQueue } from './tag-queue-context'
import type { HdpTag } from '@/types/hdp'
import { getStudentById } from '@/data/mock-students'
import { MOCK_STAFF } from '@/data/mock-staff'
import {
  confirmPattern,
  deleteTag,
  detectFormingPatterns,
  dismissPattern,
  seedIfEmpty,
  tagsForStudentVisible,
} from '@/lib/hdp-store'
import { EmptyState } from '@/components/empty-state'
import { Button } from '@/components/ui/button'

function staffName(id: string): string {
  return MOCK_STAFF.find((s) => s.id === id)?.name ?? 'Unknown teacher'
}

interface StudentRiverProps {
  studentId: string
  viewerId: string
  /** The reports-river-visibility flag, resolved by the caller — this
   *  component stays flag-free (repo convention: presentational components
   *  don't read feature flags themselves). */
  fullRiver: boolean
  /** true when rendered inside the student profile (h2 header, no page
   *  chrome); false on the dedicated route (h1 header). */
  embedded?: boolean
}

export function StudentRiver({
  studentId,
  viewerId,
  fullRiver,
  embedded = false,
}: StudentRiverProps) {
  const { openTagQueue } = useTagQueue()
  const [mounted, setMounted] = React.useState(false)
  const [visibleTags, setVisibleTags] = React.useState<Array<HdpTag>>([])
  const [patterns, setPatterns] = React.useState<
    ReturnType<typeof detectFormingPatterns>
  >([])

  const refresh = React.useCallback(() => {
    seedIfEmpty()
    const tags = tagsForStudentVisible(studentId, viewerId, fullRiver)
    setVisibleTags(tags)
    const visibleTagIds = new Set(tags.map((t) => t.id))
    // Never surface a pattern built from tags this viewer can't otherwise
    // see — form teacher / fullRiver already covers every tag, so this only
    // narrows the list for a colleague viewing another teacher's class.
    setPatterns(
      detectFormingPatterns(studentId).filter((p) =>
        p.tagIds.every((id) => visibleTagIds.has(id)),
      ),
    )
  }, [studentId, viewerId, fullRiver])

  React.useEffect(() => {
    setMounted(true)
    refresh()
  }, [refresh])

  const student = getStudentById(studentId)
  const name = student?.name ?? 'This student'

  const teacherCount = new Set(visibleTags.map((t) => t.authorId)).size
  const contextCount = new Set(visibleTags.map((t) => t.context)).size

  const Heading = embedded ? 'h2' : 'h1'

  if (!mounted) {
    return <div aria-hidden className="h-24" />
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Heading
            className={
              embedded ? 'text-lg font-semibold' : 'text-2xl font-semibold'
            }
          >
            {name}
          </Heading>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => openTagQueue({ studentId, entryPoint: 'row' })}
          >
            + Add my observation
          </Button>
        </div>
        {visibleTags.length > 0 && (
          <p className="text-muted-foreground text-sm tabular-nums">
            {visibleTags.length} observation
            {visibleTags.length === 1 ? '' : 's'} · {teacherCount} teacher
            {teacherCount === 1 ? '' : 's'} · {contextCount} context
            {contextCount === 1 ? '' : 's'}
          </p>
        )}
      </div>

      {visibleTags.length === 0 ? (
        <EmptyState
          title="No observations yet this term"
          description={`Add one when a moment stands out, or ask colleagues who teach ${name}.`}
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button
                variant="secondary"
                onClick={() => openTagQueue({ studentId, entryPoint: 'row' })}
              >
                Add my observation
              </Button>
              <Button
                variant="ghost"
                render={
                  <Link to="/reports/students" search={{ tab: 'gaps' }} />
                }
              >
                Ask colleagues
              </Button>
            </div>
          }
        />
      ) : (
        <div className="flex flex-col gap-6">
          <DispositionMixBar tags={visibleTags} />

          {patterns.length > 0 && (
            <div className="flex flex-col gap-2">
              {patterns.map((pattern) => (
                <PatternCard
                  key={pattern.id}
                  pattern={pattern}
                  onConfirm={
                    pattern.status === 'candidate'
                      ? () => {
                          confirmPattern(pattern.id, viewerId)
                          refresh()
                        }
                      : undefined
                  }
                  onDismiss={
                    pattern.status === 'candidate'
                      ? () => {
                          dismissPattern(pattern.id)
                          refresh()
                        }
                      : undefined
                  }
                />
              ))}
            </div>
          )}

          <ol className="flex flex-col divide-y divide-border">
            {visibleTags
              .slice()
              .sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime(),
              )
              .map((tag) => {
                const editable =
                  Date.now() < new Date(tag.editableUntil).getTime() &&
                  tag.authorId === viewerId
                return (
                  <StreamItem
                    key={tag.id}
                    tag={tag}
                    authorName={staffName(tag.authorId)}
                    editable={editable}
                    onEdit={
                      editable
                        ? () => {
                            // The Tag Queue composer's own "recent tags"
                            // list (tag-queue-context.tsx, out of scope for
                            // this plan) is where an author edits a recent
                            // tag's fields; from the river we can only
                            // reopen that same composer pinned to this
                            // student — there's no prefill hook yet for
                            // "edit this exact tag" from an arbitrary
                            // caller.
                            openTagQueue({ studentId, entryPoint: 'row' })
                          }
                        : undefined
                    }
                    onDelete={
                      editable
                        ? () => {
                            deleteTag(tag.id)
                            refresh()
                          }
                        : undefined
                    }
                  />
                )
              })}
          </ol>
        </div>
      )}
    </div>
  )
}
