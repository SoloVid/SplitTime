namespace splitTime {
    // TODO: Try not to let these be global state like this.
    export let RAIN_IMAGE: string = "rain.png"
    export let CLOUDS_IMAGE: string = "stormClouds.png"

    const COUNTER_BASE = 25600

    export class WeatherRenderer {
        private readonly SCREEN_WIDTH: int
        private readonly SCREEN_HEIGHT: int

        private readonly buffer: splitTime.Canvas

        constructor(
            private readonly camera: Camera,
            private readonly ctx: CanvasRenderingContext2D
        ) {
            this.SCREEN_WIDTH = camera.SCREEN_WIDTH
            this.SCREEN_HEIGHT = camera.SCREEN_HEIGHT

            this.buffer = new splitTime.Canvas(this.SCREEN_WIDTH, this.SCREEN_HEIGHT)
        }

        render(level: Level) {
            const screen = this.camera.getScreenCoordinates()

            this.applyLighting(level, screen)

            const counter = level.getRegion().getTimeMs() % COUNTER_BASE

            //Weather
            if (level.weather.isRaining) {
                this.ctx.drawImage(
                    G.ASSETS.images.get(RAIN_IMAGE),
                    -((counter % 100) / 100) * this.SCREEN_WIDTH,
                    ((counter % 25) / 25) * this.SCREEN_HEIGHT -
                        this.SCREEN_HEIGHT
                )
            }
            if (level.weather.isCloudy) {
                var CLOUDS_WIDTH = 2560
                var CLOUDS_HEIGHT = 480
                var xPixelsShift = -splitTime.mod(counter - screen.x, CLOUDS_WIDTH)
                var yPixelsShift = splitTime.mod(screen.y, CLOUDS_HEIGHT)
                this.ctx.globalAlpha = level.weather.cloudAlpha
                this.drawTiled(
                    G.ASSETS.images.get(CLOUDS_IMAGE),
                    xPixelsShift,
                    yPixelsShift
                )
                this.ctx.globalAlpha = 1
            }
            if (level.weather.lightningFrequency > 0) {
                // TODO: tie to time rather than frames
                if (
                    splitTime.randomInt(splitTime.FPS * 60) <=
                    level.weather.lightningFrequency
                ) {
                    this.ctx.fillStyle = "rgba(255, 255, 255, .75)"
                    this.ctx.fillRect(
                        0,
                        0,
                        this.SCREEN_WIDTH,
                        this.SCREEN_HEIGHT
                    )
                }
            }
        }

        /**
         * @param {HTMLImageElement} image
         * @param {number} left x in image to start tiling at
         * @param {number} top y in image to start tiling at
         */
        private drawTiled(image: HTMLImageElement, left: number, top: number) {
            left = splitTime.mod(left, image.naturalWidth)
            top = splitTime.mod(top, image.naturalHeight)
            // Draw upper left tile
            this.ctx.drawImage(
                image,
                left,
                top,
                this.SCREEN_WIDTH,
                this.SCREEN_HEIGHT,
                0,
                0,
                this.SCREEN_WIDTH,
                this.SCREEN_HEIGHT
            )

            var xEnd = image.naturalWidth - left
            if (xEnd < this.SCREEN_WIDTH) {
                // Draw upper right tile if needed
                this.ctx.drawImage(
                    image,
                    0,
                    top,
                    this.SCREEN_WIDTH,
                    this.SCREEN_HEIGHT,
                    xEnd,
                    0,
                    this.SCREEN_WIDTH,
                    this.SCREEN_HEIGHT
                )
            }

            var yEnd = image.naturalHeight - top
            if (yEnd < this.SCREEN_HEIGHT) {
                // Draw lower left tile if needed
                this.ctx.drawImage(
                    image,
                    left,
                    0,
                    this.SCREEN_WIDTH,
                    this.SCREEN_HEIGHT,
                    0,
                    yEnd,
                    this.SCREEN_WIDTH,
                    this.SCREEN_HEIGHT
                )
            }

            if (xEnd < this.SCREEN_WIDTH && yEnd < this.SCREEN_HEIGHT) {
                // Draw lower right tile if needed
                this.ctx.drawImage(
                    image,
                    0,
                    0,
                    this.SCREEN_WIDTH,
                    this.SCREEN_HEIGHT,
                    xEnd,
                    yEnd,
                    this.SCREEN_WIDTH,
                    this.SCREEN_HEIGHT
                )
            }
        }

        private applyLighting(level: Level, screen: { x: number; y: number }) {
            //Transparentize buffer
            this.buffer.context.clearRect(
                0,
                0,
                this.SCREEN_WIDTH,
                this.SCREEN_HEIGHT
            )
            //Fill with light
            this.buffer.context.fillStyle = level.weather.ambientLight
            this.buffer.context.fillRect(
                0,
                0,
                this.SCREEN_WIDTH,
                this.SCREEN_HEIGHT
            )

            var bodies = level.getBodies()
            for (const body of bodies) {
                if (body.lightIntensity > 0) {
                    var xCoord = body.x - screen.x
                    var yCoord = body.y - body.z - screen.y
                    var grd = this.buffer.context.createRadialGradient(
                        xCoord,
                        yCoord,
                        1,
                        xCoord,
                        yCoord,
                        body.lightRadius
                    )
                    grd.addColorStop(
                        0,
                        "rgba(255, 255, 255, " +
                            body.lightIntensity +
                            ")"
                    )
                    grd.addColorStop(1, "rgba(255, 255, 255, 0)")
                    this.buffer.context.fillStyle = grd
                    this.buffer.context.beginPath()
                    this.buffer.context.arc(
                        xCoord,
                        yCoord,
                        150,
                        0,
                        2 * Math.PI
                    )
                    this.buffer.context.closePath()
                    this.buffer.context.fill()
                }
            }

            this.ctx.globalCompositeOperation = "multiply"
            //Render buffer
            this.ctx.drawImage(
                this.buffer.element,
                0,
                0,
                this.SCREEN_WIDTH,
                this.SCREEN_HEIGHT
            )

            //Return to default splitTime.image layering
            this.ctx.globalCompositeOperation = "source-over"
        }
    }
}
