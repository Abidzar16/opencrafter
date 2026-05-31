import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/novel/$novelId/')({
  beforeLoad: ({ params }) => {
    throw redirect({ to: '/novel/$novelId/plan', params })
  },
  component: () => null,
})
