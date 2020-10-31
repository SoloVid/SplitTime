namespace splitTime.npc {
    export class WaitBehavior implements Behavior, TemporaryBehavior {
        private timeSoFar: game_seconds = 0
        constructor(
            private readonly totalTime: game_seconds,
            private readonly restartOnSuspend: boolean = false
        ) {}

        isComplete(): boolean {
            return this.timeSoFar >= this.totalTime
        }
        notifySuspension(): void {
            if (this.restartOnSuspend) {
                this.timeSoFar = 0
            }
        }
        notifyTimeAdvance(delta: number): void {
            this.timeSoFar += delta
        }
    }
}