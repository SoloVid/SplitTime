import { DrawingBoard } from "engine/ui/viewport/drawing-board"
import { Configuration as CONFIG } from "engine/ui/conversation/runtime/renderer"
import { CanvasRequirements, Drawable } from "./drawable"
import { BodySpec } from "engine/file/collage"
import { game_seconds } from "engine/time/timeline"
import { GenericCanvasRenderingContext2D } from "engine/ui/viewport/canvas"
import { Coordinates3D } from "engine/world/level/level-location"
import { Rect } from "engine/math/rect"
import { Light } from "./light"

export class WordSprite implements Drawable {
    private _time: game_seconds = 0
    constructor(
        private readonly body: BodySpec,
        public text: string
    ) {
    }

    rotate = 0

    opacityModifier = 1
    playerOcclusionFadeFactor = 0

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
    private _drawSimple(ctx: GenericCanvasRenderingContext2D) {
        ctx.globalAlpha = ctx.globalAlpha * this.opacityModifier

        ctx.textBaseline = "alphabetic"
        ctx.font = CONFIG.FONT_SIZE + "px " + CONFIG.FONT
        ctx.strokeStyle = CONFIG.TEXT_OUTLINE_COLOR
        ctx.lineWidth = CONFIG.TEXT_OUTLINE_WIDTH
        ctx.lineJoin = "round"
        ctx.miterLimit = 2

        const width = ctx.measureText(this.text).width

        ctx.strokeText(this.text, -width / 2, 0)
        ctx.fillStyle = CONFIG.TEXT_COLOR
        ctx.fillText(this.text, -width / 2, 0)
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
