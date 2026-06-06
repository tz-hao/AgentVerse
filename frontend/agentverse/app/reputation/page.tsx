"use client";

import { useEffect, useState } from "react";
import { BrowserProvider } from "ethers";
import type { Eip1193Provider } from "ethers";

import CyberBadge from "@/components/cyber/CyberBadge";
import CyberPageShell from "@/components/cyber/CyberPageShell";
import CyberPanel from "@/components/cyber/CyberPanel";
import CyberStatCard from "@/components/cyber/CyberStatCard";
import { useToast } from "@/components/providers/AppProvider";
import {
  AGENT_PROGRESS_EVENT,
  getAgentStats,
  type AgentStats,
} from "@/lib/agent-mvp/agentProgress";
import { loadLatestAgentRun } from "@/lib/agent-mvp/latestRun";
import type { ReputationInput } from "@/lib/agents/agentTypes";
import {
  AGENTVERSE_CHAIN,
  decodeReputationProtocolError,
  getReadOnlyProvider,
  getReputation,
  getReputationProtocolAddress,
  getTaskRecord,
  recordTaskOnChain,
  type OnChainReputation,
} from "@/lib/web3/web3-client";

type ChainRecord = {
  chainStatus: "confirmed";
  txHash: string;
  chain: string;
  contractAddress: string;
  blockNumber: number | null;
};

type BackendSyncStatus = "confirmed" | "pending" | "failed";

type ReputationSnapshot = {
  score: string;
  completedTasks: string;
  successfulTasks: string;
  averageRating: string;
};

type RecordedTaskMap = Record<string, true>;

type EthereumWindow = Window & {
  ethereum?: Eip1193Provider;
};

const RECORDED_TASKS_KEY = "agentverse:on-chain-recorded-tasks";

const emptyStats: AgentStats = {
  completedTasks: 0,
  successfulTasks: 0,
  totalRating: 0,
  totalRevenue: 0,
  reputationScore: 0,
};

