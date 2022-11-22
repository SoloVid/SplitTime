import { game_seconds } from "engine/time/timeline";
import { TemporaryBehavior } from "./temporary-behavior";
export class InstantBehavior implements TemporaryBehavior {
    private done = false;
    constructor(private readonly callback: () => void) { }
    isComplete(): boolean {
        return this.done;
    }
    notifyTimeAdvance(delta: game_seconds): void {
        if (!this.done) {
            this.callback();
            this.done = true;
        }
    }
}
