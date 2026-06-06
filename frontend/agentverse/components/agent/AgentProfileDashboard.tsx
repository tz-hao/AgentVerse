"use client";

import { useEffect, useState } from "react";

import {
  AGENT_PROGRESS_EVENT,
  getAgentLevel,
  getAgentStats,
  getPortfolioHistory,
  type AgentStats,
  type PortfolioHistoryItem,
} from "@/lib/agent-mvp/agentProgress";
import { loadLatestAgentRun, type LatestAgentRun } from "@/lib/agent-mvp/latestRun";
import type { AgentProfile } from "@/lib/agents/agentTypes";

const defaultAgent: AgentProfile = {
  id: "agent_research_gpt_001",
  did: "agent://research-gpt-001",
  name: "ResearchGPT",
  category: "Research",
  description: "Senior Research Agent",
  skills: ["Token Research", "Onchain Analysis", "Risk Assessment"],
  serviceTypes: ["Web3 Research", "Protocol Analysis", "Risk Report"],
  ownerAddress: "0xResearchGPT",
  collaborators: ["AuditGPT", "RiskGPT", "MarketGPT"],
};

const emptyStats: AgentStats = {
  completedTasks: 0,
  successfulTasks: 0,
  totalRating: 0,
  totalRevenue: 0,
  reputationScore: 0,
};

type AgentProfileDashboardProps = {
  agent?: AgentProfile;
};

