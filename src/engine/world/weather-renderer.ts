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
            private readonly camera: Camera
        ) {
            this.SCREEN_WIDTH = camera.SCREEN_WIDTH
            this.SCREEN_HEIGHT = camera.SCREEN_HEIGHT
            
            this.buffer = new splitTime.Canvas(this.SCREEN_WIDTH, this.SCREEN_HEIGHT)
        }

        render(level: Level, ctx: GenericCanvasRenderingContext2D) {
            const screen = this.camera.getScreenCoordinates()

            this.applyLighting(level, screen, ctx)

            const counter = Math.round(time.getFromLevel(level) * 100) % COUNTER_BASE

            //Weather
            if (level.weather.isRaining) {
                ctx.drawImage(
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
                ctx.globalAlpha = level.weather.cloudAlpha
                this.drawTiled(
                    G.ASSETS.images.get(CLOUDS_IMAGE),
                    ctx,
                    xPixelsShift,
                    yPixelsShift
                )
                ctx.globalAlpha = 1
            }
            if (level.weather.lightningFrequency > 0) {
                // TODO: tie to time rather than frames
                if (
                    splitTime.randomInt(splitTime.FPS * 60) <=
                    level.weather.lightningFrequency
                ) {
                    ctx.fillStyle = "rgba(255, 255, 255, .75)"
                    ctx.fillRect(
                        0,
                        0,
                        this.SCREEN_WIDTH,
                        this.SCREEN_HEIGHT
                    )
                }
            }
        }

        /**
         * @param {number} left x in image to start tiling at
         * @param {number} top y in image to start tiling at
         */
        private drawTiled(image: HTMLImageElement, ctx: GenericCanvasRenderingContext2D, left: number, top: number) {
            left = splitTime.mod(left, image.naturalWidth)
            top = splitTime.mod(top, image.naturalHeight)
            // Draw upper left tile
            ctx.drawImage(
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
                ctx.drawImage(
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
                ctx.drawImage(
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
                ctx.drawImage(
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

        private applyLighting(level: Level, screen: { x: number; y: number }, ctx: GenericCanvasRenderingContext2D) {
            //Transparentize buffer
            this.buffer.context.clearRect(
                0,
                0,
                this.SCREEN_WIDTH,
                this.SCREEN_HEIGHT
            )
            //Fill with light
            this.buffer.context.fillStyle = level.weather.getAmbientLight().cssString
            this.buffer.context.fillRect(
                0,
                0,
                this.SCREEN_WIDTH,
                this.SCREEN_HEIGHT
            )

            this.buffer.context.globalCompositeOperation = "lighter"

            const bodies = level.getBodies()
            for (const body of bodies) {
                for (const drawable of body.drawables) {
                    const light = drawable.getLight()
                    if (!light) {
                        continue
                    }
                    this.buffer.withCleanTransform(() => {
                        // FTODO: Don't duplicate with what's in BodyRenderer
                        const desiredOrigin = drawable.getDesiredOrigin(body)
                        this.buffer.context.translate(
                            Math.round(desiredOrigin.x - screen.x),
                            Math.round(desiredOrigin.y - desiredOrigin.z - screen.y)
                        )
                        light.applyLighting(this.buffer.context, drawable.opacityModifier)
                    })
                }
            }

            // Return to default
            this.buffer.context.globalCompositeOperation = "source-over"

            ctx.globalCompositeOperation = "multiply"
            //Render buffer
            ctx.drawImage(
                this.buffer.element,
                0,
                0,
                this.SCREEN_WIDTH,
                this.SCREEN_HEIGHT
            )

            //Return to default splitTime.image layering
            ctx.globalCompositeOperation = "source-over"
        }
    }
}
