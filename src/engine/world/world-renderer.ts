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
        
        private fadeOutAmount: number
        private fadeInAmount: number
        private readonly FADE_INCREMENT: number

        constructor(
            private readonly camera: Camera,
            private readonly see: GenericCanvasRenderingContext2D,
            private readonly currentLevelGetter: level_getter,
            private readonly playerBodyGetter: body_getter
        ) {
            this.SCREEN_WIDTH = camera.SCREEN_WIDTH
            this.SCREEN_HEIGHT = camera.SCREEN_HEIGHT

            this.fadeOutAmount = 0
            this.fadeInAmount = 0
            this.FADE_INCREMENT = 0.1

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

            const currentLevel = this.currentLevelGetter()
            if (!currentLevel) {
                throw new Error("currentLevel is not initialized")
            }

            const screen = this.camera.getScreenCoordinates()

            //Black out screen (mainly for the case of board being smaller than the screen)
            this.buffer.context.fillStyle = "#000000"
            this.buffer.context.fillRect(
                0,
                0,
                this.SCREEN_WIDTH,
                this.SCREEN_HEIGHT
            )

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
                    screen.x + xBackShift + currentLevel.backgroundOffsetX,
                    screen.y + yBackShift + currentLevel.backgroundOffsetY,
                    this.SCREEN_WIDTH - 2 * xBackShift,
                    this.SCREEN_HEIGHT - 2 * yBackShift,
                    xBackShift,
                    yBackShift,
                    this.SCREEN_WIDTH - 2 * xBackShift,
                    this.SCREEN_HEIGHT - 2 * yBackShift
                )
            }

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

            //If the active player is switching regions  
            if(playerBody?.inRegionTransition) {
                //Fade to white
                if (this.fadeOutAmount < 1) {
                    this.fadeOutAmount += this.FADE_INCREMENT
                } else {
                    playerBody.inRegionTransition = false
                    playerBody.finishRegionTransition()

                    //Switch from fading out to fading in
                    this.fadeInAmount = 1
                    this.fadeOutAmount = 0
                }
            } else if (this.fadeInAmount > 0) {
                //Continue fading in
                this.fadeInAmount -= this.FADE_INCREMENT
            }

            this.weatherRenderer.render(currentLevel, this.snapshot.context)

            this.buffer.context.drawImage(this.snapshot.element, 0, 0)

            //Draw the (semi-)transparent rectangle for fading in/out
            var transparencyValue = this.fadeOutAmount + this.fadeInAmount
            this.buffer.context.fillStyle = "rgba(255,255,255," + transparencyValue + ")"
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

        fadeTo(color: string = "rgba(0, 0, 0, 1)"): PromiseLike<void> {
            log.warn("TODO: fade here")
            return getPlaceholderPledge()
        }

        fadeIn(): PromiseLike<void> {
            log.warn("TODO: fade in (if not already faded in)")
            return getPlaceholderPledge()
        }
    }
}
