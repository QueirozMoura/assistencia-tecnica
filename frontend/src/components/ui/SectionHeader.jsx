export default function SectionHeader({ badge, title, subtitle, center = true, light = false }) {
  return (
    <div className={`mb-10 ${center ? 'text-center' : ''}`}>
      {badge && (
        <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full mb-3 uppercase tracking-wider ${
          light
            ? 'bg-white/20 text-white'
            : 'bg-[#cce0ff] text-[#003366]'
        }`}>
          {badge}
        </span>
      )}
      <h2 className={`text-2xl md:text-3xl font-bold leading-tight ${light ? 'text-white' : 'text-[#003366]'}`}>
        {title}
      </h2>
      {subtitle && (
        <p className={`mt-3 text-base leading-relaxed max-w-2xl ${center ? 'mx-auto' : ''} ${
          light ? 'text-[#a7c8ff]' : 'text-[#43474f]'
        }`}>
          {subtitle}
        </p>
      )}
    </div>
  )
}
