export default function SkeletonLoader({ lines = 3, className = '' }) {
  return (
    <div className={`animate-pulse space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, idx) => (
        <div key={idx} className="h-4 w-full rounded bg-[#e5e8ee]" />
      ))}
    </div>
  )
}
