namespace splitTime.npc {
    export class ExtraConditionalBehavior implements ConditionalBehavior {
        constructor(
            private readonly baseBehavior: Behavior,
            private readonly conditionChecker: () => boolean
        ) {}

        isConditionMet(): boolean {
            return this.conditionChecker() && isBehaviorConditionMet(this.baseBehavior)
        }

        notifySuspension(): void {
            this.baseBehavior.notifySuspension?.()
        }

        notifyTimeAdvance(delta: game_seconds): void {
            this.baseBehavior.notifyTimeAdvance(delta)
        }
    }
}