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
  SparklesIcon,
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
  isSelected: boolean
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
    id: "ai_case_interpreter",
    label: "AI 문서 이해",
    role: "Tool",
    position: { x: 225, y: -215 },
    icon: SparklesIcon,
  },
  {
    id: "case_analyst",
    label: "사건 분석",
    role: "Agent",
    position: { x: 0, y: 0 },
    icon: BrainCircuitIcon,
  },
  {
    id: "document_tool",
    label: "문서 판독",
    role: "Tool",
    position: { x: 225, y: 0 },
    icon: FileSearchIcon,
  },
  {
    id: "version_resolver",
    label: "보험약관 버전 확인",
    role: "Tool",
    position: { x: 450, y: 0 },
    icon: GitBranchIcon,
  },
  {
    id: "coverage_matcher",
    label: "보장 항목 대조",
    role: "Agent",
    position: { x: 675, y: 0 },
    icon: NetworkIcon,
  },
  {
    id: "graph_retriever",
    label: "근거 그래프 검색",
    role: "Tool",
    position: { x: 675, y: 215 },
    icon: RouteIcon,
  },
  {
    id: "information_gate",
    label: "정보 충분성 판단",
    role: "Gate",
    position: { x: 450, y: 215 },
    icon: ScaleIcon,
  },
  {
    id: "human_review",
    label: "사람 확인",
    role: "Human",
    position: { x: 450, y: 430 },
    icon: UserRoundCheckIcon,
  },
  {
    id: "evidence_auditor",
    label: "근거 감사",
    role: "Agent",
    position: { x: 225, y: 215 },
    icon: ShieldCheckIcon,
  },
  {
    id: "action_planner",
    label: "다음 행동 정리",
    role: "Agent",
    position: { x: 0, y: 215 },
    icon: BotIcon,
  },
]

const edgeDefinitions: Array<
  Pick<Edge, "id" | "source" | "target" | "sourceHandle" | "targetHandle">
> = [
  {
    id: "ai-document",
    source: "ai_case_interpreter",
    target: "document_tool",
    sourceHandle: "source-bottom",
    targetHandle: "target-top",
  },
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

const roleLabels: Record<AgentTraceEvent["role"], string> = {
  Agent: "Agent",
  Tool: "도구",
  Gate: "판단 기준",
  Human: "사람",
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
          data.isSelected && "is-selected",
        )}
        data-agent-pulse
      >
        <CardHeader className="agent-flow-node-heading">
          <span>
            <Icon aria-hidden="true" />
          </span>
          <div>
            <strong>{data.label}</strong>
            <small>{roleLabels[data.role]}</small>
          </div>
          <Badge variant={statusBadgeVariants[data.status]}>
            {statusLabels[data.status]}
          </Badge>
        </CardHeader>
        <CardContent className="agent-flow-io">
          <p>
            <span>결과</span>
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
  const [manualSelectedNodeId, setManualSelectedNodeId] = useState<GraphNodeId | null>(
    null,
  )
  const activeNodeId = trace[activeTraceIndex]?.nodeId ?? null
  const selectedNodeId = manualSelectedNodeId ?? activeNodeId
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
            ? { x: 0, y: index * 220 }
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
              (definition.id === "ai_case_interpreter"
                ? "사용자 동의 후 마스킹된 문서 미리보기"
                : isAnsweredHumanStep
                ? "사용자가 확인한 추가 정보"
                : "이전 단계 결과 대기"),
            outputSummary:
              event?.outputSummary ??
              (definition.id === "ai_case_interpreter"
                ? "선택 기능: 누락 사실 후보만 보조"
                : isAnsweredHumanStep
                ? `사용자 답변 반영: ${getAnswerLabel(humanAnswer)}`
                : "아직 실행되지 않음"),
            durationMs: event?.durationMs ?? null,
            icon: definition.icon,
            isActive: definition.id === activeNodeId,
            isSelected: definition.id === (selectedNodeId ?? activeNodeId),
          },
        }
      }),
    [activeNodeId, humanAnswer, isCompact, selectedNodeId, traceByNode],
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

  const inspectedNode = nodes.find(
    (node) => node.id === (selectedNodeId ?? activeNodeId),
  )

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
          <span className="agent-flow-kicker">
            <NetworkIcon data-icon="inline-start" />
            Agent 실행 캔버스
          </span>
          <h3>근거가 이동한 경로를 캔버스에서 확인하세요</h3>
          <p>
            LangFlow처럼 노드를 따라 읽되, 화면은 실제 LangGraph trace만 활성화합니다.
          </p>
        </div>
        <ul
          className="agent-flow-legend"
          aria-label="Agent 그래프 범례"
        >
          <li className="is-complete">완료</li>
          <li className="is-human">사람 확인</li>
          <li className="is-stopped">안전 중단</li>
        </ul>
      </div>
      <div className="agent-flow-workspace">
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
            panOnScroll={false}
            zoomOnScroll={false}
            preventScrolling={false}
            zoomOnDoubleClick={false}
            onInit={setFlowInstance}
            onNodeClick={(_, node) =>
              setManualSelectedNodeId(node.id as GraphNodeId)
            }
            aria-label="보험금 확인 Agent 실행 그래프"
          >
            <Background gap={24} size={1} />
          </ReactFlow>
        </div>
        {inspectedNode ? (
          <aside className="agent-flow-inspector" aria-live="polite">
            <Badge variant={statusBadgeVariants[inspectedNode.data.status]}>
              {statusLabels[inspectedNode.data.status]}
            </Badge>
            <div>
              <span>{roleLabels[inspectedNode.data.role]}</span>
              <h4>{inspectedNode.data.label}</h4>
              <p>노드를 누르면 이 단계가 실제로 받은 값과 남긴 값을 확인합니다.</p>
            </div>
            <dl>
              <div>
                <dt>입력</dt>
                <dd>{inspectedNode.data.inputSummary}</dd>
              </div>
              <div>
                <dt>출력</dt>
                <dd>{inspectedNode.data.outputSummary}</dd>
              </div>
            </dl>
            {inspectedNode.data.durationMs ? (
              <small>{inspectedNode.data.durationMs}ms · 서버 trace 기준</small>
            ) : (
              <small>아직 실행되지 않은 선택 단계입니다.</small>
            )}
          </aside>
        ) : null}
      </div>
      <div className="agent-flow-footnote">
        <HandIcon aria-hidden="true" />
        <span>
          여기서 나오는 것은 확인된 근거와 다음에 할 일뿐입니다. 지급 여부는
          정하지 않습니다.
        </span>
      </div>
    </section>
  )
}
