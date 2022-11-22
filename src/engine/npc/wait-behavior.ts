import { game_seconds } from "engine/time/timeline";
import { Behavior } from "./behavior";
import { TemporaryBehavior } from "./temporary-behavior";
export class WaitBehavior implements Behavior, TemporaryBehavior {
    private timeSoFar: game_seconds = 0;
    constructor(private readonly totalTime: game_seconds, private readonly restartOnSuspend: boolean = false) { }
    isComplete(): boolean {
        return this.timeSoFar >= this.totalTime;
    }
    notifySuspension(): void {
        if (this.restartOnSuspend) {
            this.timeSoFar = 0;
        }
    }
    notifyTimeAdvance(delta: number): void {
        this.timeSoFar += delta;
    }
}
