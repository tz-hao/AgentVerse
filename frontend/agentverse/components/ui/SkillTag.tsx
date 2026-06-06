// components/ui/SkillTag.tsx
interface SkillTagProps {
  children: React.ReactNode;
  className?: string;
}

export default function SkillTag({ children, className = "" }: SkillTagProps) {
  return (
    <span 
      className={`
        bg-iron-gray text-metal-silver border border-iron-red
        rounded px-3 py-1 text-xs font-medium
        transition-all duration-200
        hover:bg-iron-red hover:text-white hover:shadow-[0_0_8px_rgba(255,122,0,0.8)]
        hover:-translate-y-0.5
        ${className}
      `}
      style={{
        clipPath: 'polygon(0% 10%, 5% 0%, 95% 0%, 100% 10%, 100% 90%, 95% 100%, 5% 100%, 0% 90%)'
      }}
    >
      {children}
    </span>
  );
}