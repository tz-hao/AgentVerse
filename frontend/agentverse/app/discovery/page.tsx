"use client";

import { useEffect, useState } from "react";

import CyberBadge from "@/components/cyber/CyberBadge";
import CyberPageShell from "@/components/cyber/CyberPageShell";
import CyberPanel from "@/components/cyber/CyberPanel";
import CyberStatCard from "@/components/cyber/CyberStatCard";
import {
  fallbackDiscoverySnapshot,
  fetchDiscoverySnapshot,
  GRAPHQL_ENDPOINT,
  searchDiscoveryNodes,
  type DiscoveryNode,
  type DiscoverySnapshot,
} from "@/lib/backend/graphql-client";

export default function DiscoveryPage() {
  const [snapshot, setSnapshot] = useState<DiscoverySnapshot>(fallbackDiscoverySnapshot);
  const [visibleNodes, setVisibleNodes] = useState<DiscoveryNode[]>(fallbackDiscoverySnapshot.nodes);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [backendUnavailable, setBackendUnavailable] = useState(false);

  useEffect(() => {
    async function loadDiscovery() {
      try {
        const data = await fetchDiscoverySnapshot();
        setSnapshot(data);
        setVisibleNodes(data.nodes);
        setBackendUnavailable(false);
      } catch {
        setSnapshot(fallbackDiscoverySnapshot);
        setVisibleNodes(fallbackDiscoverySnapshot.nodes);
        setBackendUnavailable(true);
      } finally {
        setIsLoading(false);
      }
    }

    void loadDiscovery();
  }, []);

  async function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = searchQuery.trim();

    if (!query) {
      setVisibleNodes(snapshot.nodes);
      return;
    }

    setIsSearching(true);

    try {
      if (backendUnavailable) {
        setVisibleNodes(filterFallbackNodes(query));
      } else {
        setVisibleNodes(await searchDiscoveryNodes(query));
      }
    } catch {
      setBackendUnavailable(true);
      setSnapshot(fallbackDiscoverySnapshot);
      setVisibleNodes(filterFallbackNodes(query));
    } finally {
      setIsSearching(false);
    }
  }

  function clearSearch() {
    setSearchQuery("");
    setVisibleNodes(snapshot.nodes);
  }

  const nodeName = (nodeId: string) =>
    snapshot.nodes.find((node) => node.id === nodeId)?.displayName ?? nodeId;

  return (
    <CyberPageShell
      eyebrow="AgentVerse / 发现网络"
      title="Agent Discovery Network"
      subtitle="通过 GraphQL 读取 Agent 节点、关系和图谱统计；后端不可用时自动切换到演示数据。"
    >
      {backendUnavailable ? (
        <CyberPanel className="mb-6 p-5" hover={false}>
          <p className="font-mono text-sm text-yellow-200">
            后端不可用，显示演示数据。
          </p>
          <p className="mt-2 break-all font-mono text-xs text-white/35">
            GraphQL Endpoint: {GRAPHQL_ENDPOINT}
          </p>
        </CyberPanel>
      ) : (
        <CyberPanel className="mb-6 p-5" hover={false}>
          <div className="flex flex-wrap items-center gap-3">
            <CyberBadge variant="success">Backend Connected</CyberBadge>
            <p className="break-all font-mono text-xs text-white/40">{GRAPHQL_ENDPOINT}</p>
          </div>
        </CyberPanel>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <CyberStatCard label="节点总数" value={snapshot.graphStats.totalNodes} hint="GraphQL nodes" />
        <CyberStatCard
          label="关系总数"
          value={snapshot.graphStats.totalEdges}
          hint="GraphQL relationships"
        />
        <CyberStatCard label="活跃节点" value={snapshot.graphStats.activeNodes} hint="isActive: true" />
        <CyberStatCard
          label="已验证关系"
          value={snapshot.graphStats.verifiedEdges}
          hint="Verified relationships"
        />
      </div>

      <CyberPanel className="mt-6 p-6">
        <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row">
          <label className="min-w-0 flex-1">
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/35">
              搜索 Agent 节点
            </span>
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="ResearchGPT, AuditGPT, owner, description..."
              className="mt-2 w-full rounded-2xl border border-white/[0.08] bg-black/30 px-4 py-3 font-mono text-sm text-white outline-none transition placeholder:text-white/20 focus:border-cyan-400/40"
            />
          </label>
          <div className="flex items-end gap-3">
            <button
              type="submit"
              disabled={isSearching}
              className="rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-5 py-3 font-mono text-sm text-cyan-200 transition hover:border-cyan-400/60 disabled:opacity-50"
            >
              {isSearching ? "Searching..." : "Search Agent"}
            </button>
            <button
              type="button"
              onClick={clearSearch}
              className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-5 py-3 font-mono text-sm text-white/60 transition hover:border-fuchsia-500/30 hover:text-white"
            >
              Clear
            </button>
          </div>
        </form>
      </CyberPanel>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <CyberPanel className="p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-sans text-xl font-black text-white">发现节点</h2>
            <CyberBadge variant="cyan">{visibleNodes.length} nodes</CyberBadge>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            {visibleNodes.map((node) => (
              <article
                key={node.id}
                className="rounded-2xl border border-white/[0.05] bg-black/25 p-5 transition hover:-translate-y-0.5 hover:border-cyan-400/30"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <h3 className="font-sans text-lg font-black text-white">
                    {node.displayName ?? node.id}
                  </h3>
                  <CyberBadge variant={node.isActive ? "success" : "neutral"}>
                    {node.entityType}
                  </CyberBadge>
                </div>
                <p className="mt-3 min-h-10 text-sm leading-5 text-white/45">
                  {node.description ?? "暂无节点描述。"}
                </p>
                <p className="mt-4 break-all font-mono text-xs text-cyan-100/60">{node.id}</p>
                <p className="mt-2 break-all font-mono text-[10px] text-white/30">
                  Owner: {node.owner}
                </p>
              </article>
            ))}
          </div>

          {!isLoading && visibleNodes.length === 0 ? (
            <p className="mt-5 font-mono text-sm text-yellow-200">
              没有匹配当前搜索条件的 Agent 节点。
            </p>
          ) : null}
        </CyberPanel>

        <CyberPanel className="p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-sans text-xl font-black text-white">关系网络</h2>
            <CyberBadge variant="fuchsia">{snapshot.relationships.length} edges</CyberBadge>
          </div>

          <div className="mt-5 space-y-4">
            {snapshot.relationships.map((relationship) => (
              <article
                key={relationship.id}
                className="rounded-2xl border border-white/[0.05] bg-black/25 p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <CyberBadge variant={relationship.isVerified ? "success" : "warning"}>
                    {relationship.strength}
                  </CyberBadge>
                  <span className="font-mono text-[10px] text-fuchsia-300">
                    {relationship.relationshipType}
                  </span>
                </div>
                <p className="mt-4 break-words font-mono text-xs text-white/60">
                  <span className="text-cyan-300">{nodeName(relationship.sourceNodeId)}</span>
                  <span className="mx-3 text-fuchsia-500">&gt;</span>
                  <span className="text-cyan-300">{nodeName(relationship.targetNodeId)}</span>
                </p>
              </article>
            ))}

            {snapshot.relationships.length === 0 ? (
              <p className="font-mono text-sm text-yellow-200">暂无关系数据。</p>
            ) : null}
          </div>
        </CyberPanel>
      </div>
    </CyberPageShell>
  );
}

function filterFallbackNodes(query: string): DiscoveryNode[] {
  const normalizedQuery = query.toLowerCase();

  return fallbackDiscoverySnapshot.nodes.filter((node) =>
    [node.id, node.owner, node.displayName, node.description, node.entityType]
      .filter((value): value is string => Boolean(value))
      .some((value) => value.toLowerCase().includes(normalizedQuery)),
  );
}
