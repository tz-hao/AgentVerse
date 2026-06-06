// components/ui/MechaButton.tsx
'use client';

interface MechaButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export default function MechaButton({ children, onClick, className = "" }: MechaButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        bg-gradient-to-b from-iron-red to-[#c02525]
        border border-metal-silver rounded
        px-6 py-2 font-orbitron text-sm font-semibold text-white
        cursor-pointer relative overflow-hidden
        transition-all duration-300
        hover:bg-gradient-to-b hover:from-iron-red hover:to-neon-orange
        hover:shadow-[0_0_10px_rgba(255,122,0,0.8),0_0_20px_rgba(230,46,46,0.6)]
        hover:-translate-y-0.5
        ${className}
      `}
      style={{
        clipPath: 'polygon(5% 0%, 100% 0%, 95% 100%, 0% 100%)'
      }}
    >
      {children}
    </button>
  );
}