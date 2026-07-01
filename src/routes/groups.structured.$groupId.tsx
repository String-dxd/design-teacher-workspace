import { useMemo, useState } from 'react'
import { Link, createFileRoute, notFound } from '@tanstack/react-router'
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Info,
  Search,
} from 'lucide-react'

import { getStructuredTypeLabel } from '@/types/student-group'
import { useSetBreadcrumbs } from '@/hooks/use-breadcrumbs'
import { getStructuredGroupById } from '@/data/mock-structured-groups'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export const Route = createFileRoute('/groups/structured/$groupId')({
  component: StructuredGroupDetailPage,
  loader: ({ params }) => {
    const group = getStructuredGroupById(params.groupId)
    if (!group) throw notFound()
    return { group }
  },
})

const PAGE_SIZE = 10

function StructuredGroupDetailPage() {
  const { group } = Route.useLoaderData()
  const { groupId } = Route.useParams()

  useSetBreadcrumbs([
    { label: 'Student Groups', href: '/groups' },
    { label: group.name, href: `/groups/structured/${groupId}` },
  ])

  const [memberSearch, setMemberSearch] = useState('')
  const [page, setPage] = useState(1)

  const filteredMembers = useMemo(() => {
    const q = memberSearch.toLowerCase()
    if (!q) return group.members
    return group.members.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.class.toLowerCase().includes(q) ||
        (m.nric?.toLowerCase().includes(q) ?? false),
    )
  }, [group.members, memberSearch])

  const totalPages = Math.max(1, Math.ceil(filteredMembers.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pagedMembers = filteredMembers.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  )

  return (
    <div className="flex flex-col">
      {/* ── Back link ────────────────────────────────────────────────────────── */}
      <div className="pt-6 px-6">
        <Button
          variant="ghost"
          size="sm"
          render={<Link to="/groups" />}
          className="gap-1.5 -ml-2 text-muted-foreground"
        >
          <ArrowLeft className="size-4" />
          Groups
        </Button>
      </div>

      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <div className="px-6 pt-3 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">{group.name}</h1>
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <Badge variant="outline">
                {getStructuredTypeLabel(group.structuredType)}
              </Badge>
              <Badge
                variant="outline"
                className="gap-1 text-twblue-11 border-twblue-6 bg-twblue-3"
              >
                Synced from School Cockpit
              </Badge>
              <span className="text-sm text-muted-foreground">
                {group.members.length} students
              </span>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* ── Info callout ─────────────────────────────────────────────────────── */}
      <div className="px-6 pt-5 pb-0">
        <Alert className="border-twblue-6 bg-twblue-3/60 text-twblue-12">
          <Info className="h-4 w-4 text-twblue-9" />
          <AlertDescription className="text-twblue-11">
            These groups are managed in School Cockpit. Changes to membership
            and student details must be made by your school administrator.
          </AlertDescription>
        </Alert>
      </div>

      {/* ── Members table ────────────────────────────────────────────────────── */}
      <div className="px-6 pt-5 pb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold">
            Members ({filteredMembers.length}
            {memberSearch && ` of ${group.members.length}`})
          </h2>
          <div className="relative w-[220px]">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search members…"
              value={memberSearch}
              onChange={(e) => {
                setMemberSearch(e.target.value)
                setPage(1)
              }}
              className="pl-9 h-8 text-sm"
            />
          </div>
        </div>
      </div>

      <Table>
        <TableHeader className="border-b bg-background">
          <TableRow className="border-0 hover:bg-transparent">
            <TableHead className="pl-6 w-14">#</TableHead>
            <TableHead className="min-w-[200px]">Name</TableHead>
            <TableHead className="w-36">Class</TableHead>
            <TableHead className="pr-6 w-36">NRIC</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pagedMembers.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={4}
                className="py-12 text-center text-sm text-muted-foreground"
              >
                No members match your search.
              </TableCell>
            </TableRow>
          ) : (
            pagedMembers.map((member, idx) => (
              <TableRow key={member.id}>
                <TableCell className="pl-6 text-sm text-muted-foreground">
                  {(safePage - 1) * PAGE_SIZE + idx + 1}
                </TableCell>
                <TableCell className="font-medium">{member.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {member.class}
                </TableCell>
                <TableCell className="pr-6 font-mono text-xs text-muted-foreground">
                  {member.nric ?? '—'}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* ── Pagination ───────────────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-3 border-t">
          <p className="text-xs text-muted-foreground">
            Showing {(safePage - 1) * PAGE_SIZE + 1}–
            {Math.min(safePage * PAGE_SIZE, filteredMembers.length)} of{' '}
            {filteredMembers.length}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              className="size-8 p-0"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="px-2 text-xs">
              {safePage} / {totalPages}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              className="size-8 p-0"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
