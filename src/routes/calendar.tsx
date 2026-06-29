import { Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/calendar')({
  component: CalendarLayout,
})

function CalendarLayout() {
  return <Outlet />
}
