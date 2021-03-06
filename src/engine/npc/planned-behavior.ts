namespace splitTime.npc {
    export class PlannedBehavior implements Behavior {
        private plannedBehavior: Behavior | null = null

        constructor(
            private readonly plan: () => Behavior
        ) {}

        notifyTimeAdvance(delta: game_seconds): void {
            if (this.plannedBehavior === null) {
                this.plannedBehavior = this.plan()
            }
            this.plannedBehavior.notifyTimeAdvance(delta)
        }
        
        notifySuspension(): void {
            this.plannedBehavior = null
        }
    }
}
