import { Link, createFileRoute } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/$')({
  component: NotFoundPage,
})

const suggestedDestinations = [
  { label: 'Student Insights', to: '/students' },
  { label: 'Posts', to: '/announcements' },
] as const

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="flex flex-1 items-center justify-center gap-16 px-8 py-12">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-semibold text-slate-900">
            Sorry, we couldn&apos;t find that page
          </h1>
          <p className="mt-3 text-sm text-slate-500">
            The page you were looking for doesn&apos;t exist, or it may have
            moved. Check the URL, or head back to a familiar place.
          </p>

          <Button className="mt-8" render={<Link to="/" />}>
            Back to home
          </Button>

          <div className="mt-10">
            <p className="text-sm text-slate-500">Or try:</p>
            <ul className="mt-3 flex flex-col gap-1.5">
              {suggestedDestinations.map((dest) => (
                <li key={dest.to}>
                  <Link
                    to={dest.to}
                    className="text-sm font-medium text-blue-600 hover:underline"
                  >
                    {dest.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="hidden lg:block">
          <img
            src="/404-illustration.png"
            alt="A person surrounded by scattered papers and screens, looking lost"
            className="h-auto w-80 object-contain"
          />
        </div>
      </div>
    </div>
  )
}
