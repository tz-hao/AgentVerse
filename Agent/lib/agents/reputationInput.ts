import type { AgentTaskResult, ReputationInput } from "./agentTypes";

export function buildReputationInput(
  result: AgentTaskResult,
  userRating: number,
  evidenceHash: string,
): ReputationInput {
  const success = result.status === "success";

  return {
    agentId: result.agentId,
    taskId: result.taskId,
    success,
    userRating: clampRating(userRating),
    scoreDelta: success
      ? result.scoreSuggestion + clampRating(userRating)
      : -Math.abs(result.scoreSuggestion),
    evidence: result.summary,
    evidenceHash,
  };
}

function clampRating(userRating: number): number {
  return Math.min(5, Math.max(1, userRating));
}
