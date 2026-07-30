"use client"

import { useEffect, useMemo, useRef, useState } from "react"
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
  type ReactFlowInstance,
} from "@xyflow/react"
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
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card"
import type {
  AgentNodeStatus,
  AgentTraceEvent,
  Answer,
} from "@/lib/claim-guide/types"
import { cn } from "@/lib/utils"

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
    position: { x: 750, y: 260 },
    icon: RouteIcon,
  },
  {
    id: "information_gate",
    label: "Information Gate",
    role: "Gate",
    position: { x: 500, y: 260 },
    icon: ScaleIcon,
  },
  {
    id: "human_review",
    label: "Human-in-the-loop",
    role: "Human",
    position: { x: 500, y: 520 },
    icon: UserRoundCheckIcon,
  },
  {
    id: "evidence_auditor",
    label: "Evidence Auditor",
    role: "Agent",
    position: { x: 250, y: 260 },
    icon: ShieldCheckIcon,
  },
  {
    id: "action_planner",
    label: "Action Planner",
    role: "Agent",
    position: { x: 0, y: 260 },
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

const answerLabels: Record<Answer, string> = {
  yes: "예",
  no: "아니오",
  unknown: "잘 모르겠어요",
}

function getAnswerLabel(answer: Answer | null) {
  return answer ? answerLabels[answer] : "미확인"
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
        size="sm"
        className={cn(
          "agent-flow-node",
          `is-${data.status}`,
          data.isActive && "is-active",
        )}
        data-agent-pulse
      >
        <CardHeader className="agent-flow-node-heading">
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
        </CardHeader>
        <CardContent className="agent-flow-io">
          <p>
            <span>IN</span>
            {data.inputSummary}
          </p>
          <p>
            <span>OUT</span>
            {data.outputSummary}
          </p>
        </CardContent>
        {data.durationMs ? (
          <CardFooter>
            <time>{data.durationMs}ms</time>
          </CardFooter>
        ) : null}
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
  humanAnswer,
}: {
  trace: AgentTraceEvent[]
  activeTraceIndex: number
  humanAnswer: Answer | null
}) {
  const scopeRef = useRef<HTMLDivElement>(null)
  const [isCompact, setIsCompact] = useState(false)
  const [flowInstance, setFlowInstance] =
    useState<ReactFlowInstance<AgentFlowNode, Edge> | null>(null)
  const activeNodeId = trace[activeTraceIndex]?.nodeId ?? null
  const traceByNode = useMemo(
    () => new Map(trace.map((event) => [event.nodeId, event])),
    [trace],
  )
  const nodes = useMemo<AgentFlowNode[]>(
    () =>
      graphDefinition.map((definition, index) => {
        const event = traceByNode.get(definition.id)
        const isAnsweredHumanStep =
          definition.id === "human_review" && humanAnswer !== null
        return {
          id: definition.id,
          type: "agentFlow",
          position: isCompact
            ? { x: 0, y: index * 270 }
            : definition.position,
          draggable: false,
          selectable: true,
          data: {
            label: event?.label ?? definition.label,
            role: event?.role ?? definition.role,
            status:
              event?.status ??
              (isAnsweredHumanStep ? "completed" : "pending"),
            inputSummary:
              event?.inputSummary ??
              (isAnsweredHumanStep
                ? "사용자가 확인한 추가 정보"
                : "이전 단계 결과 대기"),
            outputSummary:
              event?.outputSummary ??
              (isAnsweredHumanStep
                ? `사용자 답변 반영: ${getAnswerLabel(humanAnswer)}`
                : "아직 실행되지 않음"),
            durationMs: event?.durationMs ?? null,
            icon: definition.icon,
            isActive: definition.id === activeNodeId,
          },
        }
      }),
    [activeNodeId, humanAnswer, isCompact, traceByNode],
  )
  const edges = useMemo<Edge[]>(
    () =>
      edgeDefinitions.map((definition) => {
        const targetEvent = traceByNode.get(
          definition.target as AgentTraceEvent["nodeId"],
        )
        const isHumanAnswerEdge =
          definition.target === "human_review" && humanAnswer !== null
        return {
          ...definition,
          sourceHandle: isCompact
            ? "source-bottom"
            : definition.sourceHandle,
          targetHandle: isCompact ? "target-top" : definition.targetHandle,
          type: "smoothstep",
          animated: targetEvent?.nodeId === activeNodeId,
          className:
            targetEvent || isHumanAnswerEdge ? "is-traversed" : "is-pending",
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 16,
            height: 16,
          },
        }
      }),
    [activeNodeId, humanAnswer, isCompact, traceByNode],
  )

  useEffect(() => {
    const media = window.matchMedia("(max-width: 48rem)")
    const update = () => setIsCompact(media.matches)
    update()
    media.addEventListener("change", update)

    return () => media.removeEventListener("change", update)
  }, [])

  useEffect(() => {
    if (!isCompact || !flowInstance || !activeNodeId) {
      return
    }

    void flowInstance.fitView({
      nodes: [{ id: activeNodeId }],
      padding: 0.45,
      minZoom: 0.9,
      maxZoom: 0.9,
      duration: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? 0
        : 280,
    })
  }, [activeNodeId, flowInstance, isCompact])

  useEffect(() => {
    let cancelled = false
    let cleanup = () => {}

    if (
      !activeNodeId ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return
    }

    void import("gsap").then(({ default: gsap }) => {
      if (cancelled) {
        return
      }

      const context = gsap.context(() => {
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
      }, scopeRef)

      cleanup = () => context.revert()
    })

    return () => {
      cancelled = true
      cleanup()
    }
  }, [activeNodeId])

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
        <div
          className="agent-flow-legend"
          role="group"
          aria-label="Agent 그래프 범례"
        >
          <Badge variant="success">완료</Badge>
          <Badge variant="warning">사람 확인</Badge>
          <Badge variant="destructive">안전 중단</Badge>
        </div>
      </div>
      <div className="agent-flow-canvas">
        <ReactFlow
          key={isCompact ? "compact" : "wide"}
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView={!isCompact}
          fitViewOptions={{ padding: 0.14, maxZoom: 1 }}
          defaultViewport={
            isCompact
              ? {
                  x: 72,
                  y: 24,
                  zoom: 0.9,
                }
              : undefined
          }
          minZoom={isCompact ? 0.7 : 0.55}
          maxZoom={1.35}
          nodesDraggable={false}
          nodesConnectable={false}
          panOnScroll
          zoomOnDoubleClick={false}
          onInit={setFlowInstance}
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
