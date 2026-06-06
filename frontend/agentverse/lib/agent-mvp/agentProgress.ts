import type {
  AgentExecutionMode,
  AgentTask,
  AgentTaskResult,
  PortfolioItem,
} from "@/lib/agents/agentTypes";

export const AGENT_STATS_MAP_KEY = "agentverse:agent-stats-map";
export const PORTFOLIO_HISTORY_MAP_KEY = "agentverse:portfolio-history-map";
export const AGENT_PROGRESS_EVENT = "agentverse:agent-progress";

const LEGACY_AGENT_STATS_KEY = "agentverse:agent-stats";
const LEGACY_PORTFOLIO_HISTORY_KEY = "agentverse:portfolio-history";

export type AgentStats = {
  completedTasks: number;
  successfulTasks: number;
  totalRating: number;
  totalRevenue: number;
  reputationScore: number;
};

export type AgentStatsMap = Record<string, AgentStats>;

export type PortfolioHistoryItem = PortfolioItem & {
  output: string;
  executionMode: AgentExecutionMode;
};

export type PortfolioHistoryMap = Record<string, PortfolioHistoryItem[]>;

const emptyStats: AgentStats = {
  completedTasks: 0,
  successfulTasks: 0,
  totalRating: 0,
  totalRevenue: 0,
  reputationScore: 0,
};

export function calculateReputationScore(stats: Omit<AgentStats, "reputationScore">): number {
  if (stats.completedTasks <= 0) {
    return 0;
  }

  const successRate = stats.successfulTasks / stats.completedTasks;
  const averageRating = stats.totalRating / stats.completedTasks;
  const taskVolumeScore = Math.min(stats.completedTasks / 10, 1);
  const revenueScore = Math.min(stats.totalRevenue / 1000, 1);

  return clampReputationScore(
    successRate * 40 +
      (averageRating / 5) * 30 +
      taskVolumeScore * 20 +
      revenueScore * 10,
  );
}

export function getAgentStats(agentId: string): AgentStats {
  const statsMap = loadAgentStatsMap();
  return statsMap[agentId] ?? { ...emptyStats };
}

export function loadAgentStats(agentId: string): AgentStats {
  return getAgentStats(agentId);
}

export function getPortfolioHistory(agentId: string): PortfolioHistoryItem[] {
  const historyMap = loadPortfolioHistoryMap();
  return historyMap[agentId] ?? [];
}

export function loadPortfolioHistory(agentId: string): PortfolioHistoryItem[] {
  return getPortfolioHistory(agentId);
}

export function recordAgentRunProgress(
  agentId: string,
  task: AgentTask,
  result: AgentTaskResult,
  portfolioItem: PortfolioItem,
): { stats: AgentStats; portfolioHistory: PortfolioHistoryItem[] } {
  const statsMap = loadAgentStatsMap();
  const currentStats = statsMap[agentId] ?? { ...emptyStats };
  const completedTasks = currentStats.completedTasks + 1;
  const successfulTasks =
    currentStats.successfulTasks + (result.status === "success" ? 1 : 0);
  const totalRating = currentStats.totalRating;
  const totalRevenue = currentStats.totalRevenue + Math.max(task.rewardAmount || 0, 0);
  const stats: AgentStats = {
    completedTasks,
    successfulTasks,
    totalRating,
    totalRevenue,
    reputationScore: calculateReputationScore({
      completedTasks,
      successfulTasks,
      totalRating,
      totalRevenue,
    }),
  };

  const historyItem: PortfolioHistoryItem = {
    ...portfolioItem,
    output: result.output,
    executionMode: result.executionMode,
  };
  const historyMap = loadPortfolioHistoryMap();
  const portfolioHistory = [
    historyItem,
    ...(historyMap[agentId] ?? []).filter((item) => item.id !== historyItem.id),
  ].slice(0, 10);

  statsMap[agentId] = stats;
  historyMap[agentId] = portfolioHistory;

  window.localStorage.setItem(AGENT_STATS_MAP_KEY, JSON.stringify(statsMap));
  window.localStorage.setItem(PORTFOLIO_HISTORY_MAP_KEY, JSON.stringify(historyMap));
  window.dispatchEvent(new Event(AGENT_PROGRESS_EVENT));

  return { stats, portfolioHistory };
}

