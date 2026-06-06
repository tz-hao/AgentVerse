interface ChartBarProps {
  data: { label: string; value: number; color?: string }[];
  height?: number;
  showValues?: boolean;
}

const defaultColors = ['#e62e2e', '#ff7a00', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];

export default function ChartBar({ data, height = 160, showValues = true }: ChartBarProps) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="flex items-end gap-3" style={{ height }}>
      {data.map((d, i) => (
        <div key={d.label} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
          {showValues && (
            <span className="text-xs font-orbitron text-metal-silver/70">{d.value}</span>
          )}
          <div className="w-full relative rounded-t-md overflow-hidden transition-all duration-700 group cursor-pointer"
            style={{ height: `${Math.max((d.value / max) * 100, 4)}%` }}
          >
            <div
              className="absolute inset-0 bg-gradient-to-t opacity-80 hover:opacity-100 transition"
              style={{
                background: `linear-gradient(to top, ${d.color || defaultColors[i % defaultColors.length]}, ${d.color || defaultColors[i % defaultColors.length]}88)`,
              }}
            />
            {/* bottom glow line */}
            <div
              className="absolute bottom-0 left-0 right-0 h-[2px]"
              style={{ backgroundColor: d.color || defaultColors[i % defaultColors.length], boxShadow: `0 0 8px ${d.color || defaultColors[i % defaultColors.length]}` }}
            />
          </div>
          <span className="text-[10px] text-metal-silver/50 whitespace-nowrap">{d.label}</span>
        </div>
      ))}
    </div>
  );
}
