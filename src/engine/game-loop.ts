namespace splitTime {
    export const FPS = 60

    function mainGameLoop(gameLoop: GameLoop) {
        const isRunning = gameLoop.isRunning()
        const perspective = gameLoop.perspective
        const startTime = new Date().getTime()

        if (isRunning) {
            try {
                mainGameLoopBody(gameLoop)
            } catch (ex) {
                console.error(ex)
            }
        }

        const endTime = new Date().getTime()
        const msElapsed = endTime - startTime

        var displayFPS = FPS
        const msPerFrame = (1 / FPS) * 1000
        if (msElapsed < msPerFrame) {
            scheduleNextLoop(msPerFrame - msElapsed, gameLoop)
        } else {
            scheduleNextLoop(2, gameLoop) //give browser a quick breath
            var secondsElapsed = msElapsed / 1000
            displayFPS = Math.round(1 / secondsElapsed)
        }

        if (isRunning) {
            splitTime.debug.setDebugValue("FPS", displayFPS)

            if (splitTime.debug.ENABLED) {
                splitTime.debug.renderCanvas(perspective.view)
            }
        }
    }

    function scheduleNextLoop(ms: number, gameLoop: GameLoop) {
        setTimeout(mainGameLoop, ms, gameLoop)
    }

    function mainGameLoopBody(g: GameLoop) {
        const perspective = g.perspective
        g.performanceCheckpoint("start loop", 999999)

        //Initiate level transition if applicable
        const isCurrentLevelSet = perspective.levelManager.isCurrentSet()
        if (
            !perspective.levelManager.isTransitioning() &&
            perspective.playerBody &&
            (!isCurrentLevelSet ||
                perspective.playerBody.getLevel() !==
                    perspective.levelManager.getCurrent())
        ) {
            perspective.levelManager.transition(
                perspective.playerBody.getLevel()
            )
            g.performanceCheckpoint("level transition", 10)
            
            // FTODO: don't skip rest of frame
            return
        }

        const secondsForFrame = 1 / splitTime.FPS

        if (isCurrentLevelSet) {
            const level = perspective.levelManager.getCurrent()
            const region = level.getRegion()
            const timeline = region.getTimeline()

            timeline.notifyFrameUpdate(secondsForFrame)
            g.performanceCheckpoint("timeline frame update")

            region.notifyFrameUpdate(secondsForFrame)
            g.performanceCheckpoint("region frame update")

            g.notifyListenersFrameUpdate(secondsForFrame)
            g.performanceCheckpoint("notify listeners of update")

            splitTime.debug.setDebugValue(
                "Board Bodies",
                perspective.levelManager.getCurrent().bodies.length
            )
            splitTime.debug.setDebugValue(
                "Focus point",
                Math.round(perspective.camera.getFocusPoint().x) +
                    "," +
                    Math.round(perspective.camera.getFocusPoint().y) +
                    "," +
                    Math.round(perspective.camera.getFocusPoint().z)
            )

            perspective.camera.notifyFrameUpdate(secondsForFrame)
            perspective.worldRenderer.renderBoardState(true)
            g.performanceCheckpoint("world state render")
        }

        if (perspective.hud) {
            perspective.hud.render(perspective.view)
            g.performanceCheckpoint("render HUD")
        }
    }

    export class GameLoop {
        private running: boolean = false
        private listeners: (FrameNotified | ((seconds: number) => void))[] = []

        constructor(public readonly perspective: Perspective) {
            Promise.resolve().then(() => mainGameLoop(this))
        }

        start() {
            this.running = true
        }

        stop() {
            this.running = false
        }

        onFrameUpdate(listener: FrameNotified | ((seconds: number) => void)) {
            this.listeners.push(listener)
        }

        notifyListenersFrameUpdate(seconds: number) {
            for (const listener of this.listeners) {
                if (typeof listener === "function") {
                    listener(seconds)
                } else {
                    listener.notifyFrameUpdate(seconds)
                }
            }
        }

        isRunning() {
            return this.running
        }

        private lastPerformanceCheck: Date | null = null

        performanceCheckpoint(debugName: string, allow = 5) {
            if (splitTime.debug.ENABLED) {
                var now = new Date()
                if (this.lastPerformanceCheck) {
                    var timePassed =
                        now.getMilliseconds() -
                        this.lastPerformanceCheck.getMilliseconds()
                    if (timePassed > allow) {
                        splitTime.log.warn(
                            debugName +
                                ": " +
                                timePassed +
                                "ms taken when " +
                                allow +
                                "ms allotted"
                        )
                    }
                }
                this.lastPerformanceCheck = now
            }
        }
    }
}
