type CyberStatCardProps = Readonly<{
  label: string;
  value: string | number;
  hint?: string;
}>;

export default function CyberStatCard({ label, value, hint }: CyberStatCardProps) {
  return (
    <article className="rounded-3xl border border-white/[0.05] bg-white/[0.02] p-5 backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:border-cyan-400/30 hover:bg-cyan-400/[0.03]">
      <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-white/35">{label}</p>
      <p className="mt-3 font-mono text-3xl font-black text-cyan-400 drop-shadow-[0_0_12px_rgba(34,211,238,0.28)]">
        {value}
      </p>
      {hint ? <p className="mt-2 font-mono text-xs text-white/35">{hint}</p> : null}
    </article>
  );
}