export default function ReputationPage() {
  const { addToast } = useToast();
  const [reputationInput, setReputationInput] = useState<ReputationInput | null>(null);
  const [chainRecord, setChainRecord] = useState<ChainRecord | null>(null);
  const [onChainReputation, setOnChainReputation] = useState<ReputationSnapshot | null>(null);
  const [backendSyncStatus, setBackendSyncStatus] = useState<BackendSyncStatus | null>(null);
  const [chainError, setChainError] = useState<string | null>(null);
  const [backendSyncError, setBackendSyncError] = useState<string | null>(null);
  const [isRecordingOnChain, setIsRecordingOnChain] = useState(false);
  const [showRawJson, setShowRawJson] = useState(false);
  const [isFallback, setIsFallback] = useState(false);
  const [localStats, setLocalStats] = useState<AgentStats>(emptyStats);
  const [agentName, setAgentName] = useState("ResearchGPT");
  const [taskAlreadyRecorded, setTaskAlreadyRecorded] = useState(false);

  useEffect(() => {
    const updateReputationInput = () => {
      const run = loadLatestAgentRun();
      const agentId = run?.agent.id ?? "agent_research_gpt_001";
      const input = run?.reputationInput ?? null;
      setReputationInput(input);
      setIsFallback(run?.result?.executionMode === "fallback");
      setLocalStats(getAgentStats(agentId));
      setAgentName(run?.agent.name ?? "ResearchGPT");
      setTaskAlreadyRecorded(input ? isTaskRecordedLocally(input.agentId, input.taskId) : false);
    };

    const timer = window.setTimeout(updateReputationInput, 0);
    window.addEventListener("storage", updateReputationInput);
    window.addEventListener("agentverse:latest-agent-run", updateReputationInput);
    window.addEventListener(AGENT_PROGRESS_EVENT, updateReputationInput);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("storage", updateReputationInput);
      window.removeEventListener("agentverse:latest-agent-run", updateReputationInput);
      window.removeEventListener(AGENT_PROGRESS_EVENT, updateReputationInput);
    };
  }, []);

  async function handleRecordOnChain() {
    if (!reputationInput || isRecordingOnChain || taskAlreadyRecorded) return;

    setIsRecordingOnChain(true);
    setChainError(null);
    setBackendSyncError(null);
    setBackendSyncStatus(null);
    setChainRecord(null);
    setOnChainReputation(null);

    try {
      if (!isValidEvidenceHash(reputationInput.evidenceHash)) {
        throw new Error("证据哈希格式错误");
      }

      const contractAddress = getReputationProtocolAddress();
      if (!contractAddress) {
        throw new Error("尚未配置 ReputationProtocol 合约地址。");
      }

      const readProvider = getReadOnlyProvider();
      const existingRecord = await getTaskRecord(
        readProvider,
        contractAddress,
        reputationInput.agentId,
        reputationInput.taskId,
      );

      if (existingRecord.exists) {
        markTaskRecordedLocally(reputationInput.agentId, reputationInput.taskId);
        setTaskAlreadyRecorded(true);
        setChainError("该任务已经上链，请重新 Run Agent 生成新任务。");
        addToast({
          type: "warning",
          title: "任务已上链",
          message: "该任务已经上链，请重新 Run Agent 生成新任务。",
        });
        return;
      }

      const ethereum = (window as EthereumWindow).ethereum;
      if (!ethereum) {
        throw new Error("需要 MetaMask 才能执行链上记录。");
      }

      await ethereum.request({ method: "eth_requestAccounts" });

      const provider = new BrowserProvider(ethereum);
      const signer = await provider.getSigner();
      const { txHash, blockNumber } = await recordTaskOnChain(
        signer,
        contractAddress,
        reputationInput,
      );
      const reputation = await getReputation(provider, contractAddress, reputationInput.agentId);

      markTaskRecordedLocally(reputationInput.agentId, reputationInput.taskId);
      setTaskAlreadyRecorded(true);
      setChainRecord({
        chainStatus: "confirmed",
        txHash,
        chain: AGENTVERSE_CHAIN,
        contractAddress,
        blockNumber,
      });
      setOnChainReputation(formatOnChainReputation(reputation));
      addToast({ type: "success", title: "链上记录已确认", message: txHash });
      await syncBackendConfirmation(reputationInput, contractAddress, txHash, blockNumber);
    } catch (recordError) {
      const message = getReputationRecordErrorMessage(recordError);
      setChainError(message);
      addToast({ type: "error", title: "链上记录失败", message });
    } finally {
      setIsRecordingOnChain(false);
    }
  }

  async function syncBackendConfirmation(
    confirmedReputationInput: ReputationInput,
    contractAddress: string,
    txHash: string,
    blockNumber: number | null,
  ): Promise<void> {
    try {
      const response = await fetch("/api/reputation/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: confirmedReputationInput.agentId,
          taskId: confirmedReputationInput.taskId,
          contractAddress,
          chain: "sepolia",
          txHash,
          blockNumber,
        }),
      });

      if (response.ok) {
        setBackendSyncStatus("confirmed");
        return;
      }

      if (response.status === 404) {
        setBackendSyncStatus("pending");
        return;
      }

      setBackendSyncStatus("failed");
      setBackendSyncError(`后端同步失败，状态码 ${response.status}。`);
    } catch (syncError) {
      setBackendSyncStatus("failed");
      setBackendSyncError(syncError instanceof Error ? syncError.message : "后端同步失败。");
    }
  }

  const averageLocalRating =
    localStats.completedTasks > 0
      ? (localStats.totalRating / localStats.completedTasks).toFixed(1)
      : "0";
  const recordButtonDisabled = isRecordingOnChain || taskAlreadyRecorded;

  return (
    <CyberPageShell
      eyebrow="AgentVerse / 信誉仪表盘"
      title="Reputation Protocol 控制台"
      subtitle="本地信誉分按当前 Agent 独立计算；链上分数通过 ReputationProtocol.getReputation 单独展示。"
      actions={
        reputationInput ? (
          <div className="flex flex-col items-end gap-2">
            <button
              onClick={handleRecordOnChain}
              disabled={recordButtonDisabled}
              className="rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-5 py-3 font-mono text-sm text-cyan-200 transition hover:-translate-y-0.5 hover:border-cyan-400/60 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isRecordingOnChain
                ? "Recording..."
                : taskAlreadyRecorded
                  ? "Already Recorded"
                  : "Record On-chain"}
            </button>
            {taskAlreadyRecorded ? (
              <p className="max-w-xs text-right font-mono text-[11px] leading-relaxed text-yellow-300/80">
                该任务已经上链，请重新 Run Agent 生成新任务。
              </p>
            ) : null}
            {isFallback ? (
              <p className="max-w-xs text-right font-mono text-[11px] leading-relaxed text-yellow-300/70">
                <i className="fas fa-circle-info mr-1" />
                当前结果来自 fallback，不建议作为正式链上信誉记录。
              </p>
            ) : null}
          </div>
        ) : null
      }
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <CyberStatCard
          label="Local Reputation Score"
          value={localStats.reputationScore}
          hint="当前 Agent 本地分数"
        />
        <CyberStatCard
          label="Local Completed Tasks"
          value={localStats.completedTasks}
          hint={`平均评分 ${averageLocalRating}`}
        />
        <CyberStatCard
          label="On-chain Reputation Score"
          value={onChainReputation?.score ?? "Not recorded on-chain yet"}
          hint="ReputationProtocol.getReputation"
        />
        <CyberStatCard
          label="On-chain Completed Tasks"
          value={onChainReputation?.completedTasks ?? "Not recorded on-chain yet"}
          hint="completedTasks"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <CyberPanel className="p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.28em] text-cyan-400/70">
                ReputationInput
              </p>
              <h2 className="mt-2 font-sans text-2xl font-black text-white">链下证明载荷</h2>
            </div>
            {reputationInput ? (
              <CyberBadge variant={taskAlreadyRecorded ? "success" : "cyan"}>
                {taskAlreadyRecorded ? "已上链" : "已就绪"}
              </CyberBadge>
            ) : (
              <CyberBadge variant="warning">无数据</CyberBadge>
            )}
          </div>

          {reputationInput ? (
            <>
              {isFallback ? (
                <div className="mb-5 rounded-2xl border border-yellow-400/30 bg-yellow-400/[0.05] p-4">
                  <div className="flex items-start gap-3">
                    <i className="fas fa-triangle-exclamation mt-0.5 text-yellow-400" />
                    <p className="font-mono text-sm text-yellow-200/80">
                      当前 reputationInput 来自 fallback 结果。写链前请先确认输出质量。
                    </p>
                  </div>
                </div>
              ) : null}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <InfoCard label="Agent" value={agentName} />
                <InfoCard label="Task ID" value={reputationInput.taskId} mono />
                <InfoCard
                  label="Success"
                  value={reputationInput.success ? "成功" : "失败"}
                  highlight={reputationInput.success ? "success" : "danger"}
                />
                <InfoCard label="用户评分" value={`${reputationInput.userRating} / 5`} />
                <InfoCard
                  label="Score Delta"
                  value={`${reputationInput.scoreDelta > 0 ? "+" : ""}${reputationInput.scoreDelta}`}
                  highlight={reputationInput.scoreDelta > 0 ? "success" : "danger"}
                />
                <InfoCard
                  label="信誉变化"
                  value={reputationInput.scoreDelta > 0 ? "Reputation Increased" : "Reputation Decreased"}
                  highlight={reputationInput.scoreDelta > 0 ? "success" : "danger"}
                />
                <InfoCard label="Evidence Hash" value={reputationInput.evidenceHash} mono truncate />
              </div>

              <div className="mt-4 border-t border-white/[0.05] pt-4">
                <button
                  onClick={() => setShowRawJson(!showRawJson)}
                  className="flex items-center gap-2 font-mono text-xs text-metal-silver/50 transition hover:text-cyan-300"
                >
                  <i className={`fas fa-chevron-${showRawJson ? "down" : "right"} text-[10px]`} />
                  Raw JSON
                </button>
                {showRawJson ? (
                  <pre className="mt-3 max-h-60 overflow-auto rounded-2xl border border-white/[0.05] bg-black/30 p-4 font-mono text-xs leading-6 text-white/65">
                    {JSON.stringify(
                      {
                        agentId: reputationInput.agentId,
                        taskId: reputationInput.taskId,
                        success: reputationInput.success,
                        userRating: reputationInput.userRating,
                        scoreDelta: reputationInput.scoreDelta,
                        evidenceHash: reputationInput.evidenceHash,
                      },
                      null,
                      2,
                    )}
                  </pre>
                ) : null}
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/[0.04] p-5">
              <p className="font-mono text-sm text-yellow-100">
                请先在履历页面运行 Agent，并完成用户评分。
              </p>
            </div>
          )}
        </CyberPanel>

        <div className="space-y-6">
          <CyberPanel className="p-6">
            <h3 className="font-sans text-lg font-bold text-white">链上记录</h3>
            {chainRecord ? (
              <>
                <div className="mb-4 mt-5 rounded-2xl border border-green-400/30 bg-green-400/[0.06] p-5 text-center">
                  <p className="font-orbitron text-lg font-bold text-green-300 drop-shadow-[0_0_12px_rgba(74,222,128,0.4)]">
                    <i className="fas fa-check-circle mr-2" />
                    Sepolia 交易已确认
                  </p>
                  <p className="mt-1 font-mono text-xs text-green-200/60">
                    Block #{chainRecord.blockNumber ?? "pending"}
                  </p>
                </div>
                <div className="space-y-3">
                  <InfoCard label="txHash" value={chainRecord.txHash} mono truncate />
                  <InfoCard label="Chain" value={chainRecord.chain} />
                  <InfoCard label="Contract Address" value={chainRecord.contractAddress} mono truncate />
                  <InfoCard
                    label="Block Number"
                    value={chainRecord.blockNumber?.toString() ?? "pending"}
                  />
                </div>
              </>
            ) : (
              <p className="mt-4 font-mono text-sm text-white/40">
                生成 reputationInput 后，点击 Record On-chain 写入链上。
              </p>
            )}
          </CyberPanel>

          <CyberPanel className="p-6">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-sans text-lg font-bold text-white">后端同步</h3>
              {backendSyncStatus ? (
                <CyberBadge
                  variant={
                    backendSyncStatus === "confirmed"
                      ? "success"
                      : backendSyncStatus === "pending"
                        ? "warning"
                        : "danger"
                  }
                >
                  {backendSyncStatus}
                </CyberBadge>
              ) : (
                <CyberBadge variant="neutral">未开始</CyberBadge>
              )}
            </div>
            {backendSyncError ? (
              <p className="mt-4 font-mono text-xs text-red-300">{backendSyncError}</p>
            ) : (
              <p className="mt-4 font-mono text-xs text-white/40">
                Sepolia TX 确认后，会调用 POST /api/reputation/confirm。
              </p>
            )}
          </CyberPanel>

          {chainError ? (
            <CyberPanel className="border-red-400/20 bg-red-400/[0.04] p-5" hover={false}>
              <p className="font-mono text-sm text-red-300">{chainError}</p>
            </CyberPanel>
          ) : null}
        </div>
      </div>
    </CyberPageShell>
  );
}

