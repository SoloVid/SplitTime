import { Canvas } from "engine/ui/viewport/canvas"
import { assert } from "globals"

export const PLACEHOLDER_WIDTH = 64
function makePlaceholderImage(): string {
  const tempCanvas = new Canvas(PLACEHOLDER_WIDTH, PLACEHOLDER_WIDTH)
  const el = tempCanvas.element
  assert(el instanceof HTMLCanvasElement, "Canvas element should be HTML (not offscreen)")
  const ctx = el.getContext("2d")
  if (!ctx) {
    throw new Error("Failed to get context for placeholder image")
  }

  ctx.fillStyle = "#CD96CD"
  ctx.fillRect(0, 0, PLACEHOLDER_WIDTH, PLACEHOLDER_WIDTH)
  return el.toDataURL()
}

const cache: Record<string, string> = {}
export function getErrorPlaceholderImageUrl(message: string): string {
  if (!(message in cache)) {
    cache[message] = makePlaceholderImage()
  }
  return cache[message]
}
