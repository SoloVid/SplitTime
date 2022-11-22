import { Perspective } from "./perspective";
import { FrameNotified } from "./time/frame-notified";
import { setDebugValue, ENABLED, renderCanvas, defaultGroup } from "./utils/debug";
import { warn, error } from "./utils/logger";

function mainGameLoop(gameLoop: GameLoop, timeStamp: number) {
    const timeStampDelta = timeStamp - gameLoop.lastTimeStamp;
    gameLoop.lastTimeStamp = timeStamp;
    const isRunning = gameLoop.isRunning();
    const perspective = gameLoop.perspective;
    const startTime = performance.now();
    if (isRunning) {
        try {
            mainGameLoopBody(gameLoop, timeStampDelta);
        }
        catch (ex) {
            console.error(ex);
        }
        const endTime = performance.now();
        const msElapsed = endTime - startTime;
        const msPerFrame = timeStampDelta;
        const displayFPS = Math.round(1000 / msPerFrame);
        setDebugValue(defaultGroup, "FPS", displayFPS);
        if (ENABLED) {
            renderCanvas(perspective.view);
        }
    }
    scheduleNextLoop(gameLoop);
}
function scheduleNextLoop(gameLoop: GameLoop) {
    requestAnimationFrame(timeStamp => mainGameLoop(gameLoop, timeStamp));
}
function mainGameLoopBody(g: GameLoop, msElapsed: number) {
    const perspective = g.perspective;
    const isCurrentLevelSet = perspective.levelManager.isCurrentSet();
    g.performanceCheckpoint("start loop", 999999);
    // The max here prevents moving too far forward in a single game frame if we have a hiccup
    // (e.g. browser hibernating the game loop).
    const minFPS = 30;
    const maxSecondsPerFrame = 1 / minFPS;
    const secondsForFrame = Math.min(msElapsed / 1000, maxSecondsPerFrame);
    const budget = new FrameBudget(1000 * secondsForFrame);
    g.notifyListenersFrameUpdate(secondsForFrame);
    g.performanceCheckpoint("notify listeners of update", budget.takePart(0.05));
    if (isCurrentLevelSet && !perspective.levelManager.isTransitioning()) {
        const level = perspective.levelManager.getCurrent();
        const region = level.getRegion();
        const timeline = region.getTimeline();
        timeline.notifyFrameUpdate(secondsForFrame);
        g.performanceCheckpoint("timeline frame update", budget.takePart(0.4));
        setDebugValue(defaultGroup, "Board Bodies", perspective.levelManager.getCurrent().bodies.length);
        setDebugValue(defaultGroup, "Focus point", Math.round(perspective.camera.getFocusPoint().x) +
            "," +
            Math.round(perspective.camera.getFocusPoint().y) +
            "," +
            Math.round(perspective.camera.getFocusPoint().z));
    }
    //Initiate level transition if applicable
    if (!perspective.levelManager.isTransitioning() &&
        perspective.playerBody &&
        (!isCurrentLevelSet ||
            perspective.playerBody.getLevel() !==
                perspective.levelManager.getCurrent())) {
        perspective.levelManager.transition(perspective.playerBody.getLevel());
        g.performanceCheckpoint("level transition", 10);
    }
    if (isCurrentLevelSet) {
        perspective.camera.notifyFrameUpdate(secondsForFrame);
        perspective.worldRenderer.renderBoardState(true);
        g.performanceCheckpoint("world state render", budget.takePart(0.4));
    }
    if (perspective.hud) {
        perspective.hud.render(perspective.view);
        g.performanceCheckpoint("render HUD", budget.takePart(0.05));
    }
}
export class GameLoop {
    lastTimeStamp: number = 0;
    private running: boolean = false;
    private stopOnNext: boolean = false;
    private listeners: (FrameNotified | ((seconds: number) => void))[] = [];
    constructor(public readonly perspective: Perspective) {
        Promise.resolve().then(() => mainGameLoop(this, 0));
    }
    start() {
        this.running = true;
    }
    stop() {
        this.running = false;
    }
    step() {
        this.stopOnNext = true;
        this.running = true;
    }
    onFrameUpdate(listener: FrameNotified | ((seconds: number) => void)) {
        this.listeners.push(listener);
    }
    notifyListenersFrameUpdate(seconds: number) {
        if (this.stopOnNext) {
            this.stopOnNext = false;
            this.running = false;
        }
        for (const listener of this.listeners) {
            if (typeof listener === "function") {
                listener(seconds);
            }
            else {
                listener.notifyFrameUpdate(seconds);
            }
        }
    }
    isRunning() {
        return this.running;
    }
    private lastPerformanceCheck: number | null = null;
    performanceCheckpoint(debugName: string, allowMs = 5) {
        if (ENABLED) {
            const now = performance.now();
            if (this.lastPerformanceCheck) {
                var timePassed = now - this.lastPerformanceCheck;
                const enabled = false;
                if (timePassed > allowMs && enabled) {
                    warn(debugName +
                        ": " +
                        timePassed.toFixed(2) +
                        "ms taken when " +
                        allowMs.toFixed(2) +
                        "ms allotted");
                }
            }
            this.lastPerformanceCheck = now;
        }
    }
}
class FrameBudget {
    private msLeft: number;
    constructor(private readonly totalMs: number) {
        this.msLeft = totalMs;
    }
    takeMs(ms: number): number {
        this.msLeft -= ms;
        if (this.msLeft < 0) {
            error("FrameBudget time overspent");
        }
        else if (this.msLeft < 0.1) {
            warn("FrameBudget time cutting it close");
        }
        return ms;
    }
    takePart(fraction: number): number {
        const ms = fraction * this.totalMs;
        return this.takeMs(ms);
    }
}
