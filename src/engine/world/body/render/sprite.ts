namespace splitTime {
    let nextRef = 10

    export class Sprite implements splitTime.body.Drawable {
        private _time: game_seconds = 0
        private _timeFrameStarted: game_seconds = 0
        readonly ref: int
        constructor(
            private readonly body: file.collage.BodySpec,
            private readonly collageId: string,
            private readonly defaultMontageId?: string
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

        private get collage(): Readonly<Collage> {
            return G.ASSETS.collages.get(this.collageId)
        }

        private getImage(): HTMLImageElement {
            return G.ASSETS.images.get(this.collage.image)
        }

        private getCurrentMontage(): collage.Montage {
            if (this.stance === Sprite.DEFAULT_STANCE) {
                if (this.defaultMontageId) {
                    return this.collage.getMontage(this.defaultMontageId, this.dir)
                }
                return this.collage.getDefaultMontage(this.dir)
            }
            return this.collage.getMontage(this.stance, this.dir)
        }

        private getCurrentFrame(): collage.Frame {
            return this.getCurrentMontage().getFrame(this.frame)
        }

        getDesiredOrigin(whereDefaultWouldBe: Coordinates3D): Coordinates3D {
            return whereDefaultWouldBe
        }

        getCanvasRequirements(): splitTime.body.CanvasRequirements {
            return new splitTime.body.CanvasRequirements(
                this.getCurrentFrame().getTargetBox(this.body)
            )
        }

        draw(ctx: GenericCanvasRenderingContext2D) {
            ctx.rotate(this.rotate)

            this._drawSimple(ctx)

            //ctx.rotate(-this.rotate);

            this.rotate = 0
        }

        private _drawSimple(ctx: GenericCanvasRenderingContext2D) {
            const frame = this.getCurrentFrame()
            const targetBox = frame.getTargetBox(this.body)

            ctx.globalAlpha = ctx.globalAlpha * this.opacityModifier

            ctx.drawImage(
                this.getImage(),
                frame.box.x,
                frame.box.y,
                frame.box.width,
                frame.box.height,
                targetBox.x,
                targetBox.y,
                targetBox.width,
                targetBox.height
            )
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
                    this.frame = (this.frame + 1) % this.getCurrentMontage().frames.length
                }
            }
        }

        private finalizeStance() {
            if (!this.requestedStance || !this.collage.hasMontage(this.requestedStance)) {
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
            const oldStance = this.stance
            let currentFrame = this.getCurrentFrame()

            if (!this.requestedStance || !this.collage.hasMontage(this.requestedStance)) {
                this.requestedStance = Sprite.DEFAULT_STANCE
            }
            this.stance = this.requestedStance
            this.dir = this.requestedDir
            const montage = this.getCurrentMontage()

            if (
                oldStance !== this.stance ||
                this.requestedFrameReset
            ) {
                this.frame = 0
                this._timeFrameStarted = this._time
            } else {
                //Only update on frame tick
                while (this._time > this._timeFrameStarted + currentFrame.duration) {
                    this._timeFrameStarted = this._timeFrameStarted + currentFrame.duration
                    this.frame = (this.frame + 1) % montage.frames.length
                    currentFrame = this.getCurrentFrame()
                }
            }
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
            const newBody = {
                width: this.body.width,
                depth: this.body.depth,
                height: this.body.height
            }
            var clone = new splitTime.Sprite(newBody, this.collageId)
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
