"use client"

import { useMemo, useRef } from "react"
import { useGSAP } from "@gsap/react"
import {
  Background,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps,
  type NodeTypes,
} from "@xyflow/react"
import gsap from "gsap"
import type { LucideIcon } from "lucide-react"
import {
  BotIcon,
  BrainCircuitIcon,
  FileSearchIcon,
  GitBranchIcon,
  HandIcon,
  NetworkIcon,
  RouteIcon,
  ScaleIcon,
  ShieldCheckIcon,
  UserRoundCheckIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import type {
  AgentNodeStatus,
  AgentTraceEvent,
} from "@/lib/claim-guide/types"
import { cn } from "@/lib/utils"

gsap.registerPlugin(useGSAP)

type GraphNodeId = AgentTraceEvent["nodeId"]

type AgentFlowNodeData = {
  label: string
  role: AgentTraceEvent["role"]
  status: AgentNodeStatus
  inputSummary: string
  outputSummary: string
  durationMs: number | null
  icon: LucideIcon
  isActive: boolean
}

type AgentFlowNode = Node<AgentFlowNodeData, "agentFlow">

const graphDefinition: Array<{
  id: GraphNodeId
  label: string
  role: AgentTraceEvent["role"]
  position: { x: number; y: number }
  icon: LucideIcon
}> = [
  {
    id: "case_analyst",
    label: "Case Analyst",
    role: "Agent",
    position: { x: 0, y: 0 },
    icon: BrainCircuitIcon,
  },
  {
    id: "document_tool",
    label: "Document Tool",
    role: "Tool",
    position: { x: 250, y: 0 },
    icon: FileSearchIcon,
  },
  {
    id: "version_resolver",
    label: "Version Resolver",
    role: "Tool",
    position: { x: 500, y: 0 },
    icon: GitBranchIcon,
  },
  {
    id: "coverage_matcher",
    label: "Coverage Matcher",
    role: "Agent",
    position: { x: 750, y: 0 },
    icon: NetworkIcon,
  },
  {
    id: "graph_retriever",
    label: "Domain GraphRAG",
    role: "Tool",
    position: { x: 750, y: 190 },
    icon: RouteIcon,
  },
  {
    id: "information_gate",
    label: "Information Gate",
    role: "Gate",
    position: { x: 500, y: 190 },
    icon: ScaleIcon,
  },
  {
    id: "human_review",
    label: "Human-in-the-loop",
    role: "Human",
    position: { x: 500, y: 380 },
    icon: UserRoundCheckIcon,
  },
  {
    id: "evidence_auditor",
    label: "Evidence Auditor",
    role: "Agent",
    position: { x: 250, y: 190 },
    icon: ShieldCheckIcon,
  },
  {
    id: "action_planner",
    label: "Action Planner",
    role: "Agent",
    position: { x: 0, y: 190 },
    icon: BotIcon,
  },
]

const edgeDefinitions: Array<
  Pick<Edge, "id" | "source" | "target" | "sourceHandle" | "targetHandle">
> = [
  {
    id: "analyst-document",
    source: "case_analyst",
    target: "document_tool",
    sourceHandle: "source-right",
    targetHandle: "target-left",
  },
  {
    id: "document-version",
    source: "document_tool",
    target: "version_resolver",
    sourceHandle: "source-right",
    targetHandle: "target-left",
  },
  {
    id: "version-coverage",
    source: "version_resolver",
    target: "coverage_matcher",
    sourceHandle: "source-right",
    targetHandle: "target-left",
  },
  {
    id: "coverage-graph",
    source: "coverage_matcher",
    target: "graph_retriever",
    sourceHandle: "source-bottom",
    targetHandle: "target-top",
  },
  {
    id: "graph-gate",
    source: "graph_retriever",
    target: "information_gate",
    sourceHandle: "source-left",
    targetHandle: "target-right",
  },
  {
    id: "gate-human",
    source: "information_gate",
    target: "human_review",
    sourceHandle: "source-bottom",
    targetHandle: "target-top",
  },
  {
    id: "gate-auditor",
    source: "information_gate",
    target: "evidence_auditor",
    sourceHandle: "source-left",
    targetHandle: "target-right",
  },
  {
    id: "auditor-action",
    source: "evidence_auditor",
    target: "action_planner",
    sourceHandle: "source-left",
    targetHandle: "target-right",
  },
]

const statusLabels: Record<AgentNodeStatus, string> = {
  pending: "대기",
  completed: "완료",
  waiting: "사람 확인",
  attention: "확인 필요",
  blocked: "안전 중단",
}

const statusBadgeVariants: Record<
  AgentNodeStatus,
  "outline" | "success" | "warning" | "destructive"
> = {
  pending: "outline",
  completed: "success",
  waiting: "warning",
  attention: "warning",
  blocked: "destructive",
}

function AgentFlowCard({ data }: NodeProps<AgentFlowNode>) {
  const Icon = data.icon

  return (
    <>
      <Handle
        id="target-left"
        type="target"
        position={Position.Left}
        className="agent-flow-handle"
      />
      <Handle
        id="target-right"
        type="target"
        position={Position.Right}
        className="agent-flow-handle"
      />
      <Handle
        id="target-top"
        type="target"
        position={Position.Top}
        className="agent-flow-handle"
      />
      <Card
        className={cn(
          "agent-flow-node",
          `is-${data.status}`,
          data.isActive && "is-active",
        )}
        data-agent-pulse
      >
        <CardContent>
          <div className="agent-flow-node-heading">
            <span>
              <Icon aria-hidden="true" />
            </span>
            <div>
              <strong>{data.label}</strong>
              <small>{data.role}</small>
            </div>
            <Badge variant={statusBadgeVariants[data.status]}>
              {statusLabels[data.status]}
            </Badge>
          </div>
          <div className="agent-flow-io">
            <p>
              <span>IN</span>
              {data.inputSummary}
            </p>
            <p>
              <span>OUT</span>
              {data.outputSummary}
            </p>
          </div>
          {data.durationMs ? <time>{data.durationMs}ms</time> : null}
        </CardContent>
      </Card>
      <Handle
        id="source-right"
        type="source"
        position={Position.Right}
        className="agent-flow-handle"
      />
      <Handle
        id="source-left"
        type="source"
        position={Position.Left}
        className="agent-flow-handle"
      />
      <Handle
        id="source-bottom"
        type="source"
        position={Position.Bottom}
        className="agent-flow-handle"
      />
    </>
  )
}

const nodeTypes: NodeTypes = {
  agentFlow: AgentFlowCard,
}

export function AgentFlowGraph({
  trace,
  activeTraceIndex,
}: {
  trace: AgentTraceEvent[]
  activeTraceIndex: number
}) {
  const scopeRef = useRef<HTMLDivElement>(null)
  const activeNodeId = trace[activeTraceIndex]?.nodeId ?? null
  const traceByNode = useMemo(
    () => new Map(trace.map((event) => [event.nodeId, event])),
    [trace],
  )
  const nodes = useMemo<AgentFlowNode[]>(
    () =>
      graphDefinition.map((definition) => {
        const event = traceByNode.get(definition.id)
        return {
          id: definition.id,
          type: "agentFlow",
          position: definition.position,
          draggable: false,
          selectable: true,
          data: {
            label: event?.label ?? definition.label,
            role: event?.role ?? definition.role,
            status: event?.status ?? "pending",
            inputSummary: event?.inputSummary ?? "이전 단계 결과 대기",
            outputSummary: event?.outputSummary ?? "아직 실행되지 않음",
            durationMs: event?.durationMs ?? null,
            icon: definition.icon,
            isActive: definition.id === activeNodeId,
          },
        }
      }),
    [activeNodeId, traceByNode],
  )
  const edges = useMemo<Edge[]>(
    () =>
      edgeDefinitions.map((definition) => {
        const targetEvent = traceByNode.get(
          definition.target as AgentTraceEvent["nodeId"],
        )
        return {
          ...definition,
          type: "smoothstep",
          animated: targetEvent?.nodeId === activeNodeId,
          className: targetEvent ? "is-traversed" : "is-pending",
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 16,
            height: 16,
          },
        }
      }),
    [activeNodeId, traceByNode],
  )

  useGSAP(
    () => {
      if (
        !activeNodeId ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        return
      }

      gsap.fromTo(
        `[data-id="${activeNodeId}"] [data-agent-pulse]`,
        { scale: 0.96, autoAlpha: 0.68 },
        {
          scale: 1,
          autoAlpha: 1,
          duration: 0.42,
          ease: "power2.out",
          clearProps: "transform,opacity,visibility",
        },
      )
    },
    {
      scope: scopeRef,
      dependencies: [activeNodeId],
      revertOnUpdate: true,
    },
  )

  return (
    <section className="agent-flow-shell" ref={scopeRef}>
      <div className="agent-flow-header">
        <div>
          <Badge variant="outline">
            <NetworkIcon data-icon="inline-start" />
            실제 LangGraph 실행
          </Badge>
          <h3>Agent가 지금 어떤 근거를 넘기고 있는지 보세요</h3>
          <p>
            각 노드는 서버가 반환한 실제 입력·출력 trace입니다. 드래그와
            확대·축소로 경로를 살펴볼 수 있습니다.
          </p>
        </div>
        <div className="agent-flow-legend" aria-label="Agent 그래프 범례">
          <Badge variant="success">완료</Badge>
          <Badge variant="warning">사람 확인</Badge>
          <Badge variant="destructive">안전 중단</Badge>
        </div>
      </div>
      <div className="agent-flow-canvas">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.14, maxZoom: 1 }}
          minZoom={0.55}
          maxZoom={1.35}
          nodesDraggable={false}
          nodesConnectable={false}
          panOnScroll
          zoomOnDoubleClick={false}
          aria-label="보험금 확인 Agent 실행 그래프"
        >
          <Background gap={24} size={1} />
        </ReactFlow>
      </div>
      <div className="agent-flow-footnote">
        <HandIcon aria-hidden="true" />
        <span>Agent는 결과를 확정하지 않고 검증된 근거와 다음 행동만 전달합니다.</span>
      </div>
    </section>
  )
}
