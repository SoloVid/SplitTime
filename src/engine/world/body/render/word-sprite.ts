namespace splitTime {
    export class WordSprite implements splitTime.body.Drawable {
        private _time: game_seconds = 0
        constructor(
            private readonly body: file.collage.BodySpec,
            public text: string
        ) {
        }

        rotate = 0

        opacityModifier = 1
        playerOcclusionFadeFactor = 0

        getDesiredOrigin(whereDefaultWouldBe: Coordinates3D): Coordinates3D {
            return whereDefaultWouldBe
        }

        getCanvasRequirements(): splitTime.body.CanvasRequirements {
            return new splitTime.body.CanvasRequirements(
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

            ctx.strokeText(this.text, 0, 0)
            ctx.fillText(this.text, 0, 0)
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
}
