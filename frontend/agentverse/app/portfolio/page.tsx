"use client";

import { useEffect, useState } from "react";

import CyberBadge from "@/components/cyber/CyberBadge";
import CyberPageShell from "@/components/cyber/CyberPageShell";
import CyberPanel from "@/components/cyber/CyberPanel";
import CyberStatCard from "@/components/cyber/CyberStatCard";
import {
  AGENT_PROGRESS_EVENT,
  getPortfolioHistory,
  type PortfolioHistoryItem,
} from "@/lib/agent-mvp/agentProgress";
import { loadLatestAgentRun, type LatestAgentRun } from "@/lib/agent-mvp/latestRun";

const defaultAgentId = "agent_research_gpt_001";
const defaultAgentName = "ResearchGPT";

export default function PortfolioPage() {
  const [latestRun, setLatestRun] = useState<LatestAgentRun | null>(() =>
    typeof window === "undefined" ? null : loadLatestAgentRun(),
  );
  const [portfolioHistory, setPortfolioHistory] = useState<PortfolioHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const updatePortfolio = () => {
      const run = loadLatestAgentRun();
      const agentId = run?.agent.id ?? defaultAgentId;
      const history = getPortfolioHistory(agentId);

      setLatestRun(run);
      setPortfolioHistory(history);
      setLoading(false);
    };

    const timer = window.setTimeout(updatePortfolio, 0);
    window.addEventListener("storage", updatePortfolio);
    window.addEventListener("agentverse:latest-agent-run", updatePortfolio);
    window.addEventListener(AGENT_PROGRESS_EVENT, updatePortfolio);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("storage", updatePortfolio);
      window.removeEventListener("agentverse:latest-agent-run", updatePortfolio);
      window.removeEventListener(AGENT_PROGRESS_EVENT, updatePortfolio);
    };
  }, []);

  const currentAgentName = latestRun?.agent.name ?? defaultAgentName;
  const currentAgentId = latestRun?.agent.id ?? defaultAgentId;
  const averageRating =
    portfolioHistory.some((item) => item.rating !== null)
      ? (
          portfolioHistory.reduce((total, item) => total + (item.rating ?? 0), 0) /
          portfolioHistory.filter((item) => item.rating !== null).length
        ).toFixed(1)
      : "-";

  if (loading) {
    return (
      <CyberPageShell
        eyebrow="AgentVerse / 成果作品"
        title="Agent GitHub"
        subtitle="正在读取当前 Agent 的可验证职业作品历史。"
      >
        <div className="flex items-center justify-center py-20">
          <i className="fas fa-spinner fa-spin text-2xl text-cyan-400" />
        </div>
      </CyberPageShell>
    );
  }

  return (
    <CyberPageShell
      eyebrow="AgentVerse / 成果作品"
      title="Agent GitHub"
      subtitle={`${currentAgentName} 的最近 10 次作品、评分与证据哈希。不同 Agent 的 Portfolio history 已按 agentId 独立保存。`}
    >
      <div className="mb-5 rounded-2xl border border-white/[0.05] bg-black/20 p-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/35">
          Current Agent
        </p>
        <p className="mt-2 break-all font-mono text-sm text-cyan-100">
          {currentAgentName} / {currentAgentId}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <CyberStatCard
          label="已发布作品"
          value={portfolioHistory.length}
          hint="当前 Agent 的 history"
        />
        <CyberStatCard label="平均评分" value={averageRating} hint="Quality signal" />
        <CyberStatCard label="证据模式" value="SHA-256" hint="0x + 64 hex" />
      </div>

      <div className="mt-6 space-y-5">
        {portfolioHistory.length > 0 ? (
          portfolioHistory.map((item, index) => (
            <CyberPanel key={item.id} className="p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    {index === 0 ? <CyberBadge variant="cyan">Latest</CyberBadge> : null}
                    <CyberBadge variant={item.executionMode === "fallback" ? "warning" : "success"}>
                      {item.executionMode}
                    </CyberBadge>
                  </div>
                  <h2 className="mt-3 font-sans text-2xl font-black text-white">{item.title}</h2>
                  <p className="mt-3 max-w-4xl text-sm leading-6 text-white/55">{item.summary}</p>
                </div>
                <div className="shrink-0 text-left sm:text-right">
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/35">
                    评分
                  </p>
                  <p className="mt-1 font-mono text-2xl font-bold text-cyan-400">
                    {item.rating === null ? "未评分" : `${item.rating} / 5`}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {item.artifacts.map((artifact, artifactIndex) => (
                  <CyberBadge
                    key={`${item.id}-${artifact}`}
                    variant={artifactIndex % 2 === 0 ? "cyan" : "fuchsia"}
                  >
                    {artifact}
                  </CyberBadge>
                ))}
              </div>

              <div className="mt-5 rounded-2xl border border-white/[0.05] bg-black/25 p-4">
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-white/35">
                  Evidence Hash
                </p>
                <p className="mt-2 break-all font-mono text-xs text-cyan-100">
                  {item.evidenceHash}
                </p>
              </div>

              <details className="mt-5 rounded-2xl border border-white/[0.05] bg-black/20 p-4">
                <summary className="cursor-pointer font-mono text-sm text-fuchsia-200">
                  查看 result.output
                </summary>
                <pre className="mt-4 max-h-[480px] overflow-auto whitespace-pre-wrap break-words border-t border-white/[0.05] pt-4 font-mono text-xs leading-relaxed text-white/70">
                  {item.output}
                </pre>
              </details>
            </CyberPanel>
          ))
        ) : (
          <CyberPanel className="p-6" hover={false}>
            <p className="font-mono text-sm text-yellow-100">
              请先在简历仪表盘为 {currentAgentName} 点击 Run Agent，发布第一个 portfolio artifact。
            </p>
          </CyberPanel>
        )}
      </div>
    </CyberPageShell>
  );
}
