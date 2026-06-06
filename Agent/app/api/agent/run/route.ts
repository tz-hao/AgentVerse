import { NextResponse } from "next/server";

import type {
  AgentCategory,
  AgentProfile,
  AgentTask,
  AgentTaskResult,
  PortfolioItem,
  ReputationInput,
} from "../../../../lib/agents/agentTypes";
import { createPortfolioItem } from "../../../../lib/agents/portfolio";
import { buildReputationInput } from "../../../../lib/agents/reputationInput";
import { runAgentTask } from "../../../../lib/agents/taskRunner";

type AgentRunRequest = {
  agent: AgentProfile;
  task: AgentTask;
  userRating: number;
};

type AgentRunResponse =
  | {
      result: AgentTaskResult;
      portfolioItem: PortfolioItem;
      reputationInput: ReputationInput;
    }
  | {
      error: string;
    };

const AGENT_CATEGORIES: AgentCategory[] = [
  "Research",
  "Coding",
  "Audit",
  "Trading",
  "Marketing",
  "CustomerService",
];

const TASK_STATUSES = ["pending", "running", "success", "failed"] as const;

export async function POST(request: Request): Promise<NextResponse<AgentRunResponse>> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!isAgentRunRequest(body)) {
    return NextResponse.json({ error: "Invalid agent run request" }, { status: 400 });
  }

  try {
    const result = await runAgentTask(body.agent, body.task);
    const portfolioItem = createPortfolioItem(body.agent, body.task, result, body.userRating);
    const reputationInput = buildReputationInput(
      result,
      body.userRating,
      portfolioItem.evidenceHash,
    );

    return NextResponse.json({
      result,
      portfolioItem,
      reputationInput,
    });
  } catch {
    return NextResponse.json({ error: "Agent run failed" }, { status: 500 });
  }
}

function isAgentRunRequest(value: unknown): value is AgentRunRequest {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    isAgentProfile(candidate.agent) &&
    isAgentTask(candidate.task) &&
    typeof candidate.userRating === "number" &&
    Number.isFinite(candidate.userRating)
  );
}

function isAgentProfile(value: unknown): value is AgentProfile {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    isNonEmptyString(candidate.id) &&
    isNonEmptyString(candidate.did) &&
    isNonEmptyString(candidate.name) &&
    isAgentCategory(candidate.category) &&
    typeof candidate.description === "string" &&
    isStringArray(candidate.skills) &&
    isStringArray(candidate.serviceTypes) &&
    isNonEmptyString(candidate.ownerAddress) &&
    isStringArray(candidate.collaborators)
  );
}

function isAgentTask(value: unknown): value is AgentTask {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    isNonEmptyString(candidate.id) &&
    isNonEmptyString(candidate.title) &&
    typeof candidate.description === "string" &&
    isAgentCategory(candidate.category) &&
    isNonEmptyString(candidate.input) &&
    typeof candidate.rewardAmount === "number" &&
    Number.isFinite(candidate.rewardAmount) &&
    TASK_STATUSES.some((status) => status === candidate.status) &&
    isNonEmptyString(candidate.createdAt)
  );
}

function isAgentCategory(value: unknown): value is AgentCategory {
  return typeof value === "string" && AGENT_CATEGORIES.some((category) => category === value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}
