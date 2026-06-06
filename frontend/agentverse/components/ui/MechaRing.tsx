// components/ui/MechaRing.tsx
interface MechaRingProps {
  value: number; // 0-100
  size?: number;
}

export default function MechaRing({ value, size = 200 }: MechaRingProps) {
  return (
    <div 
      className="relative mx-auto"
      style={{ width: size, height: size }}
    >
      <div 
        className="w-full h-full rounded-full flex items-center justify-center"
        style={{
          background: `conic-gradient(#ff7a00 0% ${value}%, #2a2a38 ${value}% 100%)`,
          boxShadow: '0 0 20px rgba(230,46,46,0.6), inset 0 0 20px rgba(0,0,0,0.5)'
        }}
      >
        <div 
          className="absolute w-[85%] h-[85%] rounded-full bg-deep-space border-2 border-metal-silver"
          style={{ boxShadow: 'inset 0 0 15px rgba(230,46,46,0.6)' }}
        />
        <span className="text-5xl font-black font-orbitron text-white relative z-10"
          style={{ textShadow: '0 0 5px #c8c9cb, 0 0 10px #ff7a00, 0 0 15px #e62e2e' }}
        >
          {value}
        </span>
        <span className="absolute bottom-6 right-6 text-xs font-mono text-neon-orange z-10">/100</span>
      </div>
    </div>
  );
}