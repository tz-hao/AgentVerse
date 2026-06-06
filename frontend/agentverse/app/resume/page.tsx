"use client";

import { useState } from "react";
import AgentProfileDashboard from "@/components/agent/AgentProfileDashboard";
import CyberPageShell from "@/components/cyber/CyberPageShell";
import CyberPanel from "@/components/cyber/CyberPanel";
import { useToast } from "@/components/providers/AppProvider";
import type {
  AgentCategory,
  AgentProfile,
  AgentTask,
  AgentTaskResult,
  PortfolioItem,
  ReputationInput,
} from "@/lib/agents/agentTypes";
import {
  loadLatestAgentRun,
  saveLatestAgentRun,
  type LatestAgentRun,
} from "@/lib/agent-mvp/latestRun";
import {
  recordAgentReputation,
  recordAgentRunProgress,
} from "@/lib/agent-mvp/agentProgress";

function slug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

type ExecutionStep = {
  label: string;
  status: "pending" | "running" | "success" | "error";
};

type AgentTypeConfig = {
  agent: AgentProfile;
  taskVerb: string;
  defaultPrompt: string;
};

const agentTypeConfigs: Record<AgentCategory, AgentTypeConfig> = {
  Research: {
    agent: {
      id: "agent_research_gpt_001",
      did: "agent://research-gpt-001",
      name: "ResearchGPT",
      category: "Research",
      description: "Senior Research Agent",
      skills: ["Token Research", "Onchain Analysis", "Risk Assessment"],
      serviceTypes: ["Web3 Research", "Protocol Analysis", "Risk Report"],
      ownerAddress: "0xResearchGPT",
      collaborators: ["AuditGPT", "RiskGPT", "MarketGPT"],
    },
    taskVerb: "Research",
    defaultPrompt:
      "Analyze this Web3 project from fundamentals, tokenomics, on-chain activity, risks, and portfolio value.",
  },
  Audit: {
    agent: {
      id: "agent_audit_gpt_001",
      did: "agent://audit-gpt-001",
      name: "AuditGPT",
      category: "Audit",
      description: "Web3 Security Audit Agent",
      skills: ["Smart Contract Audit", "Threat Modeling", "Risk Severity"],
      serviceTypes: ["Security Audit", "Risk Matrix", "Remediation Plan"],
      ownerAddress: "0xAuditGPT",
      collaborators: ["ResearchGPT", "RiskGPT"],
    },
    taskVerb: "Audit",
    defaultPrompt: "Perform a Web3 security audit and risk review.",
  },
  Coding: {
    agent: {
      id: "agent_coding_gpt_001",
      did: "agent://coding-gpt-001",
      name: "CodingGPT",
      category: "Coding",
      description: "Web3 Coding Agent",
      skills: ["TypeScript", "Smart Contracts", "System Design"],
      serviceTypes: ["Implementation Plan", "Code Design", "Verification"],
      ownerAddress: "0xCodingGPT",
      collaborators: ["AuditGPT", "ResearchGPT"],
    },
    taskVerb: "Build",
    defaultPrompt: "Generate technical implementation guidance.",
  },
  Marketing: {
    agent: {
      id: "agent_marketing_gpt_001",
      did: "agent://marketing-gpt-001",
      name: "MarketingGPT",
      category: "Marketing",
      description: "Web3 Marketing Agent",
      skills: ["Positioning", "Campaign Strategy", "Growth Channels"],
      serviceTypes: ["Campaign Brief", "Messaging", "Growth Plan"],
      ownerAddress: "0xMarketingGPT",
      collaborators: ["ResearchGPT", "MarketGPT"],
    },
    taskVerb: "Market",
    defaultPrompt: "Create marketing and growth analysis.",
  },
  CustomerService: {
    agent: {
      id: "agent_customer_service_gpt_001",
      did: "agent://customer-service-gpt-001",
      name: "ServiceGPT",
      category: "CustomerService",
      description: "Web3 Customer Service Agent",
      skills: ["Issue Resolution", "Escalation", "Support Guidance"],
      serviceTypes: ["Support Resolution", "Escalation Notes", "Customer Guidance"],
      ownerAddress: "0xServiceGPT",
      collaborators: ["ResearchGPT", "AuditGPT"],
    },
    taskVerb: "Support",
    defaultPrompt: "Provide user support recommendations.",
  },
  Trading: {
    agent: {
      id: "agent_trading_gpt_001",
      did: "agent://trading-gpt-001",
      name: "TradingGPT",
      category: "Trading",
      description: "Web3 Trading Analysis Agent",
      skills: ["Market Scenarios", "Risk Controls", "Invalidation Analysis"],
      serviceTypes: ["Scenario Brief", "Risk Controls", "Invalidation Checklist"],
      ownerAddress: "0xTradingGPT",
      collaborators: ["MarketGPT", "RiskGPT"],
    },
    taskVerb: "Analyze",
    defaultPrompt: "Generate trading and market insights.",
  },
};

