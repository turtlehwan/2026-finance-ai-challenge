import { handleAiDocumentConversion } from "@/lib/claim-guide/workers-ai"

async function getWorkersAiBinding() {
  const { env } = await import("cloudflare:workers")
  return env.AI
}

export async function POST(request: Request) {
  return handleAiDocumentConversion(request, await getWorkersAiBinding())
}
