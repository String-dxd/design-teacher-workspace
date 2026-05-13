import { useRef, useState } from 'react'
import { Download, MoreHorizontal, Search, Upload } from 'lucide-react'
import { toast } from 'sonner'

import { MultiFilterPopover } from './multi-filter-popover'
import { ColumnVisibilityPopover } from './column-visibility-popover'
import { ExportCsvModal } from './export-csv-modal'
import { ImportWizard } from './import-wizard'
import { ImportProgressToast } from './import-progress-toast'
import { ImportSuccessPage } from './import-success-page'
import type { ImportResult } from './import-wizard'
import type { ReactNode } from 'react'
import type { ColumnConfig } from './column-visibility-popover'
import type { FilterCriterion } from '@/types/student'
import { useFeatureFlags } from '@/lib/feature-flags'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface StudentFiltersProps {
  searchValue: string
  onSearchChange: (value: string) => void
  filters: Array<FilterCriterion>
  onFiltersChange: (filters: Array<FilterCriterion>) => void
  columns: Array<ColumnConfig>
  onColumnsChange: (columns: Array<ColumnConfig>) => void
  onImportComplete?: (importedColumns: Array<ColumnConfig>) => void
  importedColumns?: Array<{ id: string; label: string }>
  matchedCount?: number
  totalCount?: number
  className?: string
  /** Optional slot rendered on the right side, before column visibility */
  rightSlot?: ReactNode
}

export function StudentFilters({
  searchValue,
  onSearchChange,
  filters,
  onFiltersChange,
  columns,
  onColumnsChange,
  onImportComplete,
  importedColumns = [],
  matchedCount,
  totalCount,
  className,
  rightSlot,
}: StudentFiltersProps) {
  const { flags } = useFeatureFlags()
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [successPage, setSuccessPage] = useState<{
    fileName: string
    fieldsByCategory: Record<string, Array<string>>
  } | null>(null)
  const progressIntervalRef = useRef<number | null>(null)

  function startImportProgress(result: ImportResult) {
    const { columns: columnsToImport, fileName, fieldsByCategory } = result

    if (progressIntervalRef.current) {
      window.clearInterval(progressIntervalRef.current)
      progressIntervalRef.current = null
    }

    const willFail = fileName.toLowerCase().includes('fail')
    const toastId = `import-progress-${Date.now()}`
    let percent = 0

    const renderToast = (jsx: ReactNode) =>
      toast.custom(() => jsx, {
        id: toastId,
        duration: Infinity,
        unstyled: true,
      })

    renderToast(
      <ImportProgressToast state="importing" fileName={fileName} percent={0} />,
    )

    progressIntervalRef.current = window.setInterval(() => {
      percent = Math.min(100, percent + Math.round(8 + Math.random() * 6))

      if (percent < 100) {
        renderToast(
          <ImportProgressToast
            state="importing"
            fileName={fileName}
            percent={percent}
          />,
        )
        return
      }

      if (progressIntervalRef.current) {
        window.clearInterval(progressIntervalRef.current)
        progressIntervalRef.current = null
      }

      if (willFail) {
        toast.custom(
          () => (
            <ImportProgressToast
              state="failed"
              fileName={fileName}
              onRetry={() => {
                toast.dismiss(toastId)
                setImportDialogOpen(true)
              }}
              onDismiss={() => toast.dismiss(toastId)}
            />
          ),
          { id: toastId, duration: 10000, unstyled: true },
        )
      } else {
        onImportComplete?.(columnsToImport)
        toast.custom(
          () => (
            <ImportProgressToast
              state="success"
              fileName={fileName}
              onReview={() => {
                toast.dismiss(toastId)
                setSuccessPage({ fileName, fieldsByCategory })
              }}
              onDismiss={() => toast.dismiss(toastId)}
            />
          ),
          { id: toastId, duration: 10000, unstyled: true },
        )
      }
    }, 350)
  }

  return (
    <>
      <div
        className={cn(
          'flex flex-col gap-4 md:flex-row md:items-center md:justify-between',
          className,
        )}
      >
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 md:flex-none">
            <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Search name"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 md:w-[200px]"
              aria-label="Search students"
            />
          </div>
          <MultiFilterPopover
            filters={filters}
            onFiltersChange={onFiltersChange}
            importedFields={importedColumns}
            matchedCount={matchedCount}
            totalCount={totalCount}
          />
        </div>

        <div className="flex items-center gap-2">
          {rightSlot}
          <ColumnVisibilityPopover
            columns={columns}
            onColumnsChange={onColumnsChange}
          />

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="p-3">
              <DropdownMenuItem onClick={() => setExportModalOpen(true)}>
                <Download className="mr-2 size-4" />
                Export data
              </DropdownMenuItem>
              {flags['import-data'] && (
                <DropdownMenuItem onClick={() => setImportDialogOpen(true)}>
                  <Upload className="mr-2 size-4" />
                  Import data
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {flags['import-data'] && importDialogOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background">
          <ImportWizard
            onClose={() => setImportDialogOpen(false)}
            onImportComplete={startImportProgress}
          />
        </div>
      )}

      {successPage && (
        <ImportSuccessPage
          fieldsByCategory={successPage.fieldsByCategory}
          onClose={() => setSuccessPage(null)}
        />
      )}

      <ExportCsvModal
        open={exportModalOpen}
        onOpenChange={setExportModalOpen}
        onExport={({ senFormats }) => {
          console.log('Exporting CSV', { senFormats })
        }}
      />
    </>
  )
}
