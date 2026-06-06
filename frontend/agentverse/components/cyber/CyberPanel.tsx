import type { ReactNode } from "react";

type CyberPanelProps = Readonly<{
  children: ReactNode;
  className?: string;
  hover?: boolean;
}>;

export default function CyberPanel({ children, className = "", hover = true }: CyberPanelProps) {
  return (
    <section
      className={[
        "rounded-3xl border border-white/[0.05] bg-white/[0.02] backdrop-blur-md",
        "shadow-[0_0_60px_rgba(8,145,178,0.055)]",
        hover ? "transition duration-300 hover:border-cyan-400/30 hover:bg-cyan-400/[0.025]" : "",
        className,
      ].join(" ")}
    >
      {children}
    </section>
  );
}
