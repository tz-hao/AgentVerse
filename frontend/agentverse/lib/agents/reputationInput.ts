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
    scoreDelta: success ? scoreDeltaForRating(clampRating(userRating)) : -10,
    evidence: result.summary,
    evidenceHash,
  };
}

function scoreDeltaForRating(userRating: number): number {
  const scoreDeltas: Record<number, number> = {
    1: -10,
    2: -5,
    3: 1,
    4: 5,
    5: 10,
  };

  return scoreDeltas[userRating];
}

function clampRating(userRating: number): number {
  return Math.min(5, Math.max(1, userRating));
}
