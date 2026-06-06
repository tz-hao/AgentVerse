import type { AgentProfile, AgentTask, AgentTaskResult } from "./agentTypes";
import { runProfessionalAgent } from "./professionalAgentRunner";

export function runCodingAgent(agent: AgentProfile, task: AgentTask): Promise<AgentTaskResult> {
  return runProfessionalAgent(agent, task, {
    role: "Web3 Coding Agent",
    objective: "Design a practical implementation approach, code architecture, interfaces, and verification plan.",
    reportTitle: "Coding Artifact",
    sections: ["Implementation Goal", "Technical Design", "Code Plan", "Verification", "Portfolio Value"],
    artifactNames: ["Implementation Plan", "Technical Design Notes", "Verification Checklist"],
    fallbackSummary: "Generated a fallback coding artifact with implementation and verification guidance.",
  });
}
