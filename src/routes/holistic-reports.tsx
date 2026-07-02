import { Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/holistic-reports')({
  component: ReportsLayout,
})

function ReportsLayout() {
  return <Outlet />
}
