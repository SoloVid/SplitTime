namespace splitTime {
    export const FPS = 60

    function mainGameLoop(gameLoop: GameLoop, timeStamp: number) {
        const timeStampDelta = timeStamp - gameLoop.lastTimeStamp
        gameLoop.lastTimeStamp = timeStamp
        const isRunning = gameLoop.isRunning()
        const perspective = gameLoop.perspective
        const startTime = performance.now()

        if (isRunning) {
            try {
                mainGameLoopBody(gameLoop, timeStampDelta)
            } catch (ex) {
                console.error(ex)
            }
        }

        const endTime = performance.now()
        const msElapsed = endTime - startTime

        const msPerFrame = timeStampDelta
        const displayFPS = Math.round(1000 / msPerFrame)
        scheduleNextLoop(gameLoop)

        if (isRunning) {
            splitTime.debug.setDebugValue("FPS", displayFPS)

            if (splitTime.debug.ENABLED) {
                splitTime.debug.renderCanvas(perspective.view)
            }
        }
    }

    function scheduleNextLoop(gameLoop: GameLoop) {
        requestAnimationFrame(timeStamp => mainGameLoop(gameLoop, timeStamp))
    }

    function mainGameLoopBody(g: GameLoop, msElapsed: number) {
        const perspective = g.perspective
        const isCurrentLevelSet = perspective.levelManager.isCurrentSet()
        g.performanceCheckpoint("start loop", 999999)

        const secondsForFrame = Math.min(msElapsed / 1000, 1 / splitTime.FPS)
        const budget = new FrameBudget(1000 * secondsForFrame)

        g.notifyListenersFrameUpdate(secondsForFrame)
        g.performanceCheckpoint("notify listeners of update", budget.takePart(0.05))

        if (isCurrentLevelSet && !perspective.levelManager.isTransitioning()) {
            const level = perspective.levelManager.getCurrent()
            const region = level.getRegion()
            const timeline = region.getTimeline()

            timeline.notifyFrameUpdate(secondsForFrame)
            g.performanceCheckpoint("timeline frame update", budget.takePart(0.4))

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
        }

        //Initiate level transition if applicable
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
        }

        if (isCurrentLevelSet) {
            perspective.camera.notifyFrameUpdate(secondsForFrame)
            perspective.worldRenderer.renderBoardState(true)
            g.performanceCheckpoint("world state render", budget.takePart(0.4))
        }

        if (perspective.hud) {
            perspective.hud.render(perspective.view)
            g.performanceCheckpoint("render HUD", budget.takePart(0.05))
        }
    }

    export class GameLoop {
        lastTimeStamp: number = 0
        private running: boolean = false
        private listeners: (FrameNotified | ((seconds: number) => void))[] = []

        constructor(public readonly perspective: Perspective) {
            Promise.resolve().then(() => mainGameLoop(this, 0))
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

        private lastPerformanceCheck: number | null = null

        performanceCheckpoint(debugName: string, allowMs = 5) {
            if (splitTime.debug.ENABLED) {
                const now = performance.now()
                if (this.lastPerformanceCheck) {
                    var timePassed =
                        now - this.lastPerformanceCheck
                    if (timePassed > allowMs) {
                        splitTime.log.warn(
                            debugName +
                                ": " +
                                timePassed.toFixed(2) +
                                "ms taken when " +
                                allowMs.toFixed(2) +
                                "ms allotted"
                        )
                    }
                }
                this.lastPerformanceCheck = now
            }
        }
    }

    class FrameBudget {
        private msLeft: number
        constructor(
            private readonly totalMs: number
        ) {
            this.msLeft = totalMs
        }

        takeMs(ms: number): number {
            this.msLeft -= ms
            if (this.msLeft < 0) {
                log.error("FrameBudget time overspent")
            } else if (this.msLeft < 0.1) {
                log.warn("FrameBudget time cutting it close")
            }
            return ms
        }

        takePart(fraction: number): number {
            const ms = fraction * this.totalMs
            return this.takeMs(ms)
        }
    }
}
