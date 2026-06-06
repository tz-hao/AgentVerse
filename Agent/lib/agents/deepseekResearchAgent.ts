import type { AgentProfile, AgentTask, AgentTaskResult } from "./agentTypes";
import { DEEPSEEK_MODEL, getDeepSeekClient } from "./deepseekClient";

type DeepSeekResearchOutput = {
  summary: string;
  output: string;
  artifacts: string[];
  scoreSuggestion: number;
};

export async function runDeepSeekResearchAgent(
  agent: AgentProfile,
  task: AgentTask,
): Promise<AgentTaskResult> {
  try {
    const client = getDeepSeekClient();
    const completion = await client.chat.completions.create({
      model: DEEPSEEK_MODEL,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: buildSystemPrompt(),
        },
        {
          role: "user",
          content: buildUserPrompt(agent, task),
        },
      ],
    });
    const content = completion.choices[0]?.message?.content;

    if (!content) {
      throw new Error("DeepSeek returned empty content");
    }

    const result = toTaskResult(agent, task, parseResearchOutput(content));

    console.log("[AgentVerse] DeepSeek research agent completed");

    return result;
  } catch {
    console.warn("[AgentVerse] DeepSeek unavailable, using fallback");

    return buildFallbackResult(agent, task);
  }
}

function buildSystemPrompt(): string {
  return [
    "AgentVerse = Agent LinkedIn + Agent GitHub + Agent Reputation Protocol.",
    "You are not a generic chatbot. You are a Research Agent with a professional AgentVerse identity.",
    "Your output will enter the Agent Portfolio as an Agent GitHub style work artifact.",
    "Your performance will affect the Agent Reputation Score, so the research must be reliable, structured, and reusable.",
    "Return JSON only. Do not wrap the response in a Markdown code block.",
    'Return this exact JSON shape: {"summary":"one sentence professional achievement summary","output":"complete Markdown research artifact","artifacts":["Hyperliquid Research Brief","Risk Assessment Notes","Onchain Research Summary"],"scoreSuggestion":1}',
    "scoreSuggestion must be a number from 1 to 5.",
    "The output Markdown must include these sections exactly:",
    "# Research Artifact",
    "## Task Overview",
    "## Key Findings",
    "## Web3 Relevance",
    "## Risk Assessment",
    "## Final Recommendation",
    "## Portfolio Value",
    "In Portfolio Value, explain why this result belongs in the Agent's professional portfolio.",
  ].join("\n");
}

function buildUserPrompt(agent: AgentProfile, task: AgentTask): string {
  return [
    "Agent Profile:",
    `- id: ${agent.id}`,
    `- did: ${agent.did}`,
    `- name: ${agent.name}`,
    `- category: ${agent.category}`,
    `- description: ${agent.description}`,
    `- skills: ${agent.skills.join(", ")}`,
    `- serviceTypes: ${agent.serviceTypes.join(", ")}`,
    `- ownerAddress: ${agent.ownerAddress}`,
    `- collaborators: ${agent.collaborators.join(", ") || "none"}`,
    "",
    "Task:",
    `- id: ${task.id}`,
    `- title: ${task.title}`,
    `- description: ${task.description}`,
    `- category: ${task.category}`,
    `- input: ${task.input}`,
    `- rewardAmount: ${task.rewardAmount}`,
    `- status: ${task.status}`,
    `- createdAt: ${task.createdAt}`,
    "",
    "Return JSON exactly matching the requested schema.",
  ].join("\n");
}

function parseResearchOutput(content: string): DeepSeekResearchOutput {
  const parsed: unknown = JSON.parse(content);

  if (!isResearchOutput(parsed)) {
    throw new Error("DeepSeek returned invalid research JSON");
  }

  return {
    ...parsed,
    scoreSuggestion: clampScore(parsed.scoreSuggestion),
  };
}

function isResearchOutput(value: unknown): value is DeepSeekResearchOutput {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.summary === "string" &&
    typeof candidate.output === "string" &&
    Array.isArray(candidate.artifacts) &&
    candidate.artifacts.every((artifact) => typeof artifact === "string") &&
    typeof candidate.scoreSuggestion === "number"
  );
}

function toTaskResult(
  agent: AgentProfile,
  task: AgentTask,
  researchOutput: DeepSeekResearchOutput,
): AgentTaskResult {
  return {
    taskId: task.id,
    agentId: agent.id,
    summary: researchOutput.summary,
    output: researchOutput.output,
    artifacts: researchOutput.artifacts,
    scoreSuggestion: researchOutput.scoreSuggestion,
    status: "success",
    executionMode: "deepseek",
    completedAt: new Date().toISOString(),
  };
}

function buildFallbackResult(agent: AgentProfile, task: AgentTask): AgentTaskResult {
  return {
    taskId: task.id,
    agentId: agent.id,
    summary: `Fallback research result for ${task.title}.`,
    output: [
      "# Research Artifact",
      "",
      "## Task Overview",
      `${agent.name} was assigned to produce a portfolio-ready research artifact for: ${task.title}.`,
      "",
      "## Key Findings",
      `- The requested research target is ${task.input}.`,
      "- This fallback result preserves the AgentVerse demo flow when DeepSeek is unavailable.",
      "- The output is structured so it can still become an Agent GitHub portfolio item.",
      "",
      "## Web3 Relevance",
      `${task.input} should be reviewed through protocol utility, market structure, ecosystem traction, and onchain activity.`,
      "",
      "## Risk Assessment",
      "- DeepSeek was unavailable or returned an invalid response, so this report should be treated as a safe demo artifact.",
      "- A production review should validate claims with fresh market, contract, and ecosystem data.",
      "",
      "## Final Recommendation",
      "Use this fallback as a demo-safe baseline, then rerun with DeepSeek enabled before publishing a final professional report.",
      "",
      "## Portfolio Value",
      "This result can enter the Agent's professional portfolio because it records a completed task, a structured research format, reusable artifacts, and evidence for Reputation Protocol scoring.",
    ].join("\n"),
    artifacts: [
      "Hyperliquid Research Brief",
      "Risk Assessment Notes",
      "Onchain Research Summary",
    ],
    scoreSuggestion: 3,
    status: "success",
    executionMode: "fallback",
    completedAt: new Date().toISOString(),
  };
}

function clampScore(scoreSuggestion: number): number {
  return Math.min(5, Math.max(1, scoreSuggestion));
}
