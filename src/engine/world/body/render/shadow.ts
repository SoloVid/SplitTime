namespace splitTime.body {
    export class Shadow implements splitTime.body.Drawable {
        realBody: Body
        shadowBody: Body
        minRadius: number
        maxRadius: number
        radius: number
        constructor(body: splitTime.Body) {
            this.realBody = body
            this.shadowBody = new splitTime.Body()
            this.shadowBody.drawable = this
            this.shadowBody.baseLength = body.baseLength
            this.shadowBody.height = 0

            this.minRadius = 4
            this.maxRadius = this.shadowBody.baseLength
            this.radius = this.maxRadius
        }
        opacity = 1
        playerOcclusionFadeFactor = 0

        getCanvasRequirements(x: number, y: number, z: number) {
            return new splitTime.body.CanvasRequirements(
                Math.round(x),
                Math.round(y),
                Math.round(z),
                this.radius,
                this.radius
            )
        }

        draw(ctx: GenericCanvasRenderingContext2D) {
            var // Radii of the white glow.
                innerRadius = 2,
                outerRadius = this.radius,
                // Radius of the entire circle.
                radius = this.radius

            var gradient = ctx.createRadialGradient(
                0,
                0,
                innerRadius,
                0,
                0,
                outerRadius
            )
            gradient.addColorStop(0, "rgba(0, 0, 0, .7)")
            gradient.addColorStop(1, "rgba(0, 0, 0, 0)")

            ctx.scale(1, 0.5)

            ctx.beginPath()
            ctx.arc(0, 0, radius, 0, 2 * Math.PI)

            ctx.fillStyle = gradient
            ctx.fill()
        }

        notifyFrameUpdate(delta: number) {
            // Do nothing
        }

        notifyTimeAdvance(delta: number) {
            // Do nothing
        }

        prepareForRender() {
            const maxFallDist = 1000
            const minBottom = this.realBody.z - maxFallDist
            const shadowFallInfo = COLLISION_CALCULATOR.calculateVolumeCollision(
                this.realBody.level,
                this.realBody.x - this.realBody.halfBaseLength, this.realBody.baseLength,
                this.realBody.y - this.realBody.halfBaseLength, this.realBody.baseLength,
                minBottom, maxFallDist + 1,
                [this.realBody],
                true
            )
            this.shadowBody.x = this.realBody.x
            this.shadowBody.y = this.realBody.y
            this.shadowBody.z = Math.min(shadowFallInfo.zBlockedTopEx, this.realBody.z)
            this.radius =
                (this.maxRadius - this.minRadius) /
                    (0.05 * Math.abs(this.realBody.z - this.shadowBody.z) + 1) +
                this.minRadius
        }
        cleanupAfterRender() {
            // Do nothing
        }
    }
}
