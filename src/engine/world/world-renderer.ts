namespace splitTime {
    type level_getter = () => Level
    type body_getter = () => Body | null

    export class WorldRenderer {
        private SCREEN_WIDTH: int
        private SCREEN_HEIGHT: int

        private buffer: splitTime.Canvas
        private snapshot: splitTime.Canvas

        private readonly bodyRenderer: body.Renderer
        private readonly weatherRenderer: WeatherRenderer
        
        private fadingOut: boolean
        private fadeOutAmount: number
        private fadeInAmount: number
        private readonly FADE_INCREMENT: number
        private fadeToRGB: string
        private fadeToTransparency: number
        private fadeOutPromise: splitTime.Pledge
        private fadeInPromise: splitTime.Pledge
        private see: GenericCanvasRenderingContext2D

        constructor(
            private readonly camera: Camera,
            private readonly view: splitTime.ui.View,
            private readonly levelManager: LevelManager,
            private readonly playerBodyGetter: body_getter
        ) {
            this.see = view.see

            this.SCREEN_WIDTH = camera.SCREEN_WIDTH
            this.SCREEN_HEIGHT = camera.SCREEN_HEIGHT

            this.fadingOut = false
            this.fadeOutAmount = 0
            this.fadeInAmount = 0
            this.FADE_INCREMENT = 0.05
            this.fadeToRGB = "0,0,0"
            this.fadeToTransparency = 0
            this.fadeInPromise = new splitTime.Pledge()
            this.fadeOutPromise = new splitTime.Pledge()

            this.buffer = new splitTime.Canvas(this.SCREEN_WIDTH, this.SCREEN_HEIGHT)
            this.snapshot = new splitTime.Canvas(
                this.SCREEN_WIDTH,
                this.SCREEN_HEIGHT
            )

            this.bodyRenderer = new body.Renderer(this.camera)
            this.weatherRenderer = new WeatherRenderer(this.camera, this.view)
        }

        renderBoardState(forceCalculate: boolean) {
            if (!forceCalculate) {
                this.see.drawImage(this.snapshot.element, 0, 0)
                return
            }

            const currentLevel = this.levelManager.getCurrent()
            if (!currentLevel) {
                throw new Error("currentLevel is not initialized")
            }

            const screen = this.camera.getScreenCoordinates()

            this.bodyRenderer.notifyNewFrame(screen, this.snapshot.context)
            var bodies = currentLevel.getBodies()
            var playerBody = this.playerBodyGetter()

            for (var iBody = 0; iBody < bodies.length; iBody++) {
                var body = bodies[iBody]
                this.bodyRenderer.feedBody(body, body === playerBody)
                if (body.drawable) {
                    if (typeof body.drawable.prepareForRender === "function") {
                        body.drawable.prepareForRender()
                    }
                }
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

            //Work out details of smaller-than-screen dimensions
            var xBackShift, yBackShift
            if (screen.x < 0) xBackShift = -screen.x
            else xBackShift = 0
            if (screen.y < 0) yBackShift = -screen.y
            else yBackShift = 0

            this.snapshot.context.globalCompositeOperation = "destination-over"

            if (currentLevel.getBackgroundImage()) {
                //Note: this single call on a perform test is a huge percentage of CPU usage.
                this.snapshot.context.drawImage(
                    G.ASSETS.images.get(currentLevel.getBackgroundImage()),
                    screen.x + xBackShift - currentLevel.backgroundOffsetX,
                    screen.y + yBackShift - currentLevel.backgroundOffsetY,
                    this.SCREEN_WIDTH - 2 * xBackShift,
                    this.SCREEN_HEIGHT - 2 * yBackShift,
                    xBackShift,
                    yBackShift,
                    this.SCREEN_WIDTH - 2 * xBackShift,
                    this.SCREEN_HEIGHT - 2 * yBackShift
                )
            }

            // Fill in the rest of the background with black (mainly for the case of board being smaller than the screen)
            this.snapshot.context.fillStyle = "#000000"
            this.snapshot.context.fillRect(
                0,
                0,
                this.SCREEN_WIDTH,
                this.SCREEN_HEIGHT
            )

            this.snapshot.context.globalCompositeOperation = "source-over"

            if (splitTime.debug.ENABLED && splitTime.debug.DRAW_TRACES) {
                this.snapshot.context.globalAlpha = 0.5
                this.snapshot.context.drawImage(
                    currentLevel.getDebugTraceCanvas().element,
                    screen.x + xBackShift,
                    screen.y + yBackShift,
                    this.SCREEN_WIDTH - 2 * xBackShift,
                    this.SCREEN_HEIGHT - 2 * yBackShift,
                    xBackShift,
                    yBackShift,
                    this.SCREEN_WIDTH - 2 * xBackShift,
                    this.SCREEN_HEIGHT - 2 * yBackShift
                )
                this.snapshot.context.globalAlpha = 1
            }

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

            this.weatherRenderer.render(currentLevel, this.snapshot.context)
            this.buffer.context.drawImage(this.snapshot.element, 0, 0)

            //Draw the (semi-)transparent rectangle for fading in/out
            var transparencyValue = this.fadeOutAmount + this.fadeInAmount
            this.buffer.context.fillStyle = "rgba(" + this.fadeToRGB + "," + transparencyValue + ")"
            this.buffer.context.fillRect(
                0,
                0,
                this.SCREEN_WIDTH,
                this.SCREEN_HEIGHT
            )
            
            //Save screen into snapshot
            this.see.drawImage(this.buffer.element, 0, 0)

            for (const body of bodies) {
                const drawable = body.drawable
                if (
                    drawable &&
                    typeof drawable.cleanupAfterRender === "function"
                ) {
                    drawable.cleanupAfterRender()
                }
                // TODO: maybe cleanup shadows?
            }
        }

        isAlreadyFaded(): boolean {
            return this.fadeOutAmount > 0
        }

        /**
         * Fades the screen gradually to the target color (defaults to black if no parameters are passed)
         * 
         * @param r - r value of the target color (default: 0)
         * @param g - g value of the target color (default: 0)
         * @param b - b value of the target color (default: 0)
         * @param transparency - target transparency value (defaults to 1)
         */
        fadeTo(r: number = 0, g: number = 0, b: number = 0, transparency: number = 1): PromiseLike<void> {
            //TODO: check to make sure the target rgba value is valid
            this.fadeToRGB = "" + r + "," + g + "," + b
            this.fadeToTransparency = transparency
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
