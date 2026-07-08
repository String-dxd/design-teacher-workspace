import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface StudentTableSkeletonProps {
  rows?: number
  columns?: number
}

export function StudentTableSkeleton({
  rows = 10,
  columns = 8,
}: StudentTableSkeletonProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12 min-w-12 pl-6">#</TableHead>
            <TableHead className="min-w-[140px]">Name</TableHead>
            <TableHead className="min-w-[60px]">Class</TableHead>
            <TableHead className="min-w-[100px]">Attention tag</TableHead>
            {Array.from({ length: Math.max(0, columns - 4) }).map((_, i) => (
              <TableHead key={i} className="min-w-[80px]">
                <Skeleton className="h-4 w-16" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <TableRow key={rowIndex}>
              <TableCell className="pl-6">
                <Skeleton className="h-4 w-6" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-24" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-10" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-6 w-12 rounded-full" />
              </TableCell>
              {Array.from({ length: Math.max(0, columns - 4) }).map((__, i) => (
                <TableCell key={i}>
                  <Skeleton className="h-4 w-12" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Pagination skeleton */}
      <div className="flex shrink-0 items-center justify-between px-6 py-4">
        <Skeleton className="h-4 w-20" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-8 w-16" />
        </div>
      </div>
    </div>
  )
}
