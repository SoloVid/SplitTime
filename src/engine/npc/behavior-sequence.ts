import { game_seconds } from "engine/time/timeline";
import { int } from "globals";
import { TemporaryBehavior } from "./temporary-behavior";
export class BehaviorSequence implements TemporaryBehavior {
    private currentBehaviorIndex: int = 0;
    constructor(private readonly behaviors: readonly TemporaryBehavior[]) { }
    isComplete(): boolean {
        return this.currentBehaviorIndex >= this.behaviors.length;
    }
    notifySuspension(): void {
        if (this.isComplete()) {
            return;
        }
        this.currentBehavior.notifySuspension?.();
        this.checkAdvance();
    }
    notifyTimeAdvance(delta: game_seconds): void {
        if (this.isComplete()) {
            return;
        }
        this.currentBehavior.notifyTimeAdvance(delta);
        this.checkAdvance();
    }
    private get currentBehavior(): TemporaryBehavior {
        if (this.isComplete()) {
            throw new Error("BehaviorSequence invoked after completion");
        }
        return this.behaviors[this.currentBehaviorIndex];
    }
    private checkAdvance(): void {
        if (this.currentBehavior.isComplete()) {
            this.currentBehaviorIndex++;
        }
    }
}
