import { useMemo, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Copy, MoreHorizontal, Search, Trash2, Users } from 'lucide-react'

import type { FormStatus } from '@/types/form'
import type { FormsFilters } from '@/components/forms/forms-filter-bar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { EmptyState } from '@/components/empty-state'
import {
  EMPTY_FORMS_FILTERS,
  FormsFilterBar,
} from '@/components/forms/forms-filter-bar'
import { ReadRate } from '@/components/comms/read-rate'
import { mockForms } from '@/data/mock-forms'
import { useSetBreadcrumbs } from '@/hooks/use-breadcrumbs'

export const Route = createFileRoute('/forms/')({
  component: FormsPage,
})

function getStatusBadge(status: FormStatus) {
  const config = {
    active: {
      label: 'Open',
      className: 'bg-green-100 text-green-700 hover:bg-green-100',
    },
    draft: {
      label: 'Draft',
      className: 'bg-slate-100 text-slate-700 hover:bg-slate-100',
    },
    closed: {
      label: 'Closed',
      className: 'bg-amber-100 text-amber-700 hover:bg-amber-100',
    },
  }
  const { label, className } = config[status]
  return <Badge className={className}>{label}</Badge>
}

function FormsPage() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<FormsFilters>(EMPTY_FORMS_FILTERS)
  useSetBreadcrumbs([{ label: 'Forms', href: '/forms' }])

  const filteredForms = useMemo(() => {
    return mockForms
      .filter((form) => {
        // Only show custom forms on the Forms page
        if ((form.source ?? 'custom') !== 'custom') return false

        if (
          filters.statuses.length > 0 &&
          !filters.statuses.includes(form.status)
        )
          return false

        if (
          filters.ownerships.length > 0 &&
          !filters.ownerships.includes(form.ownership)
        )
          return false

        if (filters.dateFrom) {
          if (new Date(form.createdAt) < new Date(filters.dateFrom))
            return false
        }
        if (filters.dateTo) {
          const end = new Date(filters.dateTo)
          end.setHours(23, 59, 59, 999)
          if (new Date(form.createdAt) > end) return false
        }

        if (searchQuery) {
          const query = searchQuery.toLowerCase()
          return (
            form.title.toLowerCase().includes(query) ||
            form.description.toLowerCase().includes(query)
          )
        }
        return true
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
  }, [searchQuery, filters])

  return (
    <div className="flex flex-col">
      {/* Tab buttons, Search, Filter & Quick filter */}
      <div className="mt-4 flex flex-col gap-4 px-6 pb-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 md:flex-none">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search forms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 md:w-[240px]"
              aria-label="Search forms"
            />
          </div>
          <FormsFilterBar filters={filters} onChange={setFilters} />
        </div>
      </div>

      {/* Forms Table */}
      <div className="mt-4 max-w-full overflow-x-auto bg-white">
        {filteredForms.length === 0 ? (
          <EmptyState
            title="No forms found"
            description="Try adjusting your search or filter, or create a new form."
          />
        ) : (
          <Table tableClassName="table-fixed w-full">
            <TableHeader className="border-b bg-white">
              <TableRow className="border-0 hover:bg-transparent">
                <TableHead className="w-[500px] pl-6">Title</TableHead>
                <TableHead className="w-[110px]">Date</TableHead>
                <TableHead className="w-[100px]">Status</TableHead>
                <TableHead className="w-[90px]">Owner</TableHead>
                <TableHead className="w-[150px]">Read / Response</TableHead>
                <TableHead className="w-[48px] pr-2" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredForms.map((form) => {
                const isShared = form.ownership === 'shared'
                return (
                  <TableRow
                    key={form.id}
                    className="cursor-pointer"
                    onClick={() =>
                      navigate({
                        to: '/forms/$id',
                        params: { id: form.id },
                      })
                    }
                  >
                    <TableCell className="overflow-hidden whitespace-normal pl-6">
                      <div className="flex items-start gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate font-medium">
                              {form.title}
                            </span>
                          </div>
                          <div className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">
                            {form.description}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(form.createdAt).toLocaleDateString('en-SG', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </TableCell>
                    <TableCell>{getStatusBadge(form.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        {isShared ? (
                          <>
                            <Users className="h-3.5 w-3.5 shrink-0" />
                            <span>Shared</span>
                          </>
                        ) : (
                          <span>Mine</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="pr-6">
                      {form.status === 'draft' ? (
                        <span className="text-sm text-muted-foreground">—</span>
                      ) : (
                        <ReadRate
                          readCount={form.completedCount}
                          totalCount={form.recipientCount}
                        />
                      )}
                    </TableCell>
                    <TableCell
                      className="w-[48px] pr-2 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
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
                          <DropdownMenuItem className="text-destructive focus:text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
