namespace splitTime {
    let nextRef = 10

    export class Sprite implements splitTime.body.Drawable {
        private img: string
        private _timeMs: number
        private _frameSignaler: Signaler
        ref: int
        constructor(img: string) {
            this.img = img
            this._timeMs = 0
            this._frameSignaler = new splitTime.IntervalStabilizer(
                200,
                1,
                () => {
                    return this._timeMs
                }
            )
            this.ref = nextRef++
        }

        static DEFAULT_STANCE = "default"

        private autoReset: boolean = true

        xres = 32
        yres = 64

        baseOffX = 0
        baseOffY = 0

        omniDir = false
        rotate = 0

        opacityModifier = 1
        playerOcclusionFadeFactor = 0
        stance = splitTime.Sprite.DEFAULT_STANCE
        requestedStance = splitTime.Sprite.DEFAULT_STANCE
        requestedFrameReset = false
        frame = 0
        dir = splitTime.direction.S
        requestedDir = splitTime.direction.S

        stances: {
            [x: string]: { S: number; N: number; E: number; W: number } | number
        } = {
            [Sprite.DEFAULT_STANCE]: {
                S: 0,
                N: 1,
                E: 2,
                W: 3
            }
        }

        light: body.Light | null = null

        private getImage(): HTMLImageElement {
            return G.ASSETS.images.get(this.img)
        }

        getCanvasRequirements(x: number, y: number, z: number) {
            return new splitTime.body.CanvasRequirements(
                Math.round(x),
                Math.round(y),
                Math.round(z),
                this.xres,
                this.yres
            )
        }

        draw(ctx: GenericCanvasRenderingContext2D) {
            // if(!this.canSee) {return;}

            ctx.rotate(this.rotate)

            //splitTime.onBoard.bodies is displayed partially transparent depending on health (<= 50% transparent)
            //ctx.globalAlpha = (this.hp + this.strg)/(2*this.strg);

            this._drawSimple(ctx)

            // this.seeAction();
            // this.seeStatus();

            //ctx.rotate(-this.rotate);

            this.rotate = 0
        }

        _drawSimple(ctx: GenericCanvasRenderingContext2D) {
            var tImg = this.getImage()

            var crop = this.getAnimationFrameCrop(
                this.dir,
                this.stance,
                this.frame
            )
            var x = -Math.round(crop.xres / 2) - this.baseOffX
            var y = -crop.yres - this.baseOffY

            ctx.globalAlpha = ctx.globalAlpha * this.opacityModifier

            ctx.drawImage(
                tImg,
                crop.sx,
                crop.sy,
                crop.xres,
                crop.yres,
                x,
                y,
                crop.xres,
                crop.yres
            )
        }

        getAnimationFrameCrop(numDir: number, stance: string, frame: int) {
            var crop = {
                xres: this.xres,
                yres: this.yres,
                sx: 0,
                sy: this.yres * frame
            }

            var column = 0
            var dir = splitTime.direction.toString(numDir)
            var simpleDir = splitTime.direction.simplifyToCardinal(dir)

            //Allow for non-complicated spritesheets with one column
            if (!this.stances) {
                return crop
            }

            if (!stance || !(stance in this.stances)) {
                stance = "default"
            }

            const dirSpec = this.stances[stance]
            if (!(dirSpec instanceof Object)) {
                column = dirSpec
            } else {
                const dirMap = dirSpec as { [dir: string]: int }
                //If shorten intermediate directions to cardinal if they are not specified
                if (typeof dirMap[dir] !== "undefined") {
                    column = dirMap[dir]
                } else if (simpleDir && typeof dirMap[simpleDir] !== "undefined") {
                    column = dirMap[simpleDir]
                } else {
                    log.warn(
                        "Stance " + stance + " missing direction " + dir
                    )
                    column = 0
                }
            }

            crop.sx = this.xres * column
            return crop
        }

        finalizeFrame() {
            if (
                this.stance != this.requestedStance ||
                this.requestedFrameReset
            ) {
                this.frame = 0
            } else {
                //Only update on frame tick
                if (this._frameSignaler.isSignaling()) {
                    var mod = this.getAnimationFramesAvailable()
                    if (mod > 0) {
                        this.frame++
                        this.frame %= mod
                    } else {
                        this.frame = 0
                    }
                }
            }
        }

        getAnimationFramesAvailable(): int {
            var calculation = Math.floor(this.getImage().height / this.yres)
            if (isNaN(calculation)) {
                if (splitTime.debug.ENABLED) {
                    splitTime.log.warn(
                        this.img +
                            " not loaded yet for frame count calculation for " +
                            this.ref
                    )
                }
                return 1
            } else {
                return calculation
            }
        }

        finalizeStance() {
            //Allow for non-complicated sprite sheets with one column
            if (!this.stances) {
                return
            }

            if (
                !this.requestedStance ||
                !(this.requestedStance in this.stances)
            ) {
                this.requestedStance = "default"
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

        notifyFrameUpdate(delta: number) {
            // Don't care about real time
        }

        notifyTimeAdvance(delta: number) {
            this._timeMs += delta * 1000
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
            var clone = new splitTime.Sprite(this.img)
            clone.xres = this.xres
            clone.yres = this.yres
            clone.baseOffX = this.baseOffX
            clone.baseOffY = this.baseOffY
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
            clone.stances = this.stances
            clone.light = this.light
            return clone
        }
    }
}
