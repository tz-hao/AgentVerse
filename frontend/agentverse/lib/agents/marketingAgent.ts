import type { AgentProfile, AgentTask, AgentTaskResult } from "./agentTypes";
import { runProfessionalAgent } from "./professionalAgentRunner";

export function runMarketingAgent(agent: AgentProfile, task: AgentTask): Promise<AgentTaskResult> {
  return runProfessionalAgent(agent, task, {
    role: "Web3 Marketing Agent",
    objective: "Create positioning, audience, campaign messaging, channel strategy, and measurable growth actions.",
    reportTitle: "Marketing Artifact",
    sections: ["Campaign Goal", "Target Audience", "Core Messaging", "Channel Strategy", "Portfolio Value"],
    artifactNames: ["Campaign Brief", "Messaging Framework", "Growth Channel Plan"],
    fallbackSummary: "Generated a fallback marketing artifact with messaging and growth channel recommendations.",
  });
}
