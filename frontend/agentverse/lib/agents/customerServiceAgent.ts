import type { AgentProfile, AgentTask, AgentTaskResult } from "./agentTypes";
import { runProfessionalAgent } from "./professionalAgentRunner";

export function runCustomerServiceAgent(
  agent: AgentProfile,
  task: AgentTask,
): Promise<AgentTaskResult> {
  return runProfessionalAgent(agent, task, {
    role: "Web3 Customer Service Agent",
    objective: "Resolve the user issue clearly, identify escalation risks, and create reusable support guidance.",
    reportTitle: "Customer Service Artifact",
    sections: ["Customer Issue", "Resolution", "Escalation Risks", "Support Guidance", "Portfolio Value"],
    artifactNames: ["Support Resolution", "Escalation Notes", "Customer Guidance"],
    fallbackSummary: "Generated a fallback customer service artifact with resolution and escalation guidance.",
  });
}
