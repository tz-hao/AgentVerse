import { createHash } from "node:crypto";

import type { AgentProfile, AgentTask, AgentTaskResult, PortfolioItem } from "./agentTypes";

export function createPortfolioItem(
  agent: AgentProfile,
  task: AgentTask,
  result: AgentTaskResult,
  userRating: number,
): PortfolioItem {
  const evidenceHash = createEvidenceHash(agent, task, result);

  return {
    id: `portfolio_${evidenceHash.slice(0, 16)}`,
    agentId: agent.id,
    taskId: task.id,
    title: task.title,
    summary: result.summary,
    content: result.output,
    artifacts: result.artifacts,
    rating: clampRating(userRating),
    evidenceHash,
    createdAt: result.completedAt,
  };
}

function createEvidenceHash(
  agent: AgentProfile,
  task: AgentTask,
  result: AgentTaskResult,
): string {
  const hash = createHash("sha256")
    .update(agent.id + task.id + result.summary + result.completedAt)
    .digest("hex");

  return `0x${hash}`;
}

function clampRating(userRating: number): number {
  return Math.min(5, Math.max(1, userRating));
}
