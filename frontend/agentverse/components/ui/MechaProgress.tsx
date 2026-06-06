// components/ui/MechaProgress.tsx
interface MechaProgressProps {
  value: number; // 0-100
  className?: string;
}

export default function MechaProgress({ value, className = "" }: MechaProgressProps) {
  return (
    <div 
      className={`h-2 bg-iron-gray rounded overflow-hidden shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)] ${className}`}
      style={{
        backgroundImage: 'repeating-linear-gradient(90deg, rgba(200,201,203,0.1), rgba(200,201,203,0.1) 10px, transparent 10px, transparent 20px)'
      }}
    >
      <div 
        className="h-full bg-gradient-to-r from-iron-red to-neon-orange rounded transition-all duration-1000 shadow-[0_0_8px_rgba(255,122,0,0.8)] relative"
        style={{ width: `${value}%` }}
      >
        <div className="absolute top-0 right-0 w-1 h-full bg-metal-silver shadow-[0_0_5px_rgba(255,122,0,0.8)]" />
      </div>
    </div>
  );
}