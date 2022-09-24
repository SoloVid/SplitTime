import { body, Coordinates3D, game_seconds, GenericCanvasRenderingContext2D, math } from "../../../splitTime"
import { Configuration as CONFIG } from "../../../splitTime.conversation"
import { BodySpec } from "../../../splitTime.file.collage"
import { CanvasRequirements, Drawable } from "./drawable"

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
            math.Rect.make(-200, -200, 400, 400)
        )
    }

    draw(ctx: GenericCanvasRenderingContext2D) {
        ctx.rotate(this.rotate)

        this._drawSimple(ctx)

        //ctx.rotate(-this.rotate);

        this.rotate = 0
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

    getLight(): body.Light | null {
        return null
    }
}