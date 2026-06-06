// components/ui/MechaDivider.tsx
export default function MechaDivider({ className = "" }: { className?: string }) {
  return (
    <div 
      className={`h-1 bg-gradient-to-r from-iron-red via-neon-orange to-iron-red my-6 ${className}`}
      style={{
        clipPath: 'polygon(0 0, 5% 100%, 10% 0, 15% 100%, 20% 0, 25% 100%, 30% 0, 35% 100%, 40% 0, 45% 100%, 50% 0, 55% 100%, 60% 0, 65% 100%, 70% 0, 75% 100%, 80% 0, 85% 100%, 90% 0, 95% 100%, 100% 0)'
      }}
    />
  );
}