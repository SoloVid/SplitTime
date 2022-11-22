import { Assets } from "engine/assets/assets"
import type { int } from "globals"
import { Canvas, GenericCanvasRenderingContext2D } from "./canvas"

/** Abstraction around HTML5 canvas. */
export interface DrawingBoard {
  drawImage: (imageId: string, destination: DrawRect | DrawPosition, sourceCrop?: DrawRect) => void
  withRawCanvasContext: (useCanvasContext: (ctx: GenericCanvasRenderingContext2D) => void) => void
  /** @deprecated Use the other APIs instead. */
  raw: Canvas
}

export interface DrawPosition {
  x: int
  y: int
}

export interface DrawRect {
  x: int
  y: int
  width: int
  height: int
}

export function makeAssetDrawingBoard(assets: Assets, width: int, height: int): DrawingBoard {
  const canvas = new Canvas(width, height)
  return {
    drawImage(imageId, destination, sourceCrop) {
      const image = assets.images.get(imageId)
      if (sourceCrop) {
        canvas.context.drawImage(
          image,
          sourceCrop.x, sourceCrop.y, sourceCrop.width, sourceCrop.height,
          destination.x, destination.y, sourceCrop.width, sourceCrop.height
        )
      } else {
        const destRect = destination as Partial<DrawRect>
        canvas.context.drawImage(
          image,
          destination.x, destination.y, destRect.width ?? image.width, destRect.height ?? image.height
        )
      }
    },
    withRawCanvasContext(useCanvasContext) {
      useCanvasContext(canvas.context)
    },
    raw: canvas,
  }
}
