// components/ui/MechaCard.tsx
'use client';

interface MechaCardProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}

export default function MechaCard({ children, className = "", glow = true }: MechaCardProps) {
  return (
    <div 
      className={`
        bg-gradient-to-br from-iron-dark to-deep-space
        border border-metal-silver rounded-lg
        shadow-[0_0_15px_rgba(230,46,46,0.2),inset_0_1px_0_rgba(200,201,203,0.1),inset_0_-1px_0_rgba(0,0,0,0.5)]
        relative overflow-hidden
        ${glow ? 'glow-sweep' : ''}
        ${className}
      `}
      style={{
        clipPath: 'polygon(0% 2px, 2px 0%, calc(100% - 2px) 0%, 100% 2px, 100% calc(100% - 2px), calc(100% - 2px) 100%, 2px 100%, 0% calc(100% - 2px))'
      }}
    >
      {/* 金属拉丝纹理 */}
      <div 
        className="absolute inset-0 pointer-events-none z-1"
        style={{
          background: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(200,201,203,0.03) 2px, rgba(200,201,203,0.03) 4px)'
        }}
      />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}