import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Upload, Users } from 'lucide-react'

import { PageHeader } from '@/components/page-header'

export const Route = createFileRoute('/groups/create')({
  component: GroupsCreate,
})

function ManualMockup() {
  return (
    <div className="flex flex-col gap-2.5 p-5">
      {(['w-3/4', 'w-2/3', 'w-4/5', 'w-3/5'] as const).map((w, i) => (
        <div key={i} className="flex items-center gap-2.5">
          <div className="h-4 w-4 shrink-0 rounded border-2 border-slate-300" />
          <div className={`h-2 rounded-full bg-slate-200 ${w}`} />
        </div>
      ))}
    </div>
  )
}

function UploadMockup() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-4 py-6">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100">
        <Upload className="h-5 w-5 text-slate-400" />
      </div>
      <div className="flex flex-col items-center gap-1">
        <div className="h-2 w-24 rounded-full bg-slate-300" />
        <div className="h-1.5 w-32 rounded-full bg-slate-200" />
      </div>
    </div>
  )
}

const OPTIONS = [
  {
    key: 'manual',
    icon: Users,
    title: 'Manually select students',
    description: 'Browse and pick students by class, CCA, or teaching group.',
    href: '/groups/new',
    mockup: <ManualMockup />,
  },
  {
    key: 'upload',
    icon: Upload,
    title: 'Upload a template',
    description: 'Import a list of students from an Excel or CSV file.',
    href: '/groups/upload',
    mockup: <UploadMockup />,
  },
]

function GroupsCreate() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-[calc(100vh-57px)] flex-col bg-muted/30">
      <PageHeader
        title="New group"
        onClose={() => navigate({ to: '/groups' })}
      />

      {/* Content */}
      <div className="flex flex-1 items-start justify-center px-6 pt-12 sm:items-center sm:pt-0">
        <div className="w-full max-w-2xl">
          <div className="mb-8 text-center">
            <h1 className="text-xl font-semibold sm:text-2xl">
              How would you like to add students?
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Choose a method to get started.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {OPTIONS.map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => navigate({ to: opt.href })}
                className="group flex flex-col overflow-hidden rounded-xl border-2 border-slate-200 bg-white text-left transition-all duration-150 ease-out hover:border-primary/40 hover:shadow-sm active:scale-[0.98]"
              >
                <div className="border-b border-slate-100 bg-slate-50">
                  {opt.mockup}
                </div>
                <div className="p-4">
                  <p className="text-sm font-semibold">{opt.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {opt.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
