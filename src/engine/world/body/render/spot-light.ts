namespace splitTime.body {
    export class SpotLight implements Light {

        constructor(
            private readonly intensity: number = 0,
            private readonly radius: number = 150
        ) {}

        applyLighting(
            ctx: GenericCanvasRenderingContext2D,
            intensityModifier: number
        ): void {
            if (intensityModifier > 0 && this.intensity > 0) {
                var grd = ctx.createRadialGradient(
                    0,
                    0,
                    1,
                    0,
                    0,
                    this.radius
                )
                const combinedIntensity = intensityModifier * this.intensity
                grd.addColorStop(
                    0,
                    "rgba(255, 255, 255, " + combinedIntensity + ")"
                )
                grd.addColorStop(1, "rgba(255, 255, 255, 0)")
                ctx.fillStyle = grd
                ctx.beginPath()
                ctx.arc(
                    0,
                    0,
                    this.radius,
                    0,
                    2 * Math.PI
                )
                ctx.closePath()
                ctx.fill()
            }
        }
    }
}