export default function AgentProfileDashboard({ agent }: AgentProfileDashboardProps) {
  const [latestRun, setLatestRun] = useState<LatestAgentRun | null>(() =>
    typeof window === "undefined" ? null : loadLatestAgentRun(),
  );
  const displayAgent = agent ?? latestRun?.agent ?? defaultAgent;
  const [stats, setStats] = useState<AgentStats>(() =>
    typeof window === "undefined" ? emptyStats : getAgentStats(displayAgent.id),
  );
  const [portfolioHistory, setPortfolioHistory] = useState<PortfolioHistoryItem[]>(() =>
    typeof window === "undefined" ? [] : getPortfolioHistory(displayAgent.id),
  );

  useEffect(() => {
    const updateDashboard = () => {
      const run = loadLatestAgentRun();
      const activeAgent = agent ?? run?.agent ?? defaultAgent;
      setLatestRun(run);
      setStats(getAgentStats(activeAgent.id));
      setPortfolioHistory(getPortfolioHistory(activeAgent.id));
    };

    const timer = window.setTimeout(updateDashboard, 0);
    window.addEventListener("storage", updateDashboard);
    window.addEventListener("agentverse:latest-agent-run", updateDashboard);
    window.addEventListener(AGENT_PROGRESS_EVENT, updateDashboard);

    return () => {
      window.removeEventListener("storage", updateDashboard);
      window.removeEventListener("agentverse:latest-agent-run", updateDashboard);
      window.removeEventListener(AGENT_PROGRESS_EVENT, updateDashboard);
      window.clearTimeout(timer);
    };
  }, [agent]);

  const successRate =
    stats.completedTasks > 0
      ? Math.round((stats.successfulTasks / stats.completedTasks) * 100)
      : 0;
  const level = getAgentLevel(stats.reputationScore);
  const metrics = [
    { label: "成功率", value: `${successRate}%`, hint: "该 Agent 已完成任务的成功比例" },
    { label: "完成任务", value: stats.completedTasks.toString(), hint: "该 Agent 累计 Run" },
    { label: "收入", value: `${stats.totalRevenue} USDC`, hint: "该 Agent 累计任务奖励" },
  ];

  return (
    <section className="relative mb-8 overflow-hidden rounded-3xl border border-white/[0.05] bg-[#0a0a0f] p-5 shadow-[0_0_80px_rgba(8,145,178,0.08)] sm:p-6 lg:p-8">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(217,70,239,0.04)_1px,transparent_1px)] bg-[size:28px_28px]" />
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-cyan-400/[0.08] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 left-1/4 h-72 w-72 rounded-full bg-fuchsia-500/[0.07] blur-3xl" />

      <div className="relative z-10">
        <header className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.28em] text-cyan-400/70">
              <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_14px_rgba(34,211,238,0.8)]" />
              Agent LinkedIn / 实时档案
            </div>
            <h1 className="font-sans text-4xl font-black tracking-normal text-white sm:text-5xl">
              {displayAgent.name}
              <span className="ml-2 inline-block h-9 w-3 translate-y-1 animate-pulse bg-cyan-400 shadow-[0_0_18px_rgba(34,211,238,0.75)] sm:h-11" />
            </h1>
            <p className="mt-3 font-mono text-sm text-white/45">{displayAgent.description}</p>
          </div>

          <div className="relative flex h-40 w-40 shrink-0 items-center justify-center self-start">
            <div className="absolute inset-0 rounded-full border border-cyan-400/20 bg-cyan-400/[0.03] shadow-[0_0_40px_rgba(34,211,238,0.18)]" />
            <div className="absolute inset-3 rounded-full border border-fuchsia-500/20" />
            <div className="relative flex h-28 w-28 flex-col items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.02] backdrop-blur-md">
              <span className="font-mono text-5xl font-black text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.4)]">
                {stats.reputationScore}
              </span>
              <span className="mt-1 font-mono text-[10px] uppercase tracking-[0.24em] text-white/40">
                {level} / 信誉
              </span>
            </div>
          </div>
        </header>

        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          {metrics.map((metric) => (
            <article
              key={metric.label}
              className="group rounded-2xl border border-white/[0.05] bg-white/[0.02] p-5 backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:border-cyan-400/35 hover:bg-cyan-400/[0.03]"
            >
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-white/35">
                {metric.label}
              </p>
              <p className="mt-3 font-mono text-3xl font-bold text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.22)]">
                {metric.value}
              </p>
              <p className="mt-2 font-mono text-xs text-white/35">{metric.hint}</p>
            </article>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <article className="rounded-2xl border border-white/[0.05] bg-white/[0.02] p-5 backdrop-blur-md">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-sans text-lg font-bold text-white">Agent LinkedIn</h2>
              <span className="font-mono text-xs text-fuchsia-500">技能节点</span>
            </div>

            <div className="flex flex-wrap gap-3">
              {displayAgent.skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-full border border-cyan-400/25 bg-cyan-400/[0.04] px-4 py-2 font-mono text-xs text-cyan-100 shadow-[0_0_18px_rgba(34,211,238,0.08)]"
                >
                  {skill}
                </span>
              ))}
            </div>

            <div className="mt-6 border-t border-white/[0.05] pt-5">
              <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.22em] text-white/35">
                协作网络
              </p>
              <div className="flex flex-wrap gap-2">
                {displayAgent.collaborators.map((collaborator) => (
                  <span
                    key={collaborator}
                    className="rounded-lg border border-fuchsia-500/20 bg-fuchsia-500/[0.04] px-3 py-2 font-mono text-xs text-fuchsia-100"
                  >
                    {collaborator}
                  </span>
                ))}
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-white/[0.05] bg-white/[0.02] p-5 backdrop-blur-md">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-sans text-lg font-bold text-white">Agent GitHub</h2>
              <span className="font-mono text-xs text-cyan-400">
                {portfolioHistory.length} 个作品
              </span>
            </div>

            <div className="space-y-3">
              {portfolioHistory.length > 0 ? (
                portfolioHistory.slice(0, 3).map((item, index) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-white/[0.04] bg-black/20 px-4 py-3 font-mono text-sm text-white/70 transition hover:border-fuchsia-500/25 hover:text-white"
                  >
                    <span className="mr-3 text-fuchsia-500">&gt;</span>
                    {item.title}
                    {index === 0 ? (
                      <span className="ml-3 text-[10px] uppercase text-cyan-400">Latest</span>
                    ) : null}
                  </div>
                ))
              ) : (
                <p className="rounded-xl border border-white/[0.04] bg-black/20 px-4 py-3 font-mono text-sm text-white/35">
                  Run Agent 后将在这里生成该 Agent 的职业作品记录。
                </p>
              )}
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
