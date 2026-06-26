import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Check, ChevronDown, ChevronUp, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const ILLUSTRATION_SRC = '/import-success-illustration.png'
const COLLAPSED_HEIGHT = 238

interface ImportSuccessPageProps {
  fieldsByCategory: Record<string, Array<string>>
  recordsUpdated?: number
  onClose: () => void
}

export function ImportSuccessPage({
  fieldsByCategory,
  recordsUpdated = 30,
  onClose,
}: ImportSuccessPageProps) {
  const [expanded, setExpanded] = useState(false)
  const [overflows, setOverflows] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const categories = Object.keys(fieldsByCategory)
  const totalFields = Object.values(fieldsByCategory).flat().length

  useEffect(() => {
    setExpanded(false)
    if (contentRef.current) {
      setOverflows(contentRef.current.scrollHeight > COLLAPSED_HEIGHT)
    }
  }, [fieldsByCategory])

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between gap-6 px-6 py-4">
        <span className="text-base font-semibold text-slate-12">
          Import data
        </span>
        <Button
          variant="outline"
          size="icon"
          className="rounded-full"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Body */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Left: content */}
        <div className="flex flex-1 items-start justify-end px-8">
          <div className="flex w-[412px] flex-col gap-8 pt-[140px]">
            <div className="flex flex-col gap-3">
              <h1 className="text-[26px] font-semibold leading-8 text-slate-12">
                You're all set, import done!
              </h1>
              <p className="text-lg font-semibold leading-7 text-twblue-9">
                {recordsUpdated} records updated, {totalFields} fields added
              </p>
            </div>

            <div
              className={cn(
                'relative overflow-hidden rounded-3xl bg-slate-3 p-6',
                overflows && !expanded && 'h-[238px]',
              )}
            >
              <div ref={contentRef} className="flex flex-col gap-4">
                {categories.map((cat) => (
                  <div key={cat} className="flex flex-col gap-1">
                    <p className="text-sm font-semibold leading-5 text-slate-11">
                      {cat}
                    </p>
                    <div className="flex flex-col gap-0.5">
                      {fieldsByCategory[cat].map((field, i) => (
                        <div key={i} className="flex items-center gap-2 py-1">
                          <Check className="h-4 w-4 shrink-0 text-slate-11" />
                          <p className="text-sm leading-5 text-slate-11">
                            {field}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {overflows && (
                <div
                  className={cn(
                    'absolute bottom-0 left-0 right-0 flex h-[64px] items-center justify-end px-6',
                    !expanded && 'bg-muted/85',
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setExpanded((v) => !v)}
                    className="flex items-center gap-1 text-sm font-medium text-slate-12"
                  >
                    {expanded ? 'Show less' : 'Show all'}
                    {expanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                </div>
              )}
            </div>

            <Button onClick={onClose} className="w-fit gap-2 px-6">
              View student data
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Right: illustration */}
        <div className="flex flex-1 items-start justify-start pt-[240px]">
          <img
            src={ILLUSTRATION_SRC}
            alt=""
            className="pointer-events-none ml-12 h-[360px] w-[360px] object-contain"
          />
        </div>
      </div>
    </div>
  )
}
