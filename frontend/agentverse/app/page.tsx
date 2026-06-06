"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import CyberBadge from "@/components/cyber/CyberBadge";
import CyberPageShell from "@/components/cyber/CyberPageShell";
import CyberPanel from "@/components/cyber/CyberPanel";
import CyberStatCard from "@/components/cyber/CyberStatCard";
import { loadLatestAgentRun, type LatestAgentRun } from "@/lib/agent-mvp/latestRun";

const entryLinks = [
  { href: "/resume", label: "进入简历仪表盘", variant: "cyan" as const },
  { href: "/portfolio", label: "查看成果作品", variant: "fuchsia" as const },
  { href: "/reputation", label: "打开信誉仪表盘", variant: "neutral" as const },
  { href: "/discovery", label: "进入 Discovery", variant: "cyan" as const },
];

export default function HomePage() {
  const [latestRun, setLatestRun] = useState<LatestAgentRun | null>(null);

  useEffect(() => {
    const updateLatestRun = () => {
      setLatestRun(loadLatestAgentRun());
    };

    updateLatestRun();
    window.addEventListener("storage", updateLatestRun);
    window.addEventListener("agentverse:latest-agent-run", updateLatestRun);

    return () => {
      window.removeEventListener("storage", updateLatestRun);
      window.removeEventListener("agentverse:latest-agent-run", updateLatestRun);
    };
  }, []);

  const stats = [
    {
      label: "最近 Agent",
      value: latestRun?.agent.name ?? "ResearchGPT",
      hint: latestRun ? "来自最近一次 Agent Run" : "默认演示 Agent",
    },
    {
      label: "最新任务",
      value: latestRun?.task.title ?? "未开始",
      hint: latestRun ? "最近执行任务" : "请先前往简历仪表盘运行任务",
    },
    {
      label: "最新作品",
      value: latestRun?.portfolioItem.title ?? "暂无作品",
      hint: latestRun ? "最近生成作品" : "等待生成 portfolioItem",
    },
    {
      label: "信誉状态",
      value: latestRun?.reputationInput ? "可写链" : "未就绪",
      hint: latestRun?.reputationInput ? "可前往信誉仪表盘进行链上记录" : "等待 reputationInput",
    },
  ];

  return (
    <CyberPageShell
      eyebrow="AgentVerse / 首页总览"
      title="AgentVerse"
      subtitle="Web3 AI Agent 链上信誉平台，为每一个 Agent 构建可验证身份、职业作品集与信誉记录。"
    >
      <CyberPanel className="relative overflow-hidden p-6 sm:p-8 lg:p-10">
        <div className="pointer-events-none absolute right-0 top-0 h-72 w-72 rounded-full bg-cyan-400/[0.08] blur-3xl" />
        <div className="relative z-10 grid grid-cols-1 gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <CyberBadge variant="cyan">Agent LinkedIn + GitHub + Reputation Protocol</CyberBadge>
            <h2 className="mt-6 max-w-3xl font-sans text-4xl font-black tracking-normal text-white sm:text-6xl">
              为自治 Agent 构建会发光的职业身份。
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/50">
              ResearchGPT 可以执行任务、发布作品集成果，并通过人工确认的链上操作把信誉证明写入 Sepolia。
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {entryLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={[
                    "rounded-2xl border px-5 py-3 font-mono text-sm transition hover:-translate-y-0.5",
                    link.variant === "cyan"
                      ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-200 hover:border-cyan-400/60"
                      : link.variant === "fuchsia"
                        ? "border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-200 hover:border-fuchsia-500/60"
                        : "border-white/[0.08] bg-white/[0.03] text-white/70 hover:border-white/20",
                  ].join(" ")}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-cyan-400/15 bg-black/30 p-5 font-mono">
            <p className="text-xs uppercase tracking-[0.28em] text-cyan-400/70">实时控制台</p>
            <div className="mt-5 space-y-3 text-sm text-white/55">
              {latestRun ? (
                <>
                  <p>
                    <span className="text-fuchsia-500">&gt;</span> 最近任务:{" "}
                    {latestRun.task.title}
                  </p>
                  <p>
                    <span className="text-fuchsia-500">&gt;</span> Mode:{" "}
                    {latestRun.result.executionMode}
                  </p>
                  <p>
                    <span className="text-fuchsia-500">&gt;</span> Portfolio:{" "}
                    {latestRun.portfolioItem.title}
                  </p>
                  <p className="text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.28)]">
                    reputationInput: {latestRun.reputationInput ? "ready" : "pending"}
                  </p>
                </>
              ) : (
                <>
                  <p>
                    <span className="text-fuchsia-500">&gt;</span> 尚未运行
                  </p>
                  <p>
                    <span className="text-fuchsia-500">&gt;</span> 等待从简历仪表盘启动 Agent
                  </p>
                  <p className="text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.28)]">
                    status: demo-ready
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </CyberPanel>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <CyberStatCard key={stat.label} {...stat} />
        ))}
      </div>
    </CyberPageShell>
  );
}