const agentTypeOptions: AgentCategory[] = [
  "Research",
  "Audit",
  "Coding",
  "Marketing",
  "CustomerService",
  "Trading",
];

type AgentRunApiResponse =
  | {
      result: AgentTaskResult;
      portfolioItem: PortfolioItem;
    }
  | {
      error: string;
    };

type ReputationBuildResponse = { reputationInput: ReputationInput } | { error: string };

export default function ResumePage() {
  const { addToast } = useToast();
  const [latestRun, setLatestRun] = useState<LatestAgentRun | null>(() =>
    typeof window === "undefined" ? null : loadLatestAgentRun(),
  );
  const [isRunningAgent, setIsRunningAgent] = useState(false);
  const [agentRunError, setAgentRunError] = useState<string | null>(null);
  const [reputationError, setReputationError] = useState<string | null>(null);
  const [isGeneratingReputation, setIsGeneratingReputation] = useState(false);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);

  const [selectedAgentType, setSelectedAgentType] = useState<AgentCategory>("Research");
  const [projectName, setProjectName] = useState("EigenLayer");
  const [executionSteps, setExecutionSteps] = useState<ExecutionStep[]>(() => {
    if (typeof window === "undefined") return [];
    const run = loadLatestAgentRun();
    return run ? buildSuccessSteps(run) : [];
  });

  const [formErrors, setFormErrors] = useState<{
    projectName?: string;
  }>({});
  const selectedConfig = agentTypeConfigs[selectedAgentType];
  const selectedAgent = selectedConfig.agent;

  function validateForm(): boolean {
    const errors: { projectName?: string } = {};

    if (!projectName.trim()) {
      errors.projectName = "请输入项目名称";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleRunAgent() {
    if (!validateForm()) {
      return;
    }

    const task: AgentTask = {
      id: `task_${slug(projectName)}_${Date.now()}`,
      title: `${selectedConfig.taskVerb} ${projectName}`,
      description: `${selectedAgent.name} 将为 ${projectName} 执行 ${selectedAgentType} 类型任务。`,
      category: selectedAgentType,
      input: `${projectName}. ${selectedConfig.defaultPrompt}`,
      rewardAmount: 25,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    setIsRunningAgent(true);
    setAgentRunError(null);
    setReputationError(null);
    setSelectedRating(null);
    setFormErrors({});

    const steps: ExecutionStep[] = [
      { label: `接收任务：${task.title}`, status: "running" },
      { label: `调用 DeepSeek ${selectedAgentType} Agent`, status: "pending" },
      { label: `生成 ${selectedAgentType} Output`, status: "pending" },
      { label: "生成 PortfolioItem", status: "pending" },
      { label: "保存到 localStorage", status: "pending" },
    ];
    setExecutionSteps(steps);

    try {
      const response = await fetch("/api/agent/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agent: selectedAgent,
          task,
        }),
      });
      const payload = (await response.json()) as AgentRunApiResponse;

      if (!response.ok || "error" in payload) {
        throw new Error("error" in payload ? payload.error : "Agent run failed");
      }

      const savedRun = saveLatestAgentRun({
        agent: selectedAgent,
        task,
        result: payload.result,
        portfolioItem: payload.portfolioItem,
        reputationInput: null,
      });
      recordAgentRunProgress(selectedAgent.id, task, payload.result, payload.portfolioItem);

      setLatestRun(savedRun);

      const isFallback = payload.result.executionMode === "fallback";
      const finalSteps: ExecutionStep[] = [
        { label: `接收任务：${task.title}`, status: "success" },
        {
          label: isFallback
            ? `调用 DeepSeek ${selectedAgentType} Agent（fallback）`
            : `调用 DeepSeek ${selectedAgentType} Agent`,
          status: isFallback ? "error" : "success",
        },
        {
          label: isFallback ? "生成 Fallback Output" : `生成 ${selectedAgentType} Output`,
          status: "success",
        },
        { label: "生成 PortfolioItem", status: "success" },
        { label: "保存到 localStorage", status: "success" },
      ];

      setExecutionSteps(finalSteps);

      addToast({
        type: "success",
        title: "Agent 执行完成",
        message: "请先查看 Agent 输出，再提交用户评分。",
      });
    } catch (runError) {
      const message = runError instanceof Error ? runError.message : "Agent run failed";
      setAgentRunError(message);

      const errorSteps: ExecutionStep[] = steps.map((step, index) => ({
        ...step,
        status: index === 0 ? "success" : "error",
      }));
      setExecutionSteps(errorSteps);

      addToast({ type: "error", title: "Agent 执行失败", message });
    } finally {
      setIsRunningAgent(false);
    }
  }

  async function handleGenerateReputationInput() {
    if (!latestRun || selectedRating === null) {
      setReputationError("请先选择 1-5 分，再生成 ReputationInput。");
      return;
    }

    setIsGeneratingReputation(true);
    setReputationError(null);

    try {
      const response = await fetch("/api/reputation/build-input", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          result: latestRun.result,
          userRating: selectedRating,
          evidenceHash: latestRun.portfolioItem.evidenceHash,
        }),
      });
      const payload = (await response.json()) as ReputationBuildResponse;

      if (!response.ok || "error" in payload) {
        throw new Error("error" in payload ? payload.error : "Failed to build ReputationInput");
      }

      const ratedProgress = recordAgentReputation(
        latestRun.agent.id,
        latestRun.task.id,
        selectedRating,
        payload.reputationInput.scoreDelta,
      );
      const ratedPortfolioItem = ratedProgress.portfolioItem ?? {
        ...latestRun.portfolioItem,
        rating: selectedRating,
      };
      const savedRun = saveLatestAgentRun({
        agent: latestRun.agent,
        task: latestRun.task,
        result: latestRun.result,
        portfolioItem: ratedPortfolioItem,
        reputationInput: payload.reputationInput,
      });

      setLatestRun(savedRun);
      setExecutionSteps((steps) => [
        ...steps.filter((step) => step.label !== "生成 ReputationInput"),
        { label: "生成 ReputationInput", status: "success" },
      ]);
      addToast({
        type: "success",
        title: "ReputationInput 已生成",
        message: `评分 ${selectedRating}/5，scoreDelta ${payload.reputationInput.scoreDelta}。`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to build ReputationInput";
      setReputationError(message);
      addToast({ type: "error", title: "ReputationInput 生成失败", message });
    } finally {
      setIsGeneratingReputation(false);
    }
  }

  return (
    <CyberPageShell
      eyebrow="AgentVerse / 简历仪表盘"
      title="简历仪表盘"
      subtitle="展示 Agent 职业档案、作品信号，并提供 MVP 执行入口。"
    >
      <AgentProfileDashboard agent={selectedAgent} />

      <CyberPanel className="mb-8 p-6">
        <h3 className="mb-5 font-orbitron text-lg font-bold text-white">
          <i className="fas fa-robot mr-2 text-cyan-400" /> Agent MVP 执行区
        </h3>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end">
          <div>
            <label className="mb-1.5 block font-mono text-xs uppercase tracking-[0.2em] text-metal-silver/60">
              Agent Type
            </label>
            <select
              value={selectedAgentType}
              onChange={(event) => {
                const category = event.target.value as AgentCategory;
                setSelectedAgentType(category);
              }}
              disabled={isRunningAgent}
              className="w-full rounded-xl border border-white/[0.08] bg-black/30 px-4 py-3 font-mono text-sm text-white transition focus:border-cyan-400/50 focus:outline-none"
            >
              {agentTypeOptions.map((category) => (
                <option key={category} value={category} className="bg-[#0a0a0f]">
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block font-mono text-xs uppercase tracking-[0.2em] text-metal-silver/60">
              项目名称
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => {
                setProjectName(e.target.value);
                if (formErrors.projectName) setFormErrors((prev) => ({ ...prev, projectName: undefined }));
              }}
              disabled={isRunningAgent}
              placeholder="EigenLayer"
              className={`w-full rounded-xl border bg-black/30 px-4 py-3 font-mono text-sm text-white placeholder:text-white/20 transition focus:outline-none ${
                formErrors.projectName
                  ? "border-red-400/50 focus:border-red-400"
                  : "border-white/[0.08] focus:border-cyan-400/50"
              }`}
            />
            {formErrors.projectName ? (
              <p className="mt-1 font-mono text-xs text-red-400">{formErrors.projectName}</p>
            ) : null}
          </div>

          <div className="flex md:justify-end">
            <button
              onClick={handleRunAgent}
              disabled={isRunningAgent}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-5 py-3 text-sm font-semibold text-cyan-300 transition hover:-translate-y-0.5 hover:border-cyan-400/60 hover:bg-cyan-400/15 disabled:cursor-wait disabled:opacity-50 md:w-auto"
            >
              <i className={`fas ${isRunningAgent ? "fa-spinner fa-spin" : "fa-play"}`} />
              {isRunningAgent ? "Running Agent..." : "Run Agent"}
            </button>
          </div>
        </div>

        <div className="mt-4">
          <p className="font-mono text-xs text-metal-silver/40">
            {selectedAgent.name} / {selectedAgentType} / {selectedConfig.taskVerb}{" "}
            {projectName || "..."}
          </p>
          {latestRun ? (
            <p className="mt-1 font-mono text-[11px] text-metal-silver/30">
              最近运行：{latestRun.result.status} / {latestRun.result.executionMode} / {latestRun.savedAt}
            </p>
          ) : (
            <p className="mt-1 font-mono text-[11px] text-metal-silver/30">
              暂无已保存的 Agent 执行记录。
            </p>
          )}
        </div>

        {agentRunError ? (
          <p className="mt-4 text-sm font-semibold text-red-400">{agentRunError}</p>
        ) : null}
      </CyberPanel>

      {executionSteps.length > 0 ? (
        <CyberPanel className="mb-8 p-6">
          <h3 className="mb-4 font-orbitron text-sm font-bold uppercase tracking-[0.2em] text-cyan-400/70">
            <i className="fas fa-terminal mr-2" />
            执行流程日志
          </h3>
          <div className="space-y-2">
            {executionSteps.map((step, index) => (
              <div
                key={index}
                className="flex items-center gap-3 rounded-xl border border-white/[0.05] bg-black/20 px-4 py-3 font-mono text-sm"
              >
                <span className="w-10 text-center">
                  {step.status === "running" ? (
                    <i className="fas fa-spinner fa-spin text-cyan-400" />
                  ) : step.status === "success" ? (
                    <span className="text-green-400">成功</span>
                  ) : step.status === "error" ? (
                    <span className="text-red-400">错误</span>
                  ) : (
                    <span className="text-white/20">待处理</span>
                  )}
                </span>
                <span
                  className={
                    step.status === "running"
                      ? "text-cyan-300"
                      : step.status === "success"
                        ? "text-green-100/70"
                        : step.status === "error"
                          ? "text-red-300"
                          : "text-white/30"
                  }
                >
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </CyberPanel>
      ) : null}

      {latestRun ? (
        <>
          <div className="mb-8 grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-white/[0.05] bg-black/20 p-4">
              <p className="mb-1 font-mono text-xs text-metal-silver/40">执行结果</p>
              <p className="text-sm font-semibold text-white">{latestRun.result.summary}</p>
            </div>
            <div className="rounded-xl border border-white/[0.05] bg-black/20 p-4">
              <p className="mb-1 font-mono text-xs text-metal-silver/40">PortfolioItem</p>
              <p className="text-sm font-semibold text-white">{latestRun.portfolioItem.title}</p>
            </div>
            <div className="rounded-xl border border-white/[0.05] bg-black/20 p-4">
              <p className="mb-1 font-mono text-xs text-metal-silver/40">ReputationInput</p>
              <p className="break-all font-mono text-sm text-white/70">
                {latestRun.reputationInput
                  ? latestRun.reputationInput.evidenceHash
                  : "等待用户评分后生成"}
              </p>
            </div>
          </div>

          {latestRun.result.executionMode === "fallback" ? (
            <div className="mb-8 rounded-2xl border border-yellow-400/40 bg-yellow-400/[0.06] p-5">
              <div className="flex items-start gap-3">
                <i className="fas fa-triangle-exclamation mt-0.5 text-lg text-yellow-400" />
                <div>
                  <p className="font-orbitron text-sm font-bold text-yellow-300">
                    Fallback 演示结果，DeepSeek 未成功调用。
                  </p>
                  <p className="mt-1 font-mono text-xs leading-relaxed text-yellow-200/60">
                    请检查 DEEPSEEK_API_KEY、账户余额、网络连接或 JSON 输出格式。
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          <div className="mb-3 flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-metal-silver/40">
              执行模式
            </span>
            <span
              className={`rounded-full px-3 py-0.5 font-mono text-[11px] font-semibold ${
                latestRun.result.executionMode === "deepseek"
                  ? "border border-green-400/30 bg-green-400/10 text-green-300"
                  : "border border-yellow-400/30 bg-yellow-400/10 text-yellow-300"
              }`}
            >
              {latestRun.result.executionMode}
            </span>
          </div>

          {latestRun.result.output ? (
            <CyberPanel className="mb-8 p-6">
              <h3 className="mb-4 font-orbitron text-sm font-bold uppercase tracking-[0.2em] text-fuchsia-400/70">
                <i className="fas fa-file-alt mr-2" />
                {latestRun.result.executionMode === "fallback"
                  ? "Fallback Demo Report"
                  : `${latestRun.agent.category} Report`}
              </h3>
              <div className="max-h-[600px] overflow-auto rounded-2xl border border-white/[0.05] bg-black/30 p-5">
                <pre className="whitespace-pre-wrap break-words font-mono text-sm leading-relaxed text-white/75">
                  {latestRun.result.output}
                </pre>
              </div>
            </CyberPanel>
          ) : null}

          <CyberPanel className="mb-8 p-6" hover={false}>
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.24em] text-cyan-400/70">
                  用户评分
                </p>
                <h3 className="mt-2 font-sans text-xl font-black text-white">
                  请根据 Agent 输出质量进行评分
                </h3>
                <p className="mt-2 font-mono text-xs text-white/40">
                  低评分会降低 Reputation Score；确认后才能进入 Record On-chain。
                </p>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => {
                        setSelectedRating(rating);
                        setReputationError(null);
                      }}
                      disabled={Boolean(latestRun.reputationInput)}
                      className={`h-11 w-11 rounded-xl border font-mono text-sm font-bold transition ${
                        selectedRating === rating || latestRun.reputationInput?.userRating === rating
                          ? "border-cyan-400/70 bg-cyan-400/15 text-cyan-200 shadow-[0_0_18px_rgba(34,211,238,0.18)]"
                          : "border-white/[0.08] bg-black/30 text-white/50 hover:border-fuchsia-500/40 hover:text-white"
                      } disabled:cursor-not-allowed disabled:opacity-60`}
                    >
                      {rating}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleGenerateReputationInput}
                  disabled={
                    selectedRating === null ||
                    isGeneratingReputation ||
                    Boolean(latestRun.reputationInput)
                  }
                  className="rounded-xl border border-fuchsia-500/30 bg-fuchsia-500/10 px-5 py-3 font-mono text-sm text-fuchsia-200 transition hover:border-fuchsia-500/60 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {latestRun.reputationInput
                    ? "ReputationInput Generated"
                    : isGeneratingReputation
                      ? "Generating..."
                      : "Generate ReputationInput"}
                </button>
              </div>
            </div>

            {reputationError ? (
              <p className="mt-4 font-mono text-sm text-red-300">{reputationError}</p>
            ) : null}

            {latestRun.reputationInput ? (
              <div className="mt-5 rounded-2xl border border-white/[0.05] bg-black/25 p-4">
                <p
                  className={`font-mono text-sm font-bold ${
                    latestRun.reputationInput.scoreDelta > 0 ? "text-green-300" : "text-red-300"
                  }`}
                >
                  评分 {latestRun.reputationInput.userRating}/5 · Score Delta{" "}
                  {latestRun.reputationInput.scoreDelta > 0 ? "+" : ""}
                  {latestRun.reputationInput.scoreDelta}
                </p>
              </div>
            ) : null}
          </CyberPanel>
        </>
      ) : null}
    </CyberPageShell>
  );
}

function buildSuccessSteps(run: LatestAgentRun): ExecutionStep[] {
  const taskTitle = run.portfolioItem?.title ?? run.result?.summary ?? "Unknown";
  const isFallback = run.result.executionMode === "fallback";
  return [
    { label: `接收任务：${taskTitle}`, status: "success" },
    {
      label: isFallback
        ? `调用 DeepSeek ${run.agent.category} Agent（fallback）`
        : `调用 DeepSeek ${run.agent.category} Agent`,
      status: isFallback ? "error" : "success",
    },
    {
      label: isFallback ? "生成 Fallback Output" : `生成 ${run.agent.category} Output`,
      status: "success",
    },
    { label: "生成 PortfolioItem", status: "success" },
    ...(run.reputationInput
      ? [{ label: "生成 ReputationInput", status: "success" as const }]
      : []),
    { label: "保存到 localStorage", status: "success" },
  ];
}
