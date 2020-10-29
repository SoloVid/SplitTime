namespace splitTime {
    type body_getter = () => Body | null

    export class WorldRenderer {
        private readonly SCREEN_WIDTH: int
        private readonly SCREEN_HEIGHT: int

        private readonly buffer: splitTime.Canvas
        private readonly snapshot: splitTime.Canvas

        private readonly bodyRenderer: body.Renderer
        private readonly weatherRenderer: WeatherRenderer
        
        private fadingOut: boolean
        private fadeOutAmount: number
        private fadeInAmount: number
        private readonly FADE_INCREMENT: number
        private fadeToColor: splitTime.light.Color
        private fadeToTransparency: number
        private fadeOutPromise: splitTime.Pledge
        private fadeInPromise: splitTime.Pledge

        constructor(
            private readonly camera: Camera,
            private readonly see: GenericCanvasRenderingContext2D,
            private readonly levelManager: LevelManager,
            private readonly playerBodyGetter: body_getter
        ) {
            this.SCREEN_WIDTH = camera.SCREEN_WIDTH
            this.SCREEN_HEIGHT = camera.SCREEN_HEIGHT

            this.fadingOut = false
            this.fadeOutAmount = 0
            this.fadeInAmount = 0
            this.FADE_INCREMENT = 0.05
            this.fadeToColor = new splitTime.light.Color(0,0,0)
            this.fadeToTransparency = 0
            this.fadeInPromise = new splitTime.Pledge()
            this.fadeOutPromise = new splitTime.Pledge()

            this.buffer = new splitTime.Canvas(this.SCREEN_WIDTH, this.SCREEN_HEIGHT)
            this.snapshot = new splitTime.Canvas(
                this.SCREEN_WIDTH,
                this.SCREEN_HEIGHT
            )

            this.bodyRenderer = new body.Renderer(this.camera)
            this.weatherRenderer = new WeatherRenderer(this.camera)
        }

        renderBoardState(forceCalculate: boolean) {
            if (!forceCalculate) {
                this.see.drawImage(this.snapshot.element, 0, 0)
                return
            }

            const currentLevel = this.levelManager.getCurrent()
            const screen = this.camera.getScreenCoordinates()

            this.bodyRenderer.notifyNewFrame(screen, this.snapshot.context)
            var bodies = currentLevel.getBodies()
            var playerBody = this.playerBodyGetter()

            for (var iBody = 0; iBody < bodies.length; iBody++) {
                var body = bodies[iBody]
                for (const drawable of body.drawables) {
                    if (typeof drawable.prepareForRender === "function") {
                        drawable.prepareForRender()
                    }
                }
                this.bodyRenderer.feedBody(body, body === playerBody)
                if (body.shadow) {
                    var shadow = new splitTime.body.Shadow(body)
                    shadow.prepareForRender()
                    this.bodyRenderer.feedBody(shadow.shadowBody, false)
                }
            }

            //Rendering sequence
            // buffer.context.clearRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
            this.snapshot.context.clearRect(
                0,
                0,
                this.SCREEN_WIDTH,
                this.SCREEN_HEIGHT
            )

            this.bodyRenderer.render()
            this.snapshot.context.globalAlpha = 1

            this.snapshot.context.globalCompositeOperation = "destination-over"
            this.drawBackground(this.snapshot.context, screen, currentLevel)
            this.snapshot.context.globalCompositeOperation = "source-over"

            if (splitTime.debug.ENABLED && splitTime.debug.DRAW_TRACES) {
                const backShift = this.getBackShift(screen)
                this.snapshot.context.globalAlpha = 0.5
                this.snapshot.context.drawImage(
                    currentLevel.getDebugTraceCanvas().element,
                    screen.x + backShift.x,
                    screen.y + backShift.y,
                    this.SCREEN_WIDTH - 2 * backShift.x,
                    this.SCREEN_HEIGHT - 2 * backShift.y,
                    backShift.x,
                    backShift.y,
                    this.SCREEN_WIDTH - 2 * backShift.x,
                    this.SCREEN_HEIGHT - 2 * backShift.y
                )
                this.snapshot.context.globalAlpha = 1
            }

            this.weatherRenderer.render(currentLevel, this.snapshot.context)
            // Note: this single call on a perform test is a huge percentage of CPU usage.
            // TODO: Why? Can we improve rendering performance?
            this.buffer.context.drawImage(this.snapshot.element, 0, 0)

            //If we need to fade the screen out
            if(this.fadingOut) {
                // We have this separate so that the final draw call finishes first
                if (this.fadeOutAmount >= this.fadeToTransparency) {
                    this.fadingOut = false
                    this.fadeOutPromise.resolve()
                }

                this.fadeOutAmount += this.FADE_INCREMENT
                if (this.fadeOutAmount >= this.fadeToTransparency) {
                    this.fadeOutAmount = this.fadeToTransparency
                }
            } else if (this.fadeInAmount > 0) {  //If we need to fade back in
                this.fadeInAmount -= this.FADE_INCREMENT
                
                //If we are now done fading in
                if (this.fadeInAmount <= 0) {
                    this.fadeInAmount = 0
                    this.fadeInPromise.resolve()
                }
            }

            //Draw the (semi-)transparent rectangle for fading in/out
            this.buffer.context.fillStyle = this.fadeToColor.toRgbaString()
            this.buffer.context.globalAlpha = this.fadeOutAmount + this.fadeInAmount
            this.buffer.context.fillRect(
                0,
                0,
                this.SCREEN_WIDTH,
                this.SCREEN_HEIGHT
            )

            //Save screen into snapshot
            this.see.drawImage(this.buffer.element, 0, 0)

            // reset global alpha
            this.buffer.context.globalAlpha = 1

            for (const body of bodies) {
                for (const drawable of body.drawables) {
                    if (
                        typeof drawable.cleanupAfterRender === "function"
                    ) {
                        drawable.cleanupAfterRender()
                    }
                }
                // TODO: maybe cleanup shadows?
            }
        }

        private getBackShift(screen: Coordinates2D): Coordinates2D {
            //Work out details of smaller-than-screen dimensions
            var xBackShift, yBackShift
            if (screen.x < 0) xBackShift = -screen.x
            else xBackShift = 0
            if (screen.y < 0) yBackShift = -screen.y
            else yBackShift = 0
            return new Coordinates2D(xBackShift, yBackShift)
        }

        private drawBackground(ctx: GenericCanvasRenderingContext2D, screen: Coordinates2D, currentLevel: Level): void {
            const backShift = this.getBackShift(screen)

            if (currentLevel.getBackgroundImage()) {
                ctx.drawImage(
                    G.ASSETS.images.get(currentLevel.getBackgroundImage()),
                    screen.x + backShift.x - currentLevel.backgroundOffsetX,
                    screen.y + backShift.y - currentLevel.backgroundOffsetY,
                    this.SCREEN_WIDTH - 2 * backShift.x,
                    this.SCREEN_HEIGHT - 2 * backShift.y,
                    backShift.x,
                    backShift.y,
                    this.SCREEN_WIDTH - 2 * backShift.x,
                    this.SCREEN_HEIGHT - 2 * backShift.y
                )
            }

            // Fill in the rest of the background with black (mainly for the case of board being smaller than the screen)
            ctx.fillStyle = "#000000"
            ctx.fillRect(
                0,
                0,
                this.SCREEN_WIDTH,
                this.SCREEN_HEIGHT
            )
        }

        isAlreadyFaded(): boolean {
            return this.fadeOutAmount > 0
        }

        /**
         * Fades the screen gradually to the target color (defaults to black if no parameters are passed)
         * 
         * @param fadeToColor - the color that we want to fade to
         */
        fadeTo(color?: splitTime.light.Color): PromiseLike<void> {
            if (color !== undefined){
                this.fadeToColor.r = color.r
                this.fadeToColor.g = color.g
                this.fadeToColor.b = color.b
                this.fadeToTransparency = color.a
            }
            this.fadingOut = true
            this.fadeOutPromise = new splitTime.Pledge()
            return this.fadeOutPromise
        }

        /**
         * Switch from fading out to fading in
         */
        fadeIn(): PromiseLike<void> {
            this.fadeInAmount = this.fadeToTransparency
            this.fadeOutAmount = 0
            this.fadeInPromise = new splitTime.Pledge()
            return this.fadeInPromise
        }
    }
}
