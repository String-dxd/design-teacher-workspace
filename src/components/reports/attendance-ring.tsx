export function AttendanceRing({
  percentage,
  size = 120,
  label,
  strokeWidth = 10,
  color,
}: {
  percentage: number
  size?: number
  label?: string
  strokeWidth?: number
  color?: string
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percentage / 100) * circumference

  const colorClass =
    color != null
      ? undefined
      : percentage >= 90
        ? 'text-lime-11'
        : percentage >= 75
          ? 'text-amber-11'
          : 'text-crimson-11'

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color ?? 'currentColor'}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={colorClass}
        />
      </svg>
      <span className="absolute text-xl font-semibold">
        {label ?? `${Math.round(percentage)}%`}
      </span>
    </div>
  )
}
