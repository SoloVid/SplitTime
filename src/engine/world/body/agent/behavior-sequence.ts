namespace splitTime.npc {
    export class BehaviorSequence implements Behavior {

        private currentBehaviorIndex: int = 0

        constructor(
            private readonly behaviors: readonly Behavior[]
        ) {}

        isComplete(): boolean {
            return this.currentBehaviorIndex >= this.behaviors.length
        }

        notifySuspension(): void {
            this.currentBehavior.notifySuspension()
            this.checkAdvance()
        }

        notifyTimeAdvance(delta: game_seconds): void {
            this.currentBehavior.notifyTimeAdvance(delta)
            this.checkAdvance()
        }

        private get currentBehavior(): Behavior {
            if (this.isComplete()) {
                throw new Error("BehaviorSequence invoked after completion")
            }
            return this.behaviors[this.currentBehaviorIndex]
        }

        private checkAdvance(): void {
            if (this.currentBehavior.isComplete()) {
                this.currentBehaviorIndex++
            }
        }
    }
}