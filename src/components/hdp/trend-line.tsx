interface TrendLineProps {
  points: Array<number>
}

const VIEWBOX_WIDTH = 120
const VIEWBOX_HEIGHT = 24
const VERTICAL_PADDING = 3

// Pure inline sparkline — no axes, no numbers on the line, aria-hidden
// because the adjacent direction word (rendered by the caller) carries the
// meaning, not the shape. Neutral color only; no per-direction color coding
// (report-book.tsx / marks-grid.tsx both apply `text-muted-foreground`).
export function TrendLine({ points }: TrendLineProps) {
  if (points.length < 2) return null

  const min = Math.min(...points)
  const max = Math.max(...points)
  const range = max - min || 1
  const stepX = VIEWBOX_WIDTH / (points.length - 1)
  const plotHeight = VIEWBOX_HEIGHT - VERTICAL_PADDING * 2

  const coords = points.map((point, index) => ({
    x: index * stepX,
    y: VERTICAL_PADDING + plotHeight - ((point - min) / range) * plotHeight,
  }))
  const last = coords[coords.length - 1]

  return (
    <svg
      viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
      width={VIEWBOX_WIDTH}
      height={VIEWBOX_HEIGHT}
      aria-hidden="true"
      className="text-muted-foreground shrink-0"
    >
      <polyline
        points={coords.map((c) => `${c.x},${c.y}`).join(' ')}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx={last.x} cy={last.y} r="2" fill="currentColor" />
    </svg>
  )
}
