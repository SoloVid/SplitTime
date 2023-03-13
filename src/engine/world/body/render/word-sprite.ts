import { DrawingBoard } from "engine/ui/viewport/drawing-board"
import { Configuration as CONFIG } from "engine/ui/conversation/runtime/renderer"
import { CanvasRequirements, Drawable } from "./drawable"
import { BodySpec } from "engine/file/collage"
import { game_seconds } from "engine/time/timeline"
import { Canvas, GenericCanvasRenderingContext2D } from "engine/ui/viewport/canvas"
import { Coordinates3D } from "engine/world/level/level-location"
import { Rect } from "engine/math/rect"
import { Light } from "./light"

const measuringCanvas = new Canvas(8, 8)

export class WordSprite implements Drawable {
    private _time: game_seconds = 0
    private readonly lines: readonly string[]
    constructor(
        private readonly body: BodySpec,
        public text: string
    ) {
        this.lines = text.split(" ")
    }

    rotate = 0

    opacityModifier = 1
    playerOcclusionFadeFactor = 0

    getSize() {
        this.applyStyle(measuringCanvas.context)
        return {
            width: this.lines.reduce((maxWidth, line) => {
                return Math.max(maxWidth, measuringCanvas.context.measureText(line).width)
            }, 0),
            height: this.lines.length * CONFIG.FONT_SIZE,
        }
    }

    getDesiredOrigin(whereDefaultWouldBe: Coordinates3D): Coordinates3D {
        return whereDefaultWouldBe
    }

    getCanvasRequirements(): CanvasRequirements {
        return new CanvasRequirements(
            Rect.make(-200, -200, 400, 400)
        )
    }

    draw(drawingBoard: DrawingBoard) {
        drawingBoard.withRawCanvasContext((ctx) => {
            ctx.rotate(this.rotate)
            this._drawSimple(ctx)
            //ctx.rotate(-this.rotate)
            this.rotate = 0
        })
    }

    private applyStyle(ctx: GenericCanvasRenderingContext2D) {
        ctx.textBaseline = "alphabetic"
        ctx.font = CONFIG.FONT_SIZE + "px " + CONFIG.FONT
        ctx.strokeStyle = CONFIG.TEXT_OUTLINE_COLOR
        ctx.lineWidth = CONFIG.TEXT_OUTLINE_WIDTH
        ctx.lineJoin = "round"
        ctx.miterLimit = 2
    }

    private _drawSimple(ctx: GenericCanvasRenderingContext2D) {
        ctx.globalAlpha = ctx.globalAlpha * this.opacityModifier

        this.applyStyle(ctx)

        // const width = ctx.measureText(this.text).width
        // const width = this.getSize().width

        ctx.fillStyle = "black"
        ctx.fillRect(-8, -16, 16, 16)
        // const y = 16 + 18
        // ctx.fillRect(-8, -CONFIG.FONT_SIZE - 2, 16, CONFIG.FONT_SIZE + 8)
        // ctx.fillStyle = "rgba(50, 100, 150, .4)"
        // // ctx.fillStyle = "rgba(200, 150, 100, .8)"
        // ctx.fillRect(-width / 2 - 4, -CONFIG.FONT_SIZE, width + 8, CONFIG.FONT_SIZE + 4)

        ctx.fillStyle = ctx.strokeStyle
        this.lines.forEach((line, i) => {
            const width = Math.round(ctx.measureText(line).width)
            ctx.strokeText(line, -width / 2, -(this.lines.length - i - 1) * CONFIG.FONT_SIZE - 4 - 16)
            ctx.fillText(line, -width / 2, -(this.lines.length - i - 1) * CONFIG.FONT_SIZE - 4 - 16)
        })
        ctx.fillStyle = CONFIG.TEXT_COLOR
        this.lines.forEach((line, i) => {
            const width = Math.round(ctx.measureText(line).width)
            ctx.strokeText(line, -width / 2, -(this.lines.length - i - 1) * CONFIG.FONT_SIZE - 16)
            ctx.fillText(line, -width / 2, -(this.lines.length - i - 1) * CONFIG.FONT_SIZE - 16)
        })
        // ctx.strokeText(this.text, -width / 2, 0)
        // ctx.fillText(this.text, -width / 2, 0)
    }

    notifyTimeAdvance(delta: game_seconds) {
        this._time += delta
    }

    prepareForRender() {
        // Do nothing.
    }
    cleanupAfterRender() {
        // Do nothing.
    }

    getLight(): Light | null {
        return null
    }
}
