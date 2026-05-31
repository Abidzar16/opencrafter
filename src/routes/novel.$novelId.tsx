import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { NovelShell } from '@/components/layout/novel-shell'

export const Route = createFileRoute('/novel/$novelId')({
  component: NovelLayout,
  beforeLoad: ({ params }) => {
    if (!params.novelId) throw redirect({ to: '/' })
  },
})

function NovelLayout() {
  const { novelId } = Route.useParams()
  return <NovelShell novelId={novelId}><Outlet /></NovelShell>
}
