/**
 * AgentVerse Web3 Integration Helpers
 *
 * Minimal V1 — just two flows:
 *   1. registerAgent(...)  → txHash
 *   2. recordTask(...)     → txHash
 *
 * Usage (browser with ethers v6 + wallet):
 *
 *   import { recordTaskOnChain } from './web3-client';
 *   const txHash = await recordTaskOnChain(signer, reputationInput, contractAddr);
 */

import { ethers } from "ethers";
import type { Signer } from "ethers";

// ── Types (mirrors ReputationInput from Agent module) ────────────────────

export interface ReputationInput {
  agentId: string;
  taskId: string;
  success: boolean;
  userRating: number; // 1-5
  scoreDelta: number;
  evidence: string; // full text — NOT sent on-chain
  evidenceHash: string; // "0x…" 66-char hex — SENT on-chain
}

// ── ABI fragments (minimal — only what the frontend calls) ───────────────

const AGENT_REGISTRY_ABI = [
  "function registerAgent(string,string,string,string) external",
  "function getAgent(string) view returns (string,string,string,string,address,bool)",
] as const;

const REPUTATION_PROTOCOL_ABI = [
  "function recordTask(string,string,bool,uint8,int256,string) external",
  "function getReputation(string) view returns (string,int256,uint256,uint256,uint256,uint256)",
  "function getTaskRecord(string,string) view returns (string,string,bool,uint8,int256,bytes32,uint256)",
] as const;

// ── Helpers ──────────────────────────────────────────────────────────────

function assertRating(rating: number): void {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error(`userRating must be 1-5, got ${rating}`);
  }
}

function assertEvidenceHash(hash: string): void {
  // Accept both "0x + 64 hex" and bare 64 hex — always send 0x-prefixed
  if (!/^(0x)?[0-9a-fA-F]{64}$/.test(hash)) {
    throw new Error(`evidenceHash must be 64 hex chars (optional 0x prefix), got: ${hash}`);
  }
}

function normalizeEvidenceHash(hash: string): string {
  assertEvidenceHash(hash);
  return hash.startsWith("0x") ? hash : "0x" + hash;
}

// ── Public API ───────────────────────────────────────────────────────────

/**
 * Register a new agent on Ethereum Sepolia.
 *
 * @returns txHash (0x…)
 */
export async function registerAgentOnChain(
  signer: Signer,
  contractAddress: string,
  params: {
    agentId: string;
    did: string;
    name: string;
    category: string;
  }
): Promise<string> {
  const registry = new ethers.Contract(contractAddress, AGENT_REGISTRY_ABI, signer);
  const tx = await registry.registerAgent(
    params.agentId,
    params.did,
    params.name,
    params.category
  );
  const receipt = await tx.wait();
  return receipt.hash;
}

/**
 * Record a task outcome on-chain using the ReputationInput from Agent module.
 *
 * This is THE main integration point — the frontend takes the Agent module's
 * `reputationInput` object and passes it here.
 *
 * @returns txHash (0x…)
 */
export async function recordTaskOnChain(
  signer: Signer,
  contractAddress: string,
  input: ReputationInput
): Promise<string> {
  assertRating(input.userRating);
  assertEvidenceHash(input.evidenceHash);

  const protocol = new ethers.Contract(contractAddress, REPUTATION_PROTOCOL_ABI, signer);
  const tx = await protocol.recordTask(
    input.agentId,
    input.taskId,
    input.success,
    input.userRating,
    input.scoreDelta,
    normalizeEvidenceHash(input.evidenceHash)
  );
  const receipt = await tx.wait();
  return receipt.hash;
}

/**
 * Read an agent's current reputation from the chain.
 */
export async function getReputation(
  provider: ethers.Provider,
  contractAddress: string,
  agentId: string
): Promise<{
  agentId: string;
  score: bigint;
  completedTasks: bigint;
  successfulTasks: bigint;
  averageRating: bigint;
  updatedAt: bigint;
}> {
  const protocol = new ethers.Contract(contractAddress, REPUTATION_PROTOCOL_ABI, provider);
  const [id, score, completed, successful, avgRating, updatedAt] =
    await protocol.getReputation(agentId);
  return {
    agentId: id,
    score: BigInt(score),
    completedTasks: BigInt(completed),
    successfulTasks: BigInt(successful),
    averageRating: BigInt(avgRating),
    updatedAt: BigInt(updatedAt),
  };
}

/**
 * Read a specific task record from the chain.
 */
export async function getTaskRecord(
  provider: ethers.Provider,
  contractAddress: string,
  agentId: string,
  taskId: string
): Promise<{
  agentId: string;
  taskId: string;
  success: boolean;
  userRating: number;
  scoreDelta: bigint;
  evidenceHash: string;
  timestamp: bigint;
}> {
  const protocol = new ethers.Contract(contractAddress, REPUTATION_PROTOCOL_ABI, provider);
  const [aId, tId, success, rating, delta, hash, ts] =
    await protocol.getTaskRecord(agentId, taskId);
  return {
    agentId: aId,
    taskId: tId,
    success,
    userRating: Number(rating),
    scoreDelta: BigInt(delta),
    evidenceHash: hash,
    timestamp: BigInt(ts),
  };
}
