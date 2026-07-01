import { CHART_GRID, RADAR_FILL, RADAR_STROKE } from '@/lib/chart-colors'
import type { CoreValue } from '@/types/report'

interface RadarChartProps {
  values: Array<CoreValue>
  size?: number
  colorScheme?: 'green' | 'pink'
}

const COLORS = {
  green: {
    fill: RADAR_FILL.green,
    stroke: RADAR_STROKE.green,
  },
  pink: {
    fill: RADAR_FILL.pink,
    stroke: RADAR_STROKE.pink,
  },
}

export function RadarChart({
  values,
  size = 250,
  colorScheme = 'pink',
}: RadarChartProps) {
  const center = size / 2
  const maxRadius = size / 2 - 30
  const levels = 5
  const angleStep = (2 * Math.PI) / values.length
  const startAngle = -Math.PI / 2
  const colors = COLORS[colorScheme]

  function getPoint(index: number, scale: number): { x: number; y: number } {
    const angle = startAngle + index * angleStep
    return {
      x: center + Math.cos(angle) * maxRadius * scale,
      y: center + Math.sin(angle) * maxRadius * scale,
    }
  }

  function getPolygonPoints(scale: number): string {
    return values
      .map((_, i) => {
        const p = getPoint(i, scale)
        return `${p.x},${p.y}`
      })
      .join(' ')
  }

  const dataPoints = values.map((v, i) => getPoint(i, v.score / levels))
  const dataPolygon = dataPoints.map((p) => `${p.x},${p.y}`).join(' ')

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {Array.from({ length: levels }, (_, i) => (
        <polygon
          key={i}
          points={getPolygonPoints((i + 1) / levels)}
          fill="none"
          stroke={CHART_GRID}
          strokeWidth={1}
        />
      ))}

      {values.map((_, i) => {
        const p = getPoint(i, 1)
        return (
          <line
            key={i}
            x1={center}
            y1={center}
            x2={p.x}
            y2={p.y}
            stroke={CHART_GRID}
            strokeWidth={1}
          />
        )
      })}

      <polygon
        points={dataPolygon}
        fill={colors.fill}
        stroke={colors.stroke}
        strokeWidth={2}
      />

      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={4} fill={colors.stroke} />
      ))}

      {values.map((v, i) => {
        const labelPoint = getPoint(i, 1.2)
        const angle = startAngle + i * angleStep
        const degrees = (angle * 180) / Math.PI
        let textAnchor: 'start' | 'middle' | 'end' = 'middle'
        if (degrees > -80 && degrees < 80) textAnchor = 'start'
        else if (degrees > 100 || degrees < -100) textAnchor = 'end'

        return (
          <text
            key={i}
            x={labelPoint.x}
            y={labelPoint.y}
            textAnchor={textAnchor}
            dominantBaseline="middle"
            className="fill-foreground text-xs"
          >
            {v.name}
          </text>
        )
      })}
    </svg>
  )
}
