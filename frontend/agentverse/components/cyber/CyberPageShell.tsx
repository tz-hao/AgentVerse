import type { ReactNode } from "react";

type CyberPageShellProps = Readonly<{
  title: string;
  subtitle: string;
  eyebrow?: string;
  children: ReactNode;
  actions?: ReactNode;
}>;

export default function CyberPageShell({
  title,
  subtitle,
  eyebrow = "AgentVerse / 控制台",
  children,
  actions,
}: CyberPageShellProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0a0a0f] px-4 py-8 text-white sm:px-6">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(217,70,239,0.03)_1px,transparent_1px)] bg-[size:32px_32px]" />
      <div className="pointer-events-none absolute -top-40 right-0 h-96 w-96 rounded-full bg-cyan-400/[0.06] blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-16 h-96 w-96 rounded-full bg-fuchsia-500/[0.045] blur-3xl" />

      <div className="relative z-10 mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.28em] text-cyan-400/70">
              {eyebrow}
            </p>
            <h1 className="font-sans text-3xl font-black tracking-normal text-white sm:text-4xl">
              {title}
              <span className="ml-2 inline-block h-7 w-2 translate-y-1 animate-pulse bg-cyan-400 shadow-[0_0_18px_rgba(34,211,238,0.75)] sm:h-8" />
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/50 sm:text-base">
              {subtitle}
            </p>
          </div>
          {actions ? <div className="flex shrink-0 flex-wrap gap-3">{actions}</div> : null}
        </header>

        {children}
      </div>
    </main>
  );
}