function InfoCard({
  label,
  value,
  mono,
  truncate,
  highlight,
}: {
  label: string;
  value: string;
  mono?: boolean;
  truncate?: boolean;
  highlight?: "success" | "danger";
}) {
  return (
    <div className="rounded-2xl border border-white/[0.05] bg-black/25 p-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/35">{label}</p>
      <p
        className={`mt-2 text-sm ${
          highlight === "success"
            ? "text-green-300"
            : highlight === "danger"
              ? "text-red-300"
              : "text-white/75"
        } ${mono ? "font-mono" : ""} ${truncate ? "break-all" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}

function getReputationRecordErrorMessage(error: unknown): string {
  const decodedError = decodeReputationProtocolError(error);

  if (decodedError === "TaskAlreadyRecorded" || decodedError === "DuplicateTask") {
    return "任务已上链";
  }

  if (decodedError === "AgentNotRegistered") {
    return "请先到「链上身份」页面注册当前 Agent";
  }

  if (decodedError === "InvalidEvidenceHash") {
    return "证据哈希格式错误";
  }

  if (decodedError === "InvalidRating") {
    return "评分必须为 1-5";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "链上记录失败。";
}

function isValidEvidenceHash(evidenceHash: string): boolean {
  return /^0x[a-f0-9]{64}$/.test(evidenceHash);
}

function formatOnChainReputation(reputation: OnChainReputation): ReputationSnapshot {
  return {
    score: reputation.score.toString(),
    completedTasks: reputation.completedTasks.toString(),
    successfulTasks: reputation.successfulTasks.toString(),
    averageRating: reputation.averageRating.toString(),
  };
}

function getTaskRecordKey(agentId: string, taskId: string): string {
  return `${agentId}:${taskId}`;
}

function loadRecordedTaskMap(): RecordedTaskMap {
  const raw = window.localStorage.getItem(RECORDED_TASKS_KEY);

  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw) as RecordedTaskMap;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function isTaskRecordedLocally(agentId: string, taskId: string): boolean {
  return Boolean(loadRecordedTaskMap()[getTaskRecordKey(agentId, taskId)]);
}

function markTaskRecordedLocally(agentId: string, taskId: string): void {
  const taskMap = loadRecordedTaskMap();
  taskMap[getTaskRecordKey(agentId, taskId)] = true;
  window.localStorage.setItem(RECORDED_TASKS_KEY, JSON.stringify(taskMap));
}
