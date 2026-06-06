import { NextResponse } from "next/server";

import type { AgentTaskResult, ReputationInput } from "@/lib/agents/agentTypes";
import { buildReputationInput } from "@/lib/agents/reputationInput";

type BuildReputationRequest = {
  result: AgentTaskResult;
  userRating: number;
  evidenceHash: string;
};

type BuildReputationResponse = { reputationInput: ReputationInput } | { error: string };

export async function POST(
  request: Request,
): Promise<NextResponse<BuildReputationResponse>> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!isBuildReputationRequest(body)) {
    return NextResponse.json({ error: "Invalid reputation input request" }, { status: 400 });
  }

  return NextResponse.json({
    reputationInput: buildReputationInput(body.result, body.userRating, body.evidenceHash),
  });
}

function isBuildReputationRequest(value: unknown): value is BuildReputationRequest {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    isAgentTaskResult(candidate.result) &&
    typeof candidate.userRating === "number" &&
    Number.isInteger(candidate.userRating) &&
    candidate.userRating >= 1 &&
    candidate.userRating <= 5 &&
    typeof candidate.evidenceHash === "string" &&
    /^0x[a-f0-9]{64}$/.test(candidate.evidenceHash)
  );
}

function isAgentTaskResult(value: unknown): value is AgentTaskResult {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.taskId === "string" &&
    typeof candidate.agentId === "string" &&
    typeof candidate.summary === "string" &&
    typeof candidate.output === "string" &&
    Array.isArray(candidate.artifacts) &&
    typeof candidate.scoreSuggestion === "number" &&
    typeof candidate.status === "string" &&
    typeof candidate.executionMode === "string" &&
    typeof candidate.completedAt === "string"
  );
}
