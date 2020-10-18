namespace splitTime {
    let nextRef = 10

    export class Sprite implements splitTime.body.Drawable {
        private _time: game_seconds = Number.NEGATIVE_INFINITY
        private _timeFrameStarted: game_seconds = Number.NEGATIVE_INFINITY
        readonly ref: int
        constructor(
            private readonly collage: Readonly<Collage>
        ) {
            this.ref = nextRef++
        }

        static DEFAULT_STANCE = "$DEFAULT_STANCE$"

        private autoReset: boolean = true

        omniDir = false
        rotate = 0

        opacityModifier = 1
        playerOcclusionFadeFactor = 0
        private stance = splitTime.Sprite.DEFAULT_STANCE
        private requestedStance = splitTime.Sprite.DEFAULT_STANCE
        private requestedFrameReset = false
        private frame = 0
        private dir = splitTime.direction.S
        private requestedDir = splitTime.direction.S

        light: body.Light | null = null

        private getImage(): HTMLImageElement {
            return G.ASSETS.images.get(this.collage.image)
        }

        private getCurrentParcel(): collage.Parcel {
            if (this.stance === Sprite.DEFAULT_STANCE) {
                return this.collage.getDefaultParcel(this.dir)
            }
            return this.collage.getParcel(this.stance, this.dir)
        }

        private getCurrentFrame(): collage.Frame {
            return this.getCurrentParcel().getFrame(this.frame)
        }

        getDesiredOrigin(whereDefaultWouldBe: Coordinates3D): Coordinates3D {
            return whereDefaultWouldBe
        }

        getCanvasRequirements(): splitTime.body.CanvasRequirements {
            const frame = this.getCurrentFrame()
            return new splitTime.body.CanvasRequirements(
                math.Rect.make(
                    0 - frame.box.width / 2 + frame.offset.x,
                    0 - frame.box.height + frame.offset.y,
                    frame.box.width,
                    frame.box.height
                )
            )
        }

        draw(ctx: GenericCanvasRenderingContext2D) {
            ctx.rotate(this.rotate)

            this._drawSimple(ctx)

            //ctx.rotate(-this.rotate);

            this.rotate = 0
        }

        private _drawSimple(ctx: GenericCanvasRenderingContext2D) {
            var tImg = this.getImage()

            const frame = this.getCurrentFrame()
            var x = -Math.round(frame.box.width / 2) - frame.offset.x
            var y = -frame.box.height - frame.offset.y

            ctx.globalAlpha = ctx.globalAlpha * this.opacityModifier

            ctx.drawImage(
                tImg,
                frame.box.x,
                frame.box.y,
                frame.box.width,
                frame.box.height,
                x,
                y,
                frame.box.width,
                frame.box.height
            )
        }

        private setFrame(newFrame: int) {
            this.frame = newFrame
            this._timeFrameStarted - this._time
        }

        private finalizeFrame() {
            if (
                this.stance !== this.requestedStance ||
                this.requestedFrameReset
            ) {
                this.frame = 0
                this._timeFrameStarted = this._time
            } else {
                //Only update on frame tick
                while (this._time > this._timeFrameStarted + this.getCurrentFrame().duration) {
                    this._timeFrameStarted = this._timeFrameStarted + this.getCurrentFrame().duration
                    this.frame = (this.frame + 1) % this.getCurrentParcel().frames.length
                }
            }
        }

        private finalizeStance() {
            if (!this.requestedStance || !this.collage.hasParcel(this.requestedStance)) {
                this.requestedStance = Sprite.DEFAULT_STANCE
            }
            this.stance = this.requestedStance
            this.dir = this.requestedDir
        }

        requestStance(
            stance: string,
            dir: number,
            forceReset = false,
            hold: boolean = false
        ) {
            this.requestedStance = stance
            this.requestedDir = dir
            this.requestedFrameReset = forceReset
            this.autoReset = !hold
        }

        private resetStance() {
            this.requestStance(splitTime.Sprite.DEFAULT_STANCE, this.dir, true)
        }

        notifyTimeAdvance(delta: game_seconds) {
            this._time += delta
        }

        prepareForRender() {
            this.finalizeStance()
            this.finalizeFrame()
        }
        cleanupAfterRender() {
            if (this.autoReset) {
                this.resetStance()
            }
        }

        getLight(): body.Light | null {
            return this.light
        }

        clone(): splitTime.Sprite {
            var clone = new splitTime.Sprite(this.collage)
            clone.omniDir = this.omniDir
            clone.rotate = this.rotate
            clone.opacityModifier = this.opacityModifier
            clone.playerOcclusionFadeFactor = this.playerOcclusionFadeFactor
            clone.stance = this.stance
            clone.requestedStance = this.requestedStance
            clone.requestedFrameReset = this.requestedFrameReset
            clone.frame = this.frame
            clone.dir = this.dir
            clone.requestedDir = this.requestedDir
            clone.light = this.light
            return clone
        }
    }
}
