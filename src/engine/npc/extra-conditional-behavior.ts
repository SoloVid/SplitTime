import { ConditionalBehavior, isBehaviorConditionMet } from "./conditional-behavior";
import { Behavior } from "./behavior";
import { game_seconds } from "engine/time/timeline";
export class ExtraConditionalBehavior implements ConditionalBehavior {
    constructor(private readonly baseBehavior: Behavior, private readonly conditionChecker: () => boolean) { }
    isConditionMet(): boolean {
        return this.conditionChecker() && isBehaviorConditionMet(this.baseBehavior);
    }
    notifySuspension(): void {
        this.baseBehavior.notifySuspension?.();
    }
    notifyTimeAdvance(delta: game_seconds): void {
        this.baseBehavior.notifyTimeAdvance(delta);
    }
}
