import type {
  AgentProfile,
  AgentTask,
  AgentTaskResult,
  PortfolioItem,
  ReputationInput,
} from "@/lib/agents/agentTypes";

const LATEST_AGENT_RUN_KEY = "agentverse:latest-agent-run";
const LEGACY_LATEST_AGENT_RUN_KEY = "agentverse.latestAgentRun";

const fallbackAgent: AgentProfile = {
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

export type LatestAgentRun = {
  agent: AgentProfile;
  task: AgentTask;
  result: AgentTaskResult;
  portfolioItem: PortfolioItem;
  reputationInput: ReputationInput | null;
  savedAt: string;
};

export function saveLatestAgentRun(run: Omit<LatestAgentRun, "savedAt">): LatestAgentRun {
  const latestRun = {
    ...run,
    savedAt: new Date().toISOString(),
  };

  const serialized = JSON.stringify(latestRun);
  window.localStorage.setItem(LATEST_AGENT_RUN_KEY, serialized);
  window.localStorage.setItem(LEGACY_LATEST_AGENT_RUN_KEY, serialized);
  window.dispatchEvent(new Event("agentverse:latest-agent-run"));

  return latestRun;
}

export function loadLatestAgentRun(): LatestAgentRun | null {
  const raw =
    window.localStorage.getItem(LATEST_AGENT_RUN_KEY) ??
    window.localStorage.getItem(LEGACY_LATEST_AGENT_RUN_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<LatestAgentRun>;

    if (
      !parsed.result ||
      !parsed.portfolioItem ||
      typeof parsed.savedAt !== "string"
    ) {
      return null;
    }

    const agent = parsed.agent ?? {
      ...fallbackAgent,
      id: parsed.result.agentId || fallbackAgent.id,
    };

    const task = parsed.task ?? {
      id: parsed.result.taskId || parsed.portfolioItem.taskId,
      title: parsed.portfolioItem.title || "Analyze Hyperliquid",
      description: "Research task restored from the latest Agent run.",
      category: agent.category,
      input: parsed.portfolioItem.title || "Hyperliquid",
      rewardAmount: 25,
      status: parsed.result.status,
      createdAt: parsed.savedAt,
    };

    return {
      agent,
      task,
      result: parsed.result,
      portfolioItem: parsed.portfolioItem,
      reputationInput: parsed.reputationInput ?? null,
      savedAt: parsed.savedAt,
    };
  } catch {
    return null;
  }
}
