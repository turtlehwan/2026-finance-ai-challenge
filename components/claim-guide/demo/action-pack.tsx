"use client"

import {
  ClipboardCopyIcon,
  DownloadIcon,
  FileCheck2Icon,
  FolderCheckIcon,
  Share2Icon,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { ClaimCase, ClaimResult } from "@/lib/claim-guide/types"

function buildActionPackText(
  activeCase: ClaimCase,
  results: ClaimResult[],
) {
  const resultLines = results
    .map(
      (result) =>
        `- ${result.title}: ${result.status}\n  근거: ${result.clause}\n  이유: ${result.reason}`,
    )
    .join("\n")
  const documents = activeCase.documents.map((item) => `- ${item}`).join("\n")
  const questions = activeCase.questions
    .map((item, index) => `${index + 1}. ${item}`)
    .join("\n")

  return [
    "보험금 길잡이 · 사례 정리본",
    "",
    activeCase.title,
    "",
    "[분석 결과]",
    resultLines,
    "",
    "[준비할 자료]",
    documents,
    "",
    "[보험사에 물어볼 질문]",
    questions,
    "",
    "본 자료는 참고용이며 최종 지급 여부는 보험회사가 결정합니다.",
  ].join("\n")
}

export function ActionPack({
  activeCase,
  results,
}: {
  activeCase: ClaimCase
  results: ClaimResult[]
}) {
  const copyQuestions = async () => {
    try {
      await navigator.clipboard.writeText(activeCase.questions.join("\n"))
      toast.success("보험사에 물어볼 질문을 복사했습니다.")
    } catch {
      toast.error("복사하지 못했습니다. 다시 시도해 주세요.")
    }
  }

  const downloadPack = () => {
    const blob = new Blob([buildActionPackText(activeCase, results)], {
      type: "text/plain;charset=utf-8",
    })
    const href = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = href
    anchor.download = `보험금-길잡이-${activeCase.shortTitle}-정리본.txt`
    anchor.click()
    URL.revokeObjectURL(href)
    toast.success("정리본을 내려받았습니다.")
  }

  const sharePack = async () => {
    const shareText = buildActionPackText(activeCase, results)
    try {
      if (navigator.share) {
        await navigator.share({
          title: activeCase.title,
          text: shareText,
        })
      } else {
        await navigator.clipboard.writeText(shareText)
        toast.success("공유할 내용을 클립보드에 복사했습니다.")
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return
      }
      toast.error("공유하지 못했습니다. 다시 시도해 주세요.")
    }
  }

  return (
    <Card className="action-pack-card">
      <CardHeader>
        <CardTitle>{activeCase.actionTitle}</CardTitle>
        <CardDescription>
          보험사에 가기 전에 챙길 것들입니다. 내려받아 그대로 쓰셔도 됩니다.
        </CardDescription>
        <CardAction>
          <FolderCheckIcon aria-hidden="true" />
        </CardAction>
      </CardHeader>
      <CardContent className="action-pack-grid">
        <div>
          <strong>준비할 자료</strong>
          <ul>
            {activeCase.documents.map((item) => (
              <li key={item}>
                <FileCheck2Icon aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <strong>보험사에 물어볼 질문</strong>
          <ol>
            {activeCase.questions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </div>
      </CardContent>
      <CardFooter className="action-pack-actions">
        <Button variant="outline" onClick={copyQuestions}>
          <ClipboardCopyIcon data-icon="inline-start" />
          질문 복사
        </Button>
        <Button variant="outline" onClick={downloadPack}>
          <DownloadIcon data-icon="inline-start" />
          내려받기
        </Button>
        <Button variant="outline" onClick={sharePack}>
          <Share2Icon data-icon="inline-start" />
          결과 공유
        </Button>
      </CardFooter>
    </Card>
  )
}
