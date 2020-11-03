namespace splitTime.npc {
    export class BehaviorParallel implements TimeNotified, Behavior, TemporaryBehavior, ConditionalBehavior {

        constructor(
            private readonly behaviors: (Behavior | TemporaryBehavior | ConditionalBehavior)[]
        ) {}

        isComplete(): boolean {
            for (const b of this.behaviors) {
                if (!isBehaviorComplete(b)) {
                    return false
                }
            }
            return true
        }

        isConditionMet(): boolean {
            for (const b of this.behaviors) {
                if (isBehaviorConditionMet(b)) {
                    return true
                }
            }
            return false
        }

        notifySuspension(): void {
            for (const b of this.behaviors) {
                b.notifySuspension?.()
            }
        }

        notifyTimeAdvance(delta: game_seconds): void {
            for (const b of this.behaviors) {
                if (isBehaviorConditionMet(b)) {
                    b.notifyTimeAdvance(delta)
                }
            }
        }
    }
}