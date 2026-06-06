import { Contract, Interface, JsonRpcProvider } from "ethers";
import type { Provider, Signer } from "ethers";

import agentRegistryAbi from "@/abis/AgentRegistry.json";
import reputationProtocolAbi from "@/abis/ReputationProtocol.json";
import type { AgentProfile, ReputationInput } from "@/lib/agents/agentTypes";

export const AGENTVERSE_CHAIN = process.env.NEXT_PUBLIC_CHAIN || "sepolia";

const SEPOLIA_RPC =
  process.env.NEXT_PUBLIC_SEPOLIA_RPC || "https://ethereum-sepolia-rpc.publicnode.com";

const DEFAULT_AGENT_REGISTRY_ADDRESS = "0xB7876481BF930fCDE01eae47896F8f49dF4B7351";
const DEFAULT_REPUTATION_PROTOCOL_ADDRESS = "0x8c3e3d4C54CB8009798ebd04ad0811F25f05b2d7";

export const AGENT_REGISTRY_ADDRESS =
  process.env.NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS || DEFAULT_AGENT_REGISTRY_ADDRESS;

export const REPUTATION_PROTOCOL_ADDRESS =
  process.env.NEXT_PUBLIC_REPUTATION_PROTOCOL_ADDRESS || DEFAULT_REPUTATION_PROTOCOL_ADDRESS;

export function getAgentRegistryAddress(): string {
  return AGENT_REGISTRY_ADDRESS;
}

export function getReputationProtocolAddress(): string {
  return REPUTATION_PROTOCOL_ADDRESS;
}

export function getReadOnlyProvider(): JsonRpcProvider {
  return new JsonRpcProvider(SEPOLIA_RPC, "sepolia");
}

const REPUTATION_PROTOCOL_ABI = reputationProtocolAbi;
const REPUTATION_PROTOCOL_INTERFACE = new Interface([
  ...reputationProtocolAbi,
  "error DuplicateTask(string agentId,string taskId)",
  "error InvalidEvidenceHash()",
]);

const AGENT_REGISTRY_ABI = agentRegistryAbi;
const AGENT_REGISTRY_INTERFACE = new Interface(AGENT_REGISTRY_ABI);

export type OnChainReputation = {
  agentId: string;
  score: bigint;
  completedTasks: bigint;
  successfulTasks: bigint;
  averageRating: bigint;
  updatedAt: bigint;
};

export type OnChainTaskRecord = {
  agentId: string;
  taskId: string;
  success: boolean;
  userRating: bigint;
  scoreDelta: bigint;
  evidenceHash: string;
  timestamp: bigint;
  exists: boolean;
};

export type TaskRecordReceipt = {
  txHash: string;
  blockNumber: number | null;
};

export type OnChainAgent = {
  agentId: string;
  did: string;
  name: string;
  category: string;
  owner: string;
  exists: boolean;
};

export async function registerAgentOnChain(
  signer: Signer,
  contractAddress: string,
  agent: AgentProfile,
): Promise<TaskRecordReceipt> {
  const registry = new Contract(contractAddress, AGENT_REGISTRY_ABI, signer);
  const tx = await registry.registerAgent(agent.id, agent.did, agent.name, agent.category);
  const receipt = await tx.wait();

  return {
    txHash: tx.hash,
    blockNumber: receipt?.blockNumber ?? null,
  };
}

export function decodeAgentRegistryError(error: unknown): string | null {
  const revertData = findRevertData(error);

  if (!revertData) {
    return null;
  }

  try {
    return AGENT_REGISTRY_INTERFACE.parseError(revertData)?.name ?? null;
  } catch {
    return null;
  }
}

export function decodeReputationProtocolError(error: unknown): string | null {
  const revertData = findRevertData(error);

  if (!revertData) {
    return null;
  }

  try {
    return REPUTATION_PROTOCOL_INTERFACE.parseError(revertData)?.name ?? null;
  } catch {
    return null;
  }
}

export async function getRegisteredAgent(
  provider: Provider,
  contractAddress: string,
  agentId: string,
): Promise<OnChainAgent> {
  const registry = new Contract(contractAddress, AGENT_REGISTRY_ABI, provider);
  const [id, did, name, category, owner, exists] = await registry.getAgent(agentId);

  return {
    agentId: id,
    did,
    name,
    category,
    owner,
    exists,
  };
}

export async function getRegisteredAgents(
  providerOrRpc: Provider | string,
  registryAddress: string,
): Promise<OnChainAgent[]> {
  const provider =
    typeof providerOrRpc === "string" ? new JsonRpcProvider(providerOrRpc) : providerOrRpc;
  const registry = new Contract(registryAddress, AGENT_REGISTRY_ABI, provider);
  const count = Number(await registry.agentCount());
  const agents: OnChainAgent[] = [];

  for (let index = 0; index < count; index += 1) {
    const agentId = await registry.agentAtIndex(index);
    agents.push(await getRegisteredAgent(provider, registryAddress, agentId));
  }

  return agents.filter((agent) => agent.exists);
}

export async function recordTaskOnChain(
  signer: Signer,
  contractAddress: string,
  input: ReputationInput,
): Promise<TaskRecordReceipt> {
  assertEvidenceHash(input.evidenceHash);
  await assertContractCode(signer, contractAddress);

  const data = REPUTATION_PROTOCOL_INTERFACE.encodeFunctionData("recordTask", [
    input.agentId,
    input.taskId,
    input.success,
    input.userRating,
    input.scoreDelta,
    input.evidenceHash,
  ]);

  if (data === "0x") {
    throw new Error("recordTask calldata is empty. Please check ReputationProtocol ABI.");
  }

  const tx = await signer.sendTransaction({
    to: contractAddress,
    data,
  });

  const receipt = await tx.wait();

  return {
    txHash: tx.hash,
    blockNumber: receipt?.blockNumber ?? null,
  };
}

export async function getTaskRecord(
  provider: Provider,
  contractAddress: string,
  agentId: string,
  taskId: string,
): Promise<OnChainTaskRecord> {
  const protocol = new Contract(contractAddress, REPUTATION_PROTOCOL_ABI, provider);
  let rawRecord: unknown;

  try {
    rawRecord = await protocol.getTaskRecord(agentId, taskId);
  } catch (error) {
    if (isTaskRecordNotFoundError(error)) {
      return emptyTaskRecord(agentId, taskId);
    }
    throw error;
  }

  const [id, recordedTaskId, success, userRating, scoreDelta, evidenceHash, timestamp] =
    rawRecord as [string, string, boolean, bigint, bigint, string, bigint];
  const normalizedTimestamp = BigInt(timestamp);

  return {
    agentId: id,
    taskId: recordedTaskId,
    success,
    userRating: BigInt(userRating),
    scoreDelta: BigInt(scoreDelta),
    evidenceHash,
    timestamp: normalizedTimestamp,
    exists: normalizedTimestamp > BigInt(0) || Boolean(recordedTaskId),
  };
}

function emptyTaskRecord(agentId: string, taskId: string): OnChainTaskRecord {
  return {
    agentId,
    taskId,
    success: false,
    userRating: BigInt(0),
    scoreDelta: BigInt(0),
    evidenceHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
    timestamp: BigInt(0),
    exists: false,
  };
}

export async function getReputation(
  provider: Provider,
  contractAddress: string,
  agentId: string,
): Promise<OnChainReputation> {
  const protocol = new Contract(contractAddress, REPUTATION_PROTOCOL_ABI, provider);
  const [id, score, completedTasks, successfulTasks, averageRating, updatedAt] =
    await protocol.getReputation(agentId);

  return {
    agentId: id,
    score: BigInt(score),
    completedTasks: BigInt(completedTasks),
    successfulTasks: BigInt(successfulTasks),
    averageRating: BigInt(averageRating),
    updatedAt: BigInt(updatedAt),
  };
}

function assertEvidenceHash(evidenceHash: string): void {
  if (!/^0x[a-f0-9]{64}$/.test(evidenceHash)) {
    throw new Error("evidenceHash must match 0x + 64 lowercase hex characters.");
  }
}

async function assertContractCode(signer: Signer, contractAddress: string): Promise<void> {
  const provider = signer.provider;

  if (!provider) {
    return;
  }

  const code = await provider.getCode(contractAddress);

  if (!code || code === "0x") {
    throw new Error(
      `No contract code found at ${contractAddress}. Please check NEXT_PUBLIC_REPUTATION_PROTOCOL_ADDRESS.`,
    );
  }
}

function findRevertData(value: unknown, seen = new Set<object>()): string | null {
  if (typeof value === "string") {
    return /^0x[0-9a-fA-F]{8,}$/.test(value) ? value : null;
  }

  if (!isRecord(value) || seen.has(value)) {
    return null;
  }

  seen.add(value);

  for (const key of ["data", "error", "info", "payload", "cause"]) {
    const found = findRevertData(value[key], seen);
    if (found) {
      return found;
    }
  }

  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isTaskRecordNotFoundError(error: unknown): boolean {
  if (error instanceof Error && /Task record not found/i.test(error.message)) {
    return true;
  }

  if (!isRecord(error)) {
    return false;
  }

  const reason = error.reason;
  if (typeof reason === "string" && /Task record not found/i.test(reason)) {
    return true;
  }

  const revert = error.revert;
  if (isRecord(revert)) {
    const args = revert.args;
    if (
      Array.isArray(args) &&
      args.some((arg) => typeof arg === "string" && /Task record not found/i.test(arg))
    ) {
      return true;
    }
  }

  return ["error", "info", "cause"].some((key) => isTaskRecordNotFoundError(error[key]));
}
