import { describe, expect, it } from "vitest";

import type { AgentTaskResult } from "../lib/agents/agentTypes";
import { buildReputationInput } from "../lib/agents/reputationInput";

const successResult: AgentTaskResult = {
  taskId: "task_001",
  agentId: "agent_001",
  summary: "Research task completed successfully.",
  output: "# Research Report",
  artifacts: ["Research Report"],
  scoreSuggestion: 4,
  status: "success",
  executionMode: "deepseek",
  completedAt: "2026-06-02T00:00:00.000Z",
};

describe("buildReputationInput", () => {
  it("builds a successful Reputation Protocol input", () => {
    const reputationInput = buildReputationInput(successResult, 5, "hash_001");

    expect(reputationInput).toEqual({
      agentId: "agent_001",
      taskId: "task_001",
      success: true,
      userRating: 5,
      scoreDelta: 9,
      evidence: "Research task completed successfully.",
      evidenceHash: "hash_001",
    });
  });

  it("limits user rating to the 1 to 5 range", () => {
    expect(buildReputationInput(successResult, 0, "hash_001").userRating).toBe(1);
    expect(buildReputationInput(successResult, 9, "hash_001").userRating).toBe(5);
  });

  it("uses a negative score delta for failed task results", () => {
    const failedResult: AgentTaskResult = {
      ...successResult,
      scoreSuggestion: -3,
      status: "failed",
    };

    expect(buildReputationInput(failedResult, 5, "hash_failed")).toEqual({
      agentId: "agent_001",
      taskId: "task_001",
      success: false,
      userRating: 5,
      scoreDelta: -3,
      evidence: "Research task completed successfully.",
      evidenceHash: "hash_failed",
    });
  });
});
