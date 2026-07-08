import { useMemo, useState } from 'react'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
  Copy,
  Crown,
  MoreHorizontal,
  Plus,
  School,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'

import type { PGAnnouncement } from '@/types/pg-announcement'
import { useSetBreadcrumbs } from '@/hooks/use-breadcrumbs'
import {
  mockPGAnnouncements,
  mockSchoolWidePosts,
} from '@/data/mock-pg-announcements'
import { StatusBadge } from '@/components/comms/status-badge'
import { ReadRate } from '@/components/comms/read-rate'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { usePagination } from '@/hooks/use-pagination'
import { cn } from '@/lib/utils'

type PostTab = 'with-responses' | 'view-only'

export const Route = createFileRoute('/announcements-admin')({
  validateSearch: (search) => ({
    scope: (search.scope as 'my' | 'school') ?? 'my',
    tab: (search.tab as PostTab) ?? 'with-responses',
  }),
  component: AdminPostsExperiment,
})

function formatDate(iso: string | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-SG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function AdminBanner({ scope }: { scope: 'my' | 'school' }) {
  const navigate = useNavigate()
  const isSchool = scope === 'school'

  function handleSwitch() {
    navigate({
      to: '/announcements-admin',
      search: (prev) => ({ ...prev, scope: isSchool ? 'my' : 'school' }),
      replace: true,
    })
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleSwitch}
      onKeyDown={(e) => e.key === 'Enter' && handleSwitch()}
      className={cn(
        'mx-6 flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3 transition-all duration-300',
        isSchool
          ? 'border-twblue-6 bg-twblue-3 hover:bg-twblue-4/60'
          : 'border-amber-200 bg-amber-50 hover:bg-amber-100/60',
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
            isSchool ? 'bg-twblue-4' : 'bg-amber-100',
          )}
        >
          {isSchool ? (
            <School className="h-4 w-4 text-twblue-11" />
          ) : (
            <Crown className="h-4 w-4 text-amber-700" />
          )}
        </div>
        <div>
          <p
            className={cn(
              'text-sm font-medium',
              isSchool ? 'text-twblue-12' : 'text-amber-800',
            )}
          >
            You have admin access.
          </p>
          <p
            className={cn(
              'text-xs',
              isSchool ? 'text-twblue-11' : 'text-amber-700',
            )}
          >
            {isSchool
              ? 'Viewing all posts across your school.'
              : 'To view school posts, switch views on the right.'}
          </p>
        </div>
      </div>
      <div
        className={cn(
          'flex shrink-0 items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-sm font-medium transition-colors',
          isSchool
            ? 'border-twblue-6 text-twblue-11 hover:bg-twblue-4'
            : 'border-amber-300 text-amber-800 hover:bg-amber-100',
        )}
      >
        <ArrowLeftRight className="h-3.5 w-3.5" />
        {isSchool ? 'Back to my posts' : 'See all school posts'}
      </div>
    </div>
  )
}

const PAGE_SIZE = 20

