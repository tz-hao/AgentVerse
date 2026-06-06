"use client";

import { useEffect, useMemo, useState } from "react";
import { BrowserProvider } from "ethers";
import type { Eip1193Provider } from "ethers";

import CyberBadge from "@/components/cyber/CyberBadge";
import CyberPageShell from "@/components/cyber/CyberPageShell";
import CyberPanel from "@/components/cyber/CyberPanel";
import CyberStatCard from "@/components/cyber/CyberStatCard";
import { useToast } from "@/components/providers/AppProvider";
import {
  AGENT_PROGRESS_EVENT,
  getAgentLevel,
  getAgentStats,
  type AgentStats,
} from "@/lib/agent-mvp/agentProgress";
import { loadLatestAgentRun, type LatestAgentRun } from "@/lib/agent-mvp/latestRun";
import type { AgentCategory, AgentProfile } from "@/lib/agents/agentTypes";
import {
  decodeAgentRegistryError,
  getAgentRegistryAddress,
  getReadOnlyProvider,
  getRegisteredAgent,
  getRegisteredAgents,
  registerAgentOnChain,
  type OnChainAgent,
} from "@/lib/web3/web3-client";

type EthereumWindow = Window & {
  ethereum?: Eip1193Provider;
};

type RegistryStatus =
  | "idle"
  | "checking"
  | "registering"
  | "registered"
  | "not-registered"
  | "already-registered"
  | "failed";

const CURRENT_AGENT_PROFILE_KEY = "agentverse:current-agent-profile";

const categoryOptions: AgentCategory[] = [
  "Research",
  "Audit",
  "Coding",
  "Trading",
  "Marketing",
  "CustomerService",
];

const defaultAgent: AgentProfile = {
  id: "agent_research_gpt_001",
  did: "agent://research-gpt-001",
  name: "ResearchGPT",
  category: "Research",
  description: "Senior Research Agent",
  skills: ["Token Research", "Onchain Analysis", "Risk Assessment"],
  serviceTypes: ["Web3 Research", "Protocol Analysis", "Risk Report"],
  ownerAddress: "",
  collaborators: ["AuditGPT", "RiskGPT", "MarketGPT"],
};

const emptyStats: AgentStats = {
  completedTasks: 0,
  successfulTasks: 0,
  totalRating: 0,
  totalRevenue: 0,
  reputationScore: 0,
};

