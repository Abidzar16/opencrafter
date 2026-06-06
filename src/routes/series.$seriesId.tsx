import { createFileRoute } from '@tanstack/react-router'
import { SeriesHome } from '@/components/series/SeriesHome'

export const Route = createFileRoute('/series/$seriesId')({
  component: SeriesPage,
})

function SeriesPage() {
  const { seriesId } = Route.useParams()
  return <SeriesHome seriesId={seriesId} />
}
