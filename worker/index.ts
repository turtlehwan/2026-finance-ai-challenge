/** Cloudflare Worker entry point for Vinext local development. */
import {
  DEFAULT_DEVICE_SIZES,
  DEFAULT_IMAGE_SIZES,
  handleImageOptimization,
} from "vinext/server/image-optimization"
import handler from "vinext/server/app-router-entry"

const COST_BEARING_AI_PATHS = new Set([
  "/api/ai/interpret",
  "/api/documents/ai-convert",
])

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url)

    if (
      request.method === "POST" &&
      COST_BEARING_AI_PATHS.has(url.pathname)
    ) {
      const { success } = await env.AI_RATE_LIMITER.limit({
        key: url.pathname,
      })

      if (!success) {
        return Response.json(
          {
            error:
              "AI 보조 요청이 잠시 몰렸습니다. 1분 뒤 다시 시도해 주세요.",
          },
          {
            status: 429,
            headers: {
              "Cache-Control": "no-store",
              "Retry-After": "60",
            },
          },
        )
      }
    }

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES]
      return handleImageOptimization(
        request,
        {
          fetchAsset: (path) =>
            env.ASSETS.fetch(new Request(new URL(path, request.url))),
          transformImage: async (body, { width, format, quality }) => {
            const outputFormat = [
              "image/jpeg",
              "image/png",
              "image/webp",
              "image/gif",
              "image/avif",
              "rgb",
              "rgba",
            ].includes(format)
              ? (format as
                  | "image/jpeg"
                  | "image/png"
                  | "image/webp"
                  | "image/gif"
                  | "image/avif"
                  | "rgb"
                  | "rgba")
              : "image/jpeg"
            const result = await env.IMAGES.input(body)
              .transform(width > 0 ? { width } : {})
              .output({ format: outputFormat, quality })
            return result.response()
          },
        },
        allowedWidths,
      )
    }

    return handler.fetch(request, env, ctx)
  },
}

export default worker
