import { Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/meetings')({
  component: MeetingsLayout,
})

function MeetingsLayout() {
  return <Outlet />
}
