"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import ReactFlow, {
  Background,
  Controls,
  MarkerType,
  Position,
  useEdgesState,
  useNodesState,
  type Edge,
  type Node,
} from "reactflow";

import CyberBadge from "@/components/cyber/CyberBadge";
import CyberPageShell from "@/components/cyber/CyberPageShell";
import CyberPanel from "@/components/cyber/CyberPanel";
import CyberStatCard from "@/components/cyber/CyberStatCard";
import { loadLatestAgentRun, type LatestAgentRun } from "@/lib/agent-mvp/latestRun";

type CyberNodeData = {
  label: ReactNode;
};

const collaboratorNames = ["AuditGPT", "RiskGPT", "MarketGPT"];

export default function NetworkPage() {
  const [latestRun, setLatestRun] = useState<LatestAgentRun | null>(null);
  const graph = useMemo(() => buildGraph(latestRun), [latestRun]);
  const [nodes, setNodes, onNodesChange] = useNodesState<CyberNodeData>(graph.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(graph.edges);

  useEffect(() => {
    const updateLatestRun = () => {
      setLatestRun(loadLatestAgentRun());
    };

    updateLatestRun();
    window.addEventListener("storage", updateLatestRun);
    window.addEventListener("agentverse:latest-agent-run", updateLatestRun);

    return () => {
      window.removeEventListener("storage", updateLatestRun);
      window.removeEventListener("agentverse:latest-agent-run", updateLatestRun);
    };
  }, []);

  useEffect(() => {
    setNodes(graph.nodes);
    setEdges(graph.edges);
  }, [graph, setEdges, setNodes]);

  const agentName = latestRun?.agent.name ?? "ResearchGPT";
  const currentTask = latestRun?.task.title ?? "未开始";
  const currentPortfolio = latestRun?.portfolioItem.title ?? "暂无作品";

  return (
    <CyberPageShell
      eyebrow="AgentVerse / 协作网络"
      title="Agent 协作网络"
      subtitle="通过 React Flow 探索 Agent、协作者与最新 Portfolio Artifact 的关系。"
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <CyberStatCard label="核心 Agent" value={agentName} hint="中心节点" />
        <CyberStatCard label="协作者" value={collaboratorNames.length} hint="Audit / Risk / Market" />
        <CyberStatCard label="当前任务" value={currentTask} hint="Latest Task" />
        <CyberStatCard
          label="图谱节点"
          value={graph.nodes.length}
          hint={latestRun ? "Portfolio 节点已激活" : "仅展示 Agent 节点"}
        />
      </div>

      {!latestRun ? (
        <CyberPanel className="mt-6 p-5" hover={false}>
          <p className="font-mono text-sm text-yellow-200">
            请先从简历仪表盘运行 Agent 任务，以激活 Portfolio Artifact 节点。
          </p>
        </CyberPanel>
      ) : (
        <CyberPanel className="mt-6 p-5" hover={false}>
          <div className="flex flex-wrap items-center gap-3">
            <CyberBadge variant="success">最新协作事件</CyberBadge>
            <p className="font-mono text-sm text-white/65">
              {agentName} generated {currentPortfolio}
            </p>
          </div>
          <p className="mt-3 break-all font-mono text-xs text-cyan-200/60">
            Evidence: {latestRun.portfolioItem.evidenceHash}
          </p>
        </CyberPanel>
      )}

      <CyberPanel className="mt-6 overflow-hidden p-0" hover={false}>
        <div className="h-[620px] min-h-[520px] w-full bg-[#07070c]">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            fitView
            fitViewOptions={{ padding: 0.22 }}
            minZoom={0.35}
            maxZoom={1.8}
            nodesDraggable
            nodesConnectable={false}
            panOnDrag
            zoomOnScroll
            proOptions={{ hideAttribution: true }}
          >
            <Background color="rgba(34, 211, 238, 0.16)" gap={26} size={1} />
            <Controls showInteractive={false} />
          </ReactFlow>
        </div>
      </CyberPanel>
    </CyberPageShell>
  );
}

function buildGraph(latestRun: LatestAgentRun | null): {
  nodes: Node<CyberNodeData>[];
  edges: Edge[];
} {
  const agentName = latestRun?.agent.name ?? "ResearchGPT";
  const nodes: Node<CyberNodeData>[] = [
    createAgentNode("research", agentName, "Research Agent / 中心节点", { x: 360, y: 220 }, true),
    createAgentNode("audit", "AuditGPT", "Security Audit", { x: 40, y: 40 }),
    createAgentNode("risk", "RiskGPT", "Risk Assessment", { x: 680, y: 40 }),
    createAgentNode("market", "MarketGPT", "Market Analysis", { x: 40, y: 410 }),
  ];

  const edges: Edge[] = [
    createCyberEdge("research-audit", "research", "audit"),
    createCyberEdge("research-risk", "research", "risk"),
    createCyberEdge("research-market", "research", "market"),
  ];

  if (latestRun) {
    nodes.push(
      createPortfolioNode(latestRun.portfolioItem.title, latestRun.portfolioItem.evidenceHash),
    );
    edges.push(createCyberEdge("research-portfolio", "research", "portfolio", true));
  }

  return { nodes, edges };
}

function createAgentNode(
  id: string,
  name: string,
  role: string,
  position: { x: number; y: number },
  isCenter = false,
): Node<CyberNodeData> {
  return {
    id,
    position,
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
    data: {
      label: (
        <div className="min-w-44 text-left font-mono">
          <p className={`text-base font-black ${isCenter ? "text-cyan-300" : "text-white"}`}>
            {name}
          </p>
          <p className="mt-2 text-[10px] uppercase tracking-[0.18em] text-white/40">{role}</p>
          <p className="mt-3 text-[10px] text-fuchsia-300/70">
            {isCenter ? "CORE_AGENT" : "COLLABORATOR"}
          </p>
        </div>
      ),
    },
    style: {
      background: isCenter ? "rgba(34, 211, 238, 0.08)" : "rgba(255, 255, 255, 0.025)",
      border: `1px solid ${isCenter ? "rgba(34, 211, 238, 0.7)" : "rgba(217, 70, 239, 0.38)"}`,
      borderRadius: 12,
      color: "white",
      padding: 16,
      boxShadow: isCenter
        ? "0 0 34px rgba(34, 211, 238, 0.25)"
        : "0 0 22px rgba(217, 70, 239, 0.12)",
    },
  };
}

function createPortfolioNode(title: string, evidenceHash: string): Node<CyberNodeData> {
  return {
    id: "portfolio",
    position: { x: 680, y: 410 },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
    data: {
      label: (
        <div className="min-w-52 max-w-64 text-left font-mono">
          <p className="text-[10px] uppercase tracking-[0.18em] text-fuchsia-300">
            Portfolio Artifact
          </p>
          <p className="mt-2 text-sm font-black text-cyan-200">{title}</p>
          <p className="mt-3 truncate text-[9px] text-white/35">{evidenceHash}</p>
        </div>
      ),
    },
    style: {
      background: "rgba(217, 70, 239, 0.07)",
      border: "1px solid rgba(34, 211, 238, 0.55)",
      borderRadius: 12,
      color: "white",
      padding: 16,
      boxShadow: "0 0 30px rgba(217, 70, 239, 0.2)",
    },
  };
}

function createCyberEdge(id: string, source: string, target: string, highlight = false): Edge {
  return {
    id,
    source,
    target,
    animated: true,
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: highlight ? "#d946ef" : "#22d3ee",
    },
    style: {
      stroke: highlight ? "#d946ef" : "#22d3ee",
      strokeWidth: highlight ? 2.2 : 1.5,
      filter: `drop-shadow(0 0 5px ${highlight ? "rgba(217,70,239,0.7)" : "rgba(34,211,238,0.55)"})`,
    },
  };
}