export function recordAgentReputation(
  agentId: string,
  taskId: string,
  userRating: number,
  scoreDelta: number,
): { stats: AgentStats; portfolioItem: PortfolioHistoryItem | null } {
  void scoreDelta;
  const rating = clampRating(userRating);
  const historyMap = loadPortfolioHistoryMap();
  const history = historyMap[agentId] ?? [];
  const existingItem = history.find((item) => item.taskId === taskId);

  if (!existingItem || existingItem.rating !== null) {
    return { stats: getAgentStats(agentId), portfolioItem: existingItem ?? null };
  }

  const statsMap = loadAgentStatsMap();
  const currentStats = statsMap[agentId] ?? { ...emptyStats };
  const totalRating = currentStats.totalRating + rating;
  const stats: AgentStats = {
    ...currentStats,
    totalRating,
    reputationScore: calculateReputationScore({
      completedTasks: currentStats.completedTasks,
      successfulTasks: currentStats.successfulTasks,
      totalRating,
      totalRevenue: currentStats.totalRevenue,
    }),
  };
  const portfolioItem: PortfolioHistoryItem = {
    ...existingItem,
    rating,
  };
  const updatedHistory = history.map((item) => (item.taskId === taskId ? portfolioItem : item));

  statsMap[agentId] = stats;
  historyMap[agentId] = updatedHistory;

  window.localStorage.setItem(AGENT_STATS_MAP_KEY, JSON.stringify(statsMap));
  window.localStorage.setItem(PORTFOLIO_HISTORY_MAP_KEY, JSON.stringify(historyMap));
  window.dispatchEvent(new Event(AGENT_PROGRESS_EVENT));

  return { stats, portfolioItem };
}

export function getAgentLevel(reputationScore: number): "A+" | "A" | "B" | "C" | "New" {
  if (reputationScore >= 90) return "A+";
  if (reputationScore >= 80) return "A";
  if (reputationScore >= 70) return "B";
  if (reputationScore >= 60) return "C";
  return "New";
}

function loadAgentStatsMap(): AgentStatsMap {
  const raw = window.localStorage.getItem(AGENT_STATS_MAP_KEY);

  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Record<string, Partial<AgentStats>>;
      return Object.fromEntries(
        Object.entries(parsed).map(([agentId, stats]) => [agentId, normalizeStats(stats)]),
      );
    } catch {
      return {};
    }
  }

  return {};
}

function loadPortfolioHistoryMap(): PortfolioHistoryMap {
  const raw = window.localStorage.getItem(PORTFOLIO_HISTORY_MAP_KEY);

  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Record<string, PortfolioHistoryItem[]>;
      return Object.fromEntries(
        Object.entries(parsed).map(([agentId, history]) => [
          agentId,
          Array.isArray(history) ? history.slice(0, 10) : [],
        ]),
      );
    } catch {
      return {};
    }
  }

  return {};
}

function normalizeStats(stats: Partial<AgentStats>): AgentStats {
  const completedTasks = normalizeNumber(stats.completedTasks);
  const successfulTasks = Math.min(normalizeNumber(stats.successfulTasks), completedTasks);
  const totalRating = normalizeNumber(stats.totalRating);
  const totalRevenue = normalizeNumber(stats.totalRevenue);

  return {
    completedTasks,
    successfulTasks,
    totalRating,
    totalRevenue,
    reputationScore: calculateReputationScore({
      completedTasks,
      successfulTasks,
      totalRating,
      totalRevenue,
    }),
  };
}

function clampRating(rating: number): number {
  return Math.min(5, Math.max(1, Number.isFinite(rating) ? rating : 1));
}

function normalizeNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : 0;
}

function clampReputationScore(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0;
  }

  return Math.min(100, Math.max(0, Math.round(value)));
}

export function clearLegacyAgentProgressKeys(): void {
  window.localStorage.removeItem(LEGACY_AGENT_STATS_KEY);
  window.localStorage.removeItem(LEGACY_PORTFOLIO_HISTORY_KEY);
}
