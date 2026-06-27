import { Link } from 'react-router-dom'

const COLOR_MAP = {
  blue: {
    border: 'border-[#dceafe]',
    bg: 'bg-[#edf4ff]',
    icon: 'text-[#0070ea]',
    title: 'text-[#5b6472]',
    value: 'text-[#0f172a]',
  },
  green: {
    border: 'border-[#d7f5e4]',
    bg: 'bg-[#ecfbf2]',
    icon: 'text-[#1a6b3c]',
    title: 'text-[#5b6472]',
    value: 'text-[#0f172a]',
  },
  amber: {
    border: 'border-[#ffeab7]',
    bg: 'bg-[#fff8e7]',
    icon: 'text-[#a16207]',
    title: 'text-[#5b6472]',
    value: 'text-[#0f172a]',
  },
  purple: {
    border: 'border-[#e9ddff]',
    bg: 'bg-[#f5efff]',
    icon: 'text-[#6d28d9]',
    title: 'text-[#5b6472]',
    value: 'text-[#0f172a]',
  },
}

function CardSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-4 w-24 rounded bg-[#e5e8ee]" />
      <div className="h-8 w-32 rounded bg-[#e5e8ee]" />
      <div className="h-3 w-40 rounded bg-[#e5e8ee]" />
    </div>
  )
}

export default function StatsCard({
  title,
  value,
  icon,
  subtitle,
  loading = false,
  color = 'blue',
  to,
}) {
  const c = COLOR_MAP[color] ?? COLOR_MAP.blue

  const content = (
    <div className={`rounded-2xl border ${c.border} bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md`}>
      <div className="mb-4 flex items-center justify-between">
        <p className={`text-xs font-semibold uppercase tracking-wide ${c.title}`}>{title}</p>
        <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${c.bg} ${c.icon}`}>
          {icon}
        </span>
      </div>

      {loading ? (
        <CardSkeleton />
      ) : (
        <div className="space-y-1">
          <p className={`text-3xl font-bold leading-none ${c.value}`}>{value}</p>
          {subtitle ? <p className="text-xs text-[#737780]">{subtitle}</p> : null}
        </div>
      )}
    </div>
  )

  if (!to) return content

  return (
    <Link to={to} className="block">
      {content}
    </Link>
  )
}