function AdminPostsExperiment() {
  const { scope, tab } = Route.useSearch()
  const navigate = useNavigate()
  const isSchoolWide = scope === 'school'
  const [refreshKey, setRefreshKey] = useState(0)

  useSetBreadcrumbs([{ label: 'Posts', href: '/announcements-admin' }])

  function switchTab(newTab: PostTab) {
    navigate({
      to: '/announcements-admin',
      search: (prev) => ({ ...prev, tab: newTab }),
      replace: true,
    })
  }

  const myPosts = useMemo(
    () => [...mockPGAnnouncements],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [refreshKey],
  )

  const schoolPosts = useMemo(
    () =>
      [
        ...mockPGAnnouncements.filter((a) => a.status === 'posted'),
        ...mockSchoolWidePosts,
      ].sort(
        (a, b) =>
          new Date(b.postedAt ?? b.createdAt ?? '').getTime() -
          new Date(a.postedAt ?? a.createdAt ?? '').getTime(),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [refreshKey],
  )

  const filtered = useMemo(() => {
    const source = isSchoolWide ? schoolPosts : myPosts
    return source.filter((a) => {
      const hasResponse =
        a.responseType === 'acknowledge' || a.responseType === 'yes-no'
      if (tab === 'with-responses' && !hasResponse) return false
      if (tab === 'view-only' && hasResponse) return false
      return true
    })
  }, [isSchoolWide, schoolPosts, myPosts, tab])

  const pagination = usePagination({
    totalItems: filtered.length,
    pageSize: PAGE_SIZE,
  })

  const paged = filtered.slice(
    pagination.startIndex,
    pagination.startIndex + PAGE_SIZE,
  )

  function handleDelete(id: string) {
    const idx = mockPGAnnouncements.findIndex((a) => a.id === id)
    if (idx !== -1) mockPGAnnouncements.splice(idx, 1)
    setRefreshKey((k) => k + 1)
    toast.success('Post deleted')
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="shrink-0 space-y-4 pt-6">
        {/* Admin banner — top of page, above title */}
        <AdminBanner scope={scope} />

        {/* Header */}
        <div className="flex items-start justify-between px-6">
          <div>
            <h1 className="text-2xl font-semibold">
              {isSchoolWide ? 'School posts' : 'My posts'}
            </h1>
            <p className="mt-1 hidden text-sm text-muted-foreground lg:block">
              Send posts to parents via Parents Gateway. Choose whether
              parents need to respond.
            </p>
          </div>
          <Button size="sm" render={<Link to="/create" />}>
            <Plus className="mr-1.5 h-4 w-4" />
            Create
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-4 border-b px-6 pb-4">
        <div className="flex w-fit gap-1 rounded-full bg-muted p-1">
          {(['with-responses', 'view-only'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => switchTab(t)}
              className={cn(
                'whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-all',
                tab === t
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {t === 'with-responses' ? 'Response Required' : 'Read Only'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div
        className={cn(
          'overflow-x-auto transition-colors duration-300',
          isSchoolWide && 'bg-twblue-3/40',
        )}
      >
        {paged.length === 0 ? (
          <div className="flex flex-col items-center py-16">
            <p className="text-sm text-muted-foreground">No posts found.</p>
          </div>
        ) : (
          <Table tableClassName="table-fixed w-full">
            <TableHeader className="border-b bg-transparent">
              <TableRow className="border-0 hover:bg-transparent">
                <TableHead className="w-[420px] pl-6">Title</TableHead>
                <TableHead className="w-[110px]">
                  {isSchoolWide ? 'Date sent' : 'Date'}
                </TableHead>
                {isSchoolWide && (
                  <TableHead className="w-[160px]">Teacher</TableHead>
                )}
                {!isSchoolWide && (
                  <TableHead className="w-[100px]">Status</TableHead>
                )}
                <TableHead className="w-[150px]">Read</TableHead>
                <TableHead className="w-[80px] pr-4 text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.map((post) => {
                const totalCount = post.recipients.length
                const readCount = post.recipients.filter(
                  (r) => r.readStatus === 'read',
                ).length
                const responseCount = post.recipients.filter(
                  (r) => r.respondedAt != null,
                ).length
                const hasResponseType =
                  post.responseType === 'acknowledge' ||
                  post.responseType === 'yes-no'
                const isOwnPost = post.ownership === 'mine'
                const teacherLabel = isOwnPost
                  ? 'Me (Daniel Tan)'
                  : (post.postedBy ?? 'Unknown')

                return (
                  <TableRow
                    key={post.id}
                    className="cursor-pointer"
                    onClick={() =>
                      navigate({
                        to: '/announcements/$id',
                        params: { id: post.id },
                      })
                    }
                  >
                    <TableCell className="overflow-hidden whitespace-normal pl-6">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium">{post.title}</span>
                          {post.responseType === 'acknowledge' && (
                            <span className="shrink-0 rounded-full bg-twblue-3 px-1.5 py-0.5 text-[10px] font-medium text-twblue-11 ring-1 ring-inset ring-twblue-6">
                              Acknowledge
                            </span>
                          )}
                          {post.responseType === 'yes-no' && (
                            <span className="shrink-0 rounded-full bg-violet-3 px-1.5 py-0.5 text-[10px] font-medium text-violet-11 ring-1 ring-inset ring-violet-6">
                              Yes/No
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">
                          {post.description.replace(/<[^>]*>/g, '')}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(
                        post.postedAt ?? post.scheduledAt ?? post.createdAt,
                      )}
                    </TableCell>
                    {isSchoolWide && (
                      <TableCell>
                        <span
                          className={cn(
                            'text-sm',
                            isOwnPost
                              ? 'font-medium text-foreground'
                              : 'text-muted-foreground',
                          )}
                        >
                          {teacherLabel}
                        </span>
                      </TableCell>
                    )}
                    {!isSchoolWide && (
                      <TableCell>
                        <StatusBadge status={post.status} />
                      </TableCell>
                    )}
                    <TableCell>
                      {post.status !== 'posted' ? (
                        <span className="text-sm text-muted-foreground">—</span>
                      ) : (
                        <ReadRate
                          readCount={
                            hasResponseType ? responseCount : readCount
                          }
                          totalCount={totalCount}
                        />
                      )}
                    </TableCell>
                    <TableCell
                      className="pr-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex justify-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                aria-label="More actions"
                              />
                            }
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Copy className="mr-2 h-4 w-4" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => handleDelete(post.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}

        {/* Pagination */}
        <div className="flex shrink-0 items-center justify-between px-6 py-4">
          <p className="text-sm text-muted-foreground">
            {pagination.startIndex + 1}–
            {Math.min(pagination.startIndex + PAGE_SIZE, filtered.length)} of{' '}
            {filtered.length} records
          </p>
          {pagination.totalPages > 1 && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={pagination.goToPreviousPage}
                disabled={!pagination.canGoPrevious}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              {pagination.pageNumbers.map((page, index) =>
                page === 'ellipsis' ? (
                  <span
                    key={`ellipsis-${index}`}
                    className="px-2 text-muted-foreground"
                  >
                    ...
                  </span>
                ) : (
                  <Button
                    key={page}
                    variant={
                      pagination.currentPage === page ? 'outline' : 'ghost'
                    }
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => pagination.goToPage(page)}
                  >
                    {page}
                  </Button>
                ),
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={pagination.goToNextPage}
                disabled={!pagination.canGoNext}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
