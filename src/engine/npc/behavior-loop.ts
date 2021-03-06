namespace splitTime.npc {
    export class BehaviorLoop implements Behavior {
        private baseBehavior: TemporaryBehavior
        constructor(
            private readonly baseBehaviorCreator: () => TemporaryBehavior
        ) {
            this.baseBehavior = baseBehaviorCreator()
        }

        notifySuspension(): void {
            this.baseBehavior.notifySuspension?.()
        }

        notifyTimeAdvance(delta: game_seconds): void {
            this.baseBehavior.notifyTimeAdvance(delta)
            if (this.baseBehavior.isComplete()) {
                this.baseBehavior = this.baseBehaviorCreator()
            }
        }
    }
}