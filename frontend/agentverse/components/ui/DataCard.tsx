interface DataCardProps {
  title: string;
  value: string | number;
  icon?: string;
  trend?: { value: number; positive: boolean };
  subtitle?: string;
  className?: string;
  onClick?: () => void;
}

export default function DataCard({ title, value, icon, trend, subtitle, className = '', onClick }: DataCardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        bg-gradient-to-br from-iron-dark to-deep-space
        border border-metal-silver/30 rounded-xl p-5
        hover:border-iron-red/50 hover:shadow-[0_0_20px_rgba(230,46,46,0.15)]
        transition-all duration-300 group cursor-default
        ${className}
      `}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-semibold text-metal-silver/50 uppercase tracking-wider">{title}</span>
        {icon && <i className={`fas ${icon} text-lg text-iron-red/60 group-hover:text-iron-red transition`} />}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-black font-orbitron text-white">{value}</span>
        {trend && (
          <span className={`text-xs font-semibold flex items-center gap-0.5 ${trend.positive ? 'text-green-400' : 'text-red-400'}`}>
            <i className={`fas fa-arrow-${trend.positive ? 'up' : 'down'} text-[10px]`} />
            {trend.value}%
          </span>
        )}
      </div>
      {subtitle && <p className="text-xs text-metal-silver/50 mt-2">{subtitle}</p>}
    </div>
  );
}
