import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

type SenFormat = 'sen-high' | 'sen-norm'

interface ExportCsvModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onExport: (options: { senFormats: Array<SenFormat> }) => void
}

interface CheckboxCardProps {
  label: string
  description?: string
  checked: boolean
  onChange: () => void
}

function CheckboxCard({
  label,
  description,
  checked,
  onChange,
}: CheckboxCardProps) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={cn(
        'flex w-full items-start gap-2 rounded-[14px] border p-4 text-left transition-colors',
        checked
          ? 'border-[#98c1ff] bg-[#f5f9ff]'
          : 'border-border bg-background hover:bg-muted/50',
      )}
    >
      <Checkbox
        checked={checked}
        tabIndex={-1}
        className="pointer-events-none mt-0.5 shrink-0"
      />
      <span className="flex flex-col gap-1">
        <span className="text-base leading-none text-[#1c2024]">{label}</span>
        {description && (
          <span className="text-sm leading-none text-[#60646c]">
            {description}
          </span>
        )}
      </span>
    </button>
  )
}

export function ExportCsvModal({
  open,
  onOpenChange,
  onExport,
}: ExportCsvModalProps) {
  const [senFormats, setSenFormats] = useState<Set<SenFormat>>(
    new Set(['sen-high']),
  )

  function toggleFormat(format: SenFormat) {
    setSenFormats((prev) => {
      const next = new Set(prev)
      if (next.has(format)) {
        next.delete(format)
      } else {
        next.add(format)
      }
      return next
    })
  }

  function handleExport() {
    onExport({ senFormats: Array.from(senFormats) })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export data</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <CheckboxCard
            label="Standard"
            description="Export all available data"
            checked={senFormats.has('sen-high')}
            onChange={() => toggleFormat('sen-high')}
          />
          <CheckboxCard
            label="Redacted"
            description="Export all data with sensitive-high data masked"
            checked={senFormats.has('sen-norm')}
            onChange={() => toggleFormat('sen-norm')}
          />
        </div>

        <DialogFooter>
          <Button onClick={handleExport} disabled={senFormats.size === 0}>
            Export
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