export default function IdentityPage() {
  const { addToast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [latestRun, setLatestRun] = useState<LatestAgentRun | null>(null);
  const [profile, setProfile] = useState<AgentProfile>(defaultAgent);
  const [stats, setStats] = useState<AgentStats>(emptyStats);
  const [hasMetaMask, setHasMetaMask] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [registryStatus, setRegistryStatus] = useState<RegistryStatus>("idle");
  const [registryError, setRegistryError] = useState<string | null>(null);
  const [registrationTxHash, setRegistrationTxHash] = useState<string | null>(null);
  const [registeredAgent, setRegisteredAgent] = useState<OnChainAgent | null>(null);
  const [registeredAgents, setRegisteredAgents] = useState<OnChainAgent[]>([]);
  const [isLoadingAgents, setIsLoadingAgents] = useState(false);
  const [agentsLoaded, setAgentsLoaded] = useState(false);
  const [agentsError, setAgentsError] = useState<string | null>(null);

  const registryAddress = getAgentRegistryAddress();
  const agentLevel = getAgentLevel(stats.reputationScore);
  const latestTask = latestRun?.task.title ?? "Not started";
  const evidenceHash = latestRun?.portfolioItem.evidenceHash ?? "等待首次 Agent Run";
  const registerDisabled =
    registryStatus === "registering" || registryStatus === "checking" || !hasMetaMask;

  const identityRows = useMemo(
    () => [
      { label: "Agent ID", value: profile.id },
      { label: "Agent DID", value: profile.did },
      { label: "Owner", value: profile.ownerAddress || "未连接钱包" },
      { label: "类型", value: profile.category },
      { label: "最新任务", value: latestTask },
      { label: "Evidence Hash", value: evidenceHash },
      { label: "AgentRegistry Contract", value: registryAddress },
    ],
    [evidenceHash, latestTask, profile, registryAddress],
  );

  useEffect(() => {
    const initialize = () => {
      const run = loadLatestAgentRun();
      const savedProfile = loadCurrentAgentProfile();
      const nextProfile = savedProfile ?? run?.agent ?? defaultAgent;
      const ethereum = (window as EthereumWindow).ethereum;

      setLatestRun(run);
      setProfile(nextProfile);
      setStats(getAgentStats(nextProfile.id));
      setHasMetaMask(Boolean(ethereum));
      setMounted(true);
    };

    const timer = window.setTimeout(initialize, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const updateIdentity = () => {
      const run = loadLatestAgentRun();
      const savedProfile = loadCurrentAgentProfile();
      const nextProfile = savedProfile ?? run?.agent ?? defaultAgent;

      setLatestRun(run);
      setProfile(nextProfile);
      setStats(getAgentStats(nextProfile.id));
    };

    window.addEventListener("storage", updateIdentity);
    window.addEventListener("agentverse:latest-agent-run", updateIdentity);
    window.addEventListener(AGENT_PROGRESS_EVENT, updateIdentity);

    return () => {
      window.removeEventListener("storage", updateIdentity);
      window.removeEventListener("agentverse:latest-agent-run", updateIdentity);
      window.removeEventListener(AGENT_PROGRESS_EVENT, updateIdentity);
    };
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;

    const timer = window.setTimeout(() => {
      setStats(getAgentStats(profile.id));
      saveCurrentAgentProfile(profile);
      setRegisteredAgent(null);
      setRegistryStatus("idle");
      setRegistryError(null);
      setRegistrationTxHash(null);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [mounted, profile]);

  async function handleConnectWallet() {
    try {
      const ethereum = getEthereumProvider();
      const accounts = (await ethereum.request({ method: "eth_requestAccounts" })) as string[];
      const address = accounts[0] ?? "";

      setHasMetaMask(true);
      setWalletAddress(address);
      if (isAddressLike(address)) {
        updateProfileField("ownerAddress", address);
      }
    } catch (error) {
      addToast({
        type: "error",
        title: "钱包连接失败",
        message: getErrorMessage(error),
      });
    }
  }

  async function handleRegisterAgent() {
    const validationError = validateProfile(profile);
    if (validationError) {
      setFormError(validationError);
      setRegistryError(validationError);
      return;
    }

    setRegistryStatus("registering");
    setRegistryError(null);
    setFormError(null);
    setRegistrationTxHash(null);

    try {
      const readProvider = getReadOnlyProvider();
      const existingAgent = await getRegisteredAgent(readProvider, registryAddress, profile.id);

      if (existingAgent.exists) {
        setRegisteredAgent(existingAgent);
        setRegistryStatus("already-registered");
        setRegistryError("Agent already registered on-chain.");
        addToast({
          type: "warning",
          title: "Agent already registered",
          message: "Agent already registered on-chain.",
        });
        return;
      }

      const ethereum = getEthereumProvider();
      await ethereum.request({ method: "eth_requestAccounts" });
      const provider = new BrowserProvider(ethereum);
      const signer = await provider.getSigner();
      const receipt = await registerAgentOnChain(signer, registryAddress, profile);

      setRegistrationTxHash(receipt.txHash);
      const registered = await getRegisteredAgent(readProvider, registryAddress, profile.id);
      setRegisteredAgent(registered.exists ? registered : null);
      setRegistryStatus("registered");
      await refreshRegisteredAgents();
      addToast({
        type: "success",
        title: "Registered on Sepolia",
        message: "AgentRegistry 交易已确认：" + receipt.txHash,
      });
    } catch (error) {
      const decodedError = decodeAgentRegistryError(error);

      if (decodedError === "AgentAlreadyExists" || decodedError === "DuplicateAgent") {
        await refreshRegisteredAgentAfterDuplicate();
        setRegistryStatus("already-registered");
        setRegistryError("Agent already registered on-chain.");
        addToast({
          type: "warning",
          title: "Agent already registered",
          message: "Agent already registered on-chain.",
        });
        return;
      }

      if (decodedError === "EmptyAgentId") {
        setRegistryStatus("failed");
        setRegistryError("Agent ID 不能为空");
        addToast({ type: "error", title: "注册失败", message: "Agent ID 不能为空" });
        return;
      }

      const message = getErrorMessage(error);
      setRegistryStatus("failed");
      setRegistryError(message);
      addToast({ type: "error", title: "注册失败", message });
    }
  }

  async function handleCheckRegistry() {
    const validationError = validateAgentIdOnly(profile);
    if (validationError) {
      setFormError(validationError);
      setRegistryError(validationError);
      return;
    }

    setRegistryStatus("checking");
    setRegistryError(null);
    setFormError(null);

    try {
      const readProvider = getReadOnlyProvider();
      const onChainAgent = await getRegisteredAgent(readProvider, registryAddress, profile.id);
      if (onChainAgent.exists) {
        setRegisteredAgent(onChainAgent);
        setRegistryStatus("registered");
      } else {
        setRegisteredAgent(null);
        setRegistryStatus("not-registered");
      }
    } catch (error) {
      const message = getErrorMessage(error);
      if (/AgentNotFound|not found/i.test(message)) {
        setRegisteredAgent(null);
        setRegistryStatus("not-registered");
        return;
      }
      setRegistryStatus("failed");
      setRegistryError(message);
    }
  }

  async function refreshRegisteredAgentAfterDuplicate() {
    try {
      const readProvider = getReadOnlyProvider();
      const onChainAgent = await getRegisteredAgent(readProvider, registryAddress, profile.id);
      if (onChainAgent.exists) {
        setRegisteredAgent(onChainAgent);
      }
    } catch {
      // Keep duplicate feedback visible even if the follow-up read fails.
    }
  }

  async function refreshRegisteredAgents() {
    const readProvider = getReadOnlyProvider();
    const all = await getRegisteredAgents(readProvider, registryAddress);
    setRegisteredAgents(all);
    setAgentsLoaded(true);
  }

  async function handleLoadRegisteredAgents() {
    setAgentsError(null);
    setIsLoadingAgents(true);
    try {
      await refreshRegisteredAgents();
    } catch (error) {
      setAgentsError(getErrorMessage(error));
    } finally {
      setIsLoadingAgents(false);
    }
  }

  function updateProfileField<K extends keyof AgentProfile>(field: K, value: AgentProfile[K]) {
    setProfile((current) => ({
      ...current,
      [field]: value,
    }));
    setFormError(null);
  }

  return (
    <CyberPageShell
      eyebrow="AgentVerse / 链上身份"
      title="Agent 身份档案"
      subtitle="编辑当前 Agent Profile，并通过 Sepolia AgentRegistry 注册或查询链上身份。"
      actions={
        <>
          {!hasMetaMask ? (
            <button
              onClick={handleConnectWallet}
              className="rounded-2xl border border-yellow-400/30 bg-yellow-400/10 px-4 py-3 font-mono text-sm text-yellow-200 transition hover:-translate-y-0.5 hover:border-yellow-400/60"
            >
              Connect Wallet
            </button>
          ) : null}
          <button
            onClick={handleRegisterAgent}
            disabled={registerDisabled}
            title={!hasMetaMask ? "需要 MetaMask 才能写入链上身份" : "注册 Agent 到 Sepolia"}
            className="rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-3 font-mono text-sm text-cyan-200 transition hover:-translate-y-0.5 hover:border-cyan-400/60 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {registryStatus === "registering" ? "Registering..." : "Register Agent"}
          </button>
          <button
            onClick={handleCheckRegistry}
            disabled={registryStatus === "checking" || registryStatus === "registering"}
            className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 font-mono text-sm text-white/65 transition hover:border-fuchsia-500/35 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {registryStatus === "checking" ? "Checking..." : "Check Registry"}
          </button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <CyberStatCard
          label="信誉分数"
          value={stats.reputationScore}
          hint="当前 Agent 本地 stats"
        />
        <CyberStatCard label="Agent 等级" value={agentLevel} hint="90+ A+ / 80+ A / 70+ B" />
        <CyberStatCard label="完成任务" value={stats.completedTasks} hint="当前 Agent Runs" />
        <CyberStatCard
          label="注册状态"
          value={registryStatusLabel(registryStatus)}
          hint="Sepolia AgentRegistry"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <CyberPanel className="p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl border border-cyan-400/20 bg-cyan-400/[0.06] font-mono text-2xl font-black text-cyan-300 shadow-[0_0_30px_rgba(34,211,238,0.14)]">
              {(profile.name || "AI").slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="font-sans text-3xl font-black text-white">{profile.name || "Unnamed Agent"}</h2>
                <CyberBadge
                  variant={
                    registryStatus === "registered" || registryStatus === "already-registered"
                      ? "success"
                      : "warning"
                  }
                >
                  {registryStatus === "registered" || registryStatus === "already-registered"
                    ? "Sepolia 已验证"
                    : "本地身份"}
                </CyberBadge>
              </div>
              <p className="mt-2 text-sm leading-6 text-white/50">{profile.description}</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3">
            {identityRows.map((row) => (
              <div key={row.label} className="rounded-2xl border border-white/[0.05] bg-black/20 p-4">
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-white/35">
                  {row.label}
                </p>
                <p className="mt-2 break-all font-mono text-sm text-white/75">{row.value}</p>
              </div>
            ))}
          </div>
        </CyberPanel>

        <CyberPanel className="p-6">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.24em] text-cyan-400/70">
                Editable Agent Profile
              </p>
              <h3 className="mt-2 font-sans text-xl font-black text-white">编辑链上身份信息</h3>
            </div>
            <CyberBadge variant={walletAddress ? "success" : "neutral"}>
              {walletAddress ? "Wallet Connected" : "No Wallet"}
            </CyberBadge>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField label="Agent Name" value={profile.name} onChange={(value) => updateProfileField("name", value)} />
            <FormField label="Agent ID" value={profile.id} onChange={(value) => updateProfileField("id", value)} />
            <FormField label="Agent DID" value={profile.did} onChange={(value) => updateProfileField("did", value)} />
            <label>
              <span className="mb-1.5 block font-mono text-xs uppercase tracking-[0.2em] text-white/35">
                Category
              </span>
              <select
                value={profile.category}
                onChange={(event) =>
                  updateProfileField("category", event.target.value as AgentCategory)
                }
                className="w-full rounded-xl border border-white/[0.08] bg-black/30 px-4 py-3 font-mono text-sm text-white outline-none transition focus:border-cyan-400/50"
              >
                {categoryOptions.map((category) => (
                  <option key={category} value={category} className="bg-[#0a0a0f]">
                    {category}
                  </option>
                ))}
              </select>
            </label>
            <label className="md:col-span-2">
              <span className="mb-1.5 block font-mono text-xs uppercase tracking-[0.2em] text-white/35">
                Description
              </span>
              <textarea
                value={profile.description}
                onChange={(event) => updateProfileField("description", event.target.value)}
                rows={3}
                className="w-full resize-none rounded-xl border border-white/[0.08] bg-black/30 px-4 py-3 font-mono text-sm text-white outline-none transition placeholder:text-white/20 focus:border-cyan-400/50"
              />
            </label>
            <FormField
              className="md:col-span-2"
              label="Owner Address"
              value={profile.ownerAddress}
              onChange={(value) => updateProfileField("ownerAddress", value)}
              placeholder="0x..."
            />
          </div>

          {formError ? <p className="mt-4 font-mono text-sm text-red-300">{formError}</p> : null}

          <div className="mt-6 rounded-2xl border border-white/[0.05] bg-black/20 p-4">
            <h3 className="font-sans text-lg font-bold text-white">AgentRegistry 控制台</h3>
            <div className="mt-4 flex flex-wrap gap-2">
              <CyberBadge variant="cyan">Sepolia</CyberBadge>
              <CyberBadge variant={registryStatus === "registered" ? "success" : "neutral"}>
                {registryStatusLabel(registryStatus)}
              </CyberBadge>
              {hasMetaMask ? (
                <CyberBadge variant="success">MetaMask 已检测</CyberBadge>
              ) : (
                <CyberBadge variant="warning">未连接钱包</CyberBadge>
              )}
            </div>

            {registeredAgent ? (
              <div className="mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.04] p-4">
                <p className="font-mono text-sm font-bold text-emerald-200">
                  {registryStatus === "already-registered"
                    ? "Agent already registered on-chain."
                    : "Registered on Sepolia"}
                </p>
                <dl className="mt-3 space-y-2">
                  {[
                    ["agentId", registeredAgent.agentId],
                    ["did", registeredAgent.did],
                    ["name", registeredAgent.name],
                    ["category", registeredAgent.category],
                    ["owner", registeredAgent.owner],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-100/35">
                        {label}
                      </dt>
                      <dd className="mt-1 break-all font-mono text-xs text-emerald-100/70">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ) : null}

            {registrationTxHash ? (
              <div className="mt-5 rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.04] p-4">
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-cyan-400/70">
                  Registration TxHash
                </p>
                <p className="mt-2 break-all font-mono text-xs text-cyan-100">{registrationTxHash}</p>
              </div>
            ) : null}

            {registryError ? (
              <p className="mt-5 break-words font-mono text-xs text-red-300">{registryError}</p>
            ) : null}
          </div>
        </CyberPanel>
      </div>

      <CyberPanel className="mt-6 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-cyan-400/70">
              AgentRegistry / Sepolia
            </p>
            <h2 className="mt-2 font-sans text-2xl font-black text-white">
              链上已注册 Agent
            </h2>
          </div>
          <button
            onClick={handleLoadRegisteredAgents}
            disabled={isLoadingAgents}
            className="rounded-2xl border border-fuchsia-500/30 bg-fuchsia-500/10 px-4 py-3 font-mono text-sm text-fuchsia-200 transition hover:-translate-y-0.5 hover:border-fuchsia-500/60 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoadingAgents ? "Loading..." : "Refresh Agents"}
          </button>
        </div>

        {agentsError ? (
          <p className="mt-5 break-words font-mono text-xs text-red-300">{agentsError}</p>
        ) : null}

        {agentsLoaded && registeredAgents.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-yellow-400/20 bg-yellow-400/[0.04] p-5">
            <p className="font-mono text-sm text-yellow-100">No agents registered on-chain yet.</p>
          </div>
        ) : null}

        {registeredAgents.length > 0 ? (
          <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
            {registeredAgents.map((onChainAgent) => (
              <article
                key={onChainAgent.agentId}
                className="rounded-2xl border border-white/[0.05] bg-black/25 p-5 transition hover:border-cyan-400/30"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="font-sans text-xl font-black text-white">{onChainAgent.name}</h3>
                  <CyberBadge variant="success">{onChainAgent.category}</CyberBadge>
                </div>
                <dl className="mt-5 space-y-3">
                  {[
                    ["agentId", onChainAgent.agentId],
                    ["did", onChainAgent.did],
                    ["owner", onChainAgent.owner],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/35">
                        {label}
                      </dt>
                      <dd className="mt-1 break-all font-mono text-xs text-cyan-100/75">{value}</dd>
                    </div>
                  ))}
                </dl>
              </article>
            ))}
          </div>
        ) : null}

        {!agentsLoaded && !agentsError ? (
          <p className="mt-5 font-mono text-sm text-white/40">
            点击 Refresh Agents 可从链上读取 agentCount()、agentAtIndex(i) 和 getAgent(agentId)。
          </p>
        ) : null}
      </CyberPanel>
    </CyberPageShell>
  );
}

function FormField({
  label,
  value,
  onChange,
  className,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}) {
  return (
    <label className={className}>
      <span className="mb-1.5 block font-mono text-xs uppercase tracking-[0.2em] text-white/35">
        {label}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-white/[0.08] bg-black/30 px-4 py-3 font-mono text-sm text-white outline-none transition placeholder:text-white/20 focus:border-cyan-400/50"
      />
    </label>
  );
}

function getEthereumProvider(): Eip1193Provider {
  const ethereum = (window as EthereumWindow).ethereum;
  if (!ethereum) {
    throw new Error("写入链上身份需要 MetaMask；读取可使用 Sepolia public RPC。");
  }
  return ethereum;
}

function loadCurrentAgentProfile(): AgentProfile | null {
  const raw = window.localStorage.getItem(CURRENT_AGENT_PROFILE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<AgentProfile>;
    if (!parsed.id || !parsed.did || !parsed.name || !parsed.category) {
      return null;
    }

    return normalizeAgentProfile(parsed);
  } catch {
    return null;
  }
}

function saveCurrentAgentProfile(profile: AgentProfile): void {
  window.localStorage.setItem(CURRENT_AGENT_PROFILE_KEY, JSON.stringify(profile));
}

function normalizeAgentProfile(profile: Partial<AgentProfile>): AgentProfile {
  return {
    id: profile.id ?? defaultAgent.id,
    did: profile.did ?? defaultAgent.did,
    name: profile.name ?? defaultAgent.name,
    category: isAgentCategory(profile.category) ? profile.category : defaultAgent.category,
    description: profile.description ?? defaultAgent.description,
    skills: profile.skills?.length ? profile.skills : defaultAgent.skills,
    serviceTypes: profile.serviceTypes?.length ? profile.serviceTypes : defaultAgent.serviceTypes,
    ownerAddress: profile.ownerAddress ?? "",
    collaborators: profile.collaborators?.length ? profile.collaborators : defaultAgent.collaborators,
  };
}

function isAgentCategory(value: unknown): value is AgentCategory {
  return typeof value === "string" && categoryOptions.includes(value as AgentCategory);
}

function validateProfile(profile: AgentProfile): string | null {
  return (
    validateAgentIdOnly(profile) ??
    (!profile.did.trim() ? "DID 不能为空" : null) ??
    (!profile.name.trim() ? "Name 不能为空" : null) ??
    (!profile.category ? "Category 不能为空" : null) ??
    (!isAddressLike(profile.ownerAddress) ? "Owner Address 必须是 0x 地址" : null)
  );
}

function validateAgentIdOnly(profile: AgentProfile): string | null {
  return !profile.id.trim() ? "Agent ID 不能为空" : null;
}

function isAddressLike(value: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(value);
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "AgentRegistry 请求失败。";
}

function registryStatusLabel(status: RegistryStatus): string {
  const labels: Record<RegistryStatus, string> = {
    idle: "未检查",
    checking: "检查中",
    registering: "注册中",
    registered: "已注册",
    "not-registered": "未注册",
    "already-registered": "已注册",
    failed: "失败",
  };
  return labels[status];
}
