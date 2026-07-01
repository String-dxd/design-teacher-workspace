import { useMemo } from 'react'
import { Link, createFileRoute, notFound } from '@tanstack/react-router'
import { ArrowLeft, Users } from 'lucide-react'
import { useSetBreadcrumbs } from '@/hooks/use-breadcrumbs'
import { getFormById } from '@/data/mock-forms'
import { getFormRecipients } from '@/data/mock-form-responses'
import { FormResponseTable } from '@/components/forms/form-response-table'
import { ReadRate } from '@/components/comms/read-rate'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/forms/$id')({
  loader: ({ params }) => {
    const form = getFormById(params.id)
    if (!form) throw notFound()
    const recipients = getFormRecipients(params.id)
    return { form, recipients }
  },
  component: FormDetailPage,
})

function getStatusBadge(status: string) {
  const config: Record<string, { label: string; className: string }> = {
    active: {
      label: 'Active',
      className: 'bg-lime-3 text-lime-11 hover:bg-lime-3',
    },
    draft: {
      label: 'Draft',
      className: 'bg-muted text-muted-foreground hover:bg-muted',
    },
    closed: {
      label: 'Closed',
      className: 'bg-amber-3 text-amber-11 hover:bg-amber-3',
    },
  }
  const { label, className } = config[status] ?? config.draft
  return <Badge className={className}>{label}</Badge>
}

function getFormTypeLabel(formType?: string): string {
  if (formType === 'standard') return 'Standard Form'
  return 'Form'
}

function FormDetailPage() {
  const { form, recipients } = Route.useLoaderData()

  const respondedCount = useMemo(
    () => recipients.filter((r) => r.responseStatus === 'responded').length,
    [recipients],
  )
  const totalCount = recipients.length
  const pendingCount = totalCount - respondedCount

  const questions = form.questions ?? []

  useSetBreadcrumbs([
    { label: 'Forms', href: '/forms' },
    { label: form.title, href: `/forms/${form.id}` },
  ])

  const createdDate = new Date(form.createdAt).toLocaleDateString('en-SG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  const dueDate = form.dueDate
    ? new Date(form.dueDate).toLocaleDateString('en-SG', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null

  return (
    <div className="flex flex-col gap-6 pt-6">
      {/* ── Header ── */}
      <div className="px-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="mt-0.5 shrink-0"
              render={<Link to="/forms" />}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold">{form.title}</h1>
                {getStatusBadge(form.status)}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Created {createdDate} · Daniel Tan
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 px-6 lg:grid-cols-3">
        {/* ── Left: response tracking (2/3) ── */}
        <div className="space-y-6 lg:col-span-2">
          {/* Response stats card */}
          {form.status === 'active' && (
            <div className="rounded-xl border bg-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Responded
                  </p>
                  <p className="mt-1 text-3xl font-bold">
                    {respondedCount}
                    <span className="text-xl font-normal text-muted-foreground">
                      {' '}
                      / {totalCount}
                    </span>
                  </p>
                  {pendingCount > 0 ? (
                    <p className="mt-1 text-sm text-amber-11">
                      {pendingCount} pending
                    </p>
                  ) : totalCount > 0 ? (
                    <p className="mt-1 text-sm text-lime-11">All responded</p>
                  ) : null}
                </div>
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-twblue-2">
                  <Users className="h-7 w-7 text-twblue-9" />
                </div>
              </div>
              {totalCount > 0 && (
                <div className="mt-4">
                  <ReadRate
                    readCount={respondedCount}
                    totalCount={totalCount}
                    className="w-full [&>div:first-child]:h-2 [&>div:first-child]:w-full"
                  />
                </div>
              )}
            </div>
          )}

          {/* Response table */}
          {totalCount > 0 ? (
            <div className="rounded-xl border bg-card p-6">
              <h2 className="mb-4 text-base font-semibold">
                Recipient responses
              </h2>
              <FormResponseTable
                recipients={recipients}
                formTitle={form.title}
                responseType={form.responseType}
                questions={questions}
              />
            </div>
          ) : (
            <div className="flex h-40 items-center justify-center rounded-xl border bg-card">
              <p className="text-sm text-muted-foreground">
                No recipients added yet. Activate the form to start tracking
                responses.
              </p>
            </div>
          )}
        </div>

        {/* ── Right: form details (1/3) ── */}
        <div className="space-y-4">
          <div className="rounded-xl border bg-card p-5">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Form Details
            </h2>
            <div className="space-y-3">
              {/* Title */}
              <div>
                <p className="text-xs text-muted-foreground">Title</p>
                <p className="font-medium">{form.title}</p>
              </div>

              {/* Description */}
              {form.description && (
                <div>
                  <p className="text-xs text-muted-foreground">Description</p>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {form.description}
                  </p>
                </div>
              )}

              {/* Form type */}
              <div>
                <p className="text-xs text-muted-foreground">Type</p>
                <p className="text-sm font-medium">
                  {getFormTypeLabel(form.formType)}
                </p>
              </div>

              {/* Due date */}
              {dueDate && (
                <div>
                  <p className="text-xs text-muted-foreground">Due date</p>
                  <p className="text-sm font-medium">{dueDate}</p>
                </div>
              )}

              {/* Recipients */}
              {form.targetClasses.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground">To parents of</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {form.targetClasses.map((cls) => (
                      <span
                        key={cls}
                        className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
                      >
                        {cls}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Questions */}
              {questions.length > 0 && (
                <div className="border-t pt-3">
                  <p className="mb-2 text-xs text-muted-foreground">
                    Custom questions ({questions.length})
                  </p>
                  <div className="space-y-2">
                    {questions.map((q, i) => (
                      <div key={q.id} className="text-sm">
                        <p className="font-medium text-foreground">
                          Q{i + 1}. {q.text}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {q.type === 'yes-no'
                            ? 'Yes / No'
                            : q.type === 'mcq'
                              ? 'Multiple choice'
                              : q.type === 'checkbox'
                                ? 'Checkbox'
                                : q.type === 'free-text'
                                  ? 'Free text'
                                  : q.type === 'ranking'
                                    ? 'Ranking'
                                    : q.type === 'date'
                                      ? 'Date'
                                      : q.type === 'file-upload'
                                        ? 'File upload'
                                        : q.type}
                          {q.required === false ? ' · Optional' : ''}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
