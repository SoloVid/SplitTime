import { TimeNotified, game_seconds } from "../splitTime";
import { Behavior } from "./behavior";
import { ConditionalBehavior, isBehaviorConditionMet } from "./conditional-behavior";
export class BehaviorStateMachine implements TimeNotified, Behavior, ConditionalBehavior {
    private readonly behaviorMap: {
        [state: string]: Behavior | undefined;
    } = {};
    private lastState: string | null = null;
    constructor(private readonly getState: () => string) { }
    isConditionMet(): boolean {
        const behavior = this.getBehavior();
        if (behavior === null) {
            return false;
        }
        return isBehaviorConditionMet(behavior);
    }
    notifySuspension(): void {
        if (this.lastState !== null) {
            this.behaviorMap[this.lastState]?.notifySuspension?.();
        }
        this.lastState = null;
    }
    notifyTimeAdvance(delta: game_seconds): void {
        const lastState = this.lastState;
        this.lastState = null;
        const behavior = this.getBehavior();
        if (behavior === null) {
            return;
        }
        if (lastState !== null && lastState !== this.getState()) {
            this.behaviorMap[lastState]?.notifySuspension?.();
        }
        if (isBehaviorConditionMet(behavior)) {
            this.lastState = this.getState();
            behavior.notifyTimeAdvance(delta);
        }
    }
    set(state: string, behavior: Behavior | ConditionalBehavior): void {
        this.behaviorMap[state] = behavior;
    }
    private getBehavior(): Behavior | null {
        const state = this.getState();
        return this.behaviorMap[state] || null;
    }
}
