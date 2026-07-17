import * as React from 'react'
import { Link } from '@tanstack/react-router'
import { format, startOfISOWeek } from 'date-fns'
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

/** Newest week first, tags newest-first within each week. The header names
 *  the week by its Monday ("Week of 6 Jul") — a real date beats the bare
 *  ISO week number the stream used to show per row. */
function groupTagsByWeek(
  tags: Array<HdpTag>,
): Array<{ key: string; label: string; tags: Array<HdpTag> }> {
  const sorted = tags
    .slice()
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
  const groups: Array<{ key: string; label: string; tags: Array<HdpTag> }> = []
  for (const tag of sorted) {
    const weekStart = startOfISOWeek(new Date(tag.createdAt))
    const key = format(weekStart, 'yyyy-MM-dd')
    const current = groups.at(-1)
    if (current && current.key === key) {
      current.tags.push(tag)
    } else {
      groups.push({
        key,
        label: `Week of ${format(weekStart, 'd MMM')}`,
        tags: [tag],
      })
    }
  }
  return groups
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
  /** Draft-studio selection mode (Prototype B): the river doubles as the
   *  insight-curation surface — observations and confirmed threads lead
   *  with checkboxes. Absent everywhere else (river page, profile tab). */
  selection?: {
    isTagSelected: (tagId: string) => boolean
    onToggleTag: (tagId: string) => void
    isPatternSelected: (patternId: string) => boolean
    onTogglePattern: (patternId: string) => void
  }
}

export function StudentRiver({
  studentId,
  viewerId,
  fullRiver,
  embedded = false,
  selection,
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

  // One provenance line reused by both the embedded and standalone layouts,
  // so the count and pluralization can never drift between them.
  const countLine =
    visibleTags.length > 0 ? (
      <p className="text-muted-foreground text-sm tabular-nums">
        {visibleTags.length} observation
        {visibleTags.length === 1 ? '' : 's'} · {teacherCount} teacher
        {teacherCount === 1 ? '' : 's'} · {contextCount} context
        {contextCount === 1 ? '' : 's'}
      </p>
    ) : null

  return (
    <div className="flex flex-col gap-6">
      {/* Embedded (inside the draft workspace / student profile) the page
          already names the student — lead with the provenance line instead
          of repeating the name. */}
      {embedded ? (
        visibleTags.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            {countLine}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => openTagQueue({ studentId, entryPoint: 'row' })}
            >
              + Add my observation
            </Button>
          </div>
        )
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Heading className="text-2xl font-semibold">{name}</Heading>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => openTagQueue({ studentId, entryPoint: 'row' })}
            >
              + Add my observation
            </Button>
          </div>
          {countLine}
        </div>
      )}

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
                render={<Link to="/reports" search={{ tab: 'drafting' }} />}
              >
                Ask colleagues
              </Button>
            </div>
          }
        />
      ) : (
        <div className="flex flex-col gap-6">
          <div className="max-w-md">
            <DispositionMixBar tags={visibleTags} />
          </div>

          {patterns.length > 0 && (
            <div className="flex flex-col gap-2">
              {patterns.map((pattern) => (
                <PatternCard
                  key={pattern.id}
                  pattern={pattern}
                  studentFirstName={name.split(' ')[0] ?? name}
                  selected={
                    selection && pattern.status === 'confirmed'
                      ? selection.isPatternSelected(pattern.id)
                      : undefined
                  }
                  onSelectedChange={
                    selection && pattern.status === 'confirmed'
                      ? () => selection.onTogglePattern(pattern.id)
                      : undefined
                  }
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

          <div className="flex flex-col gap-5">
            {groupTagsByWeek(visibleTags).map((group) => (
              <section key={group.key} className="flex flex-col gap-1">
                <h3 className="text-muted-foreground text-xs font-medium">
                  {group.label}
                </h3>
                <ol className="divide-border flex flex-col divide-y">
                  {group.tags.map((tag) => {
                    const editable =
                      Date.now() < new Date(tag.editableUntil).getTime() &&
                      tag.authorId === viewerId
                    return (
                      <StreamItem
                        key={tag.id}
                        tag={tag}
                        authorName={staffName(tag.authorId)}
                        editable={editable}
                        selected={
                          selection
                            ? selection.isTagSelected(tag.id)
                            : undefined
                        }
                        onSelectedChange={
                          selection
                            ? () => selection.onToggleTag(tag.id)
                            : undefined
                        }
                        onEdit={
                          editable
                            ? () => {
                                // The Tag Queue composer's own "recent tags"
                                // list (tag-queue-context.tsx, out of scope
                                // for this plan) is where an author edits a
                                // recent tag's fields; from the river we can
                                // only reopen that same composer pinned to
                                // this student — there's no prefill hook yet
                                // for "edit this exact tag" from an
                                // arbitrary caller.
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
              </section>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
