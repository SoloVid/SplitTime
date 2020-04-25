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

        constructor(
            private readonly camera: Camera,
            private readonly see: GenericCanvasRenderingContext2D,
            private readonly currentLevelGetter: level_getter,
            private readonly playerBodyGetter: body_getter
        ) {
            this.SCREEN_WIDTH = camera.SCREEN_WIDTH
            this.SCREEN_HEIGHT = camera.SCREEN_HEIGHT

            this.buffer = new splitTime.Canvas(this.SCREEN_WIDTH, this.SCREEN_HEIGHT)
            this.snapshot = new splitTime.Canvas(
                this.SCREEN_WIDTH,
                this.SCREEN_HEIGHT
            )

            this.bodyRenderer = new body.Renderer(this.camera)
            this.weatherRenderer = new WeatherRenderer(this.camera, this.buffer.context)
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
            const playerBody = this.playerBodyGetter()

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

            // if(splitTime.process == "TRPG")
            // {
            // 	//Draw blue range squares
            // 	if(index == splitTime.cTeam[splitTime.currentPlayer].z && splitTime.cTeam[splitTime.currentPlayer].squares)
            // 	{
            // 		for(second = 0; second < splitTime.cTeam[splitTime.currentPlayer].squares.length; second++)
            // 		{
            // 			splitTime.see.fillStyle = "rgba(0, 100, 255, .5)";
            // 			splitTime.see.fillRect(splitTime.cTeam[splitTime.currentPlayer].squares[second].x*32 - splitTime.wX, splitTime.cTeam[splitTime.currentPlayer].squares[second].y*32 - splitTime.wY, 32, 32);
            // 			//splitTime.see.drawImage(splitTime.image.get("blueSquare.png"), 0, 0, 32, 32, splitTime.cTeam[splitTime.currentPlayer].squares[second].x*32 - splitTime.wX, splitTime.cTeam[splitTime.currentPlayer].squares[second].y*32 - splitTime.wY, 32, 32);
            // 		}
            // 	}
            // }

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
                    screen.x + xBackShift,
                    screen.y + yBackShift,
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
                    currentLevel.getDebugTraceCanvas(),
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

            this.buffer.context.drawImage(this.snapshot.element, 0, 0)

            this.weatherRenderer.render(currentLevel)

            //Display current splitTime.player stats
            // splitTime.see.fillStyle="#FFFFFF";
            // splitTime.see.font="12px Verdana";
            // splitTime.see.fillText(splitTime.player[splitTime.currentPlayer].name + ": " + splitTime.player[splitTime.currentPlayer].hp + " HP | " + splitTime.player[splitTime.currentPlayer].strg + " Strength | " + splitTime.player[splitTime.currentPlayer].spd + " Agility", 10, 20);
            //
            // splitTime.Timeline.renderClock(splitTime.see); //in time.js

            //Save screen into snapshot
            this.see.drawImage(this.buffer.element, 0, 0)
            this.snapshot.context.drawImage(this.buffer.element, 0, 0)

            for (iBody = 0; iBody < bodies.length; iBody++) {
                var drawable = bodies[iBody].drawable
                if (
                    drawable &&
                    typeof drawable.cleanupAfterRender === "function"
                ) {
                    drawable.cleanupAfterRender()
                }
                // TODO: maybe cleanup shadows?
            }
        }
    }
}
