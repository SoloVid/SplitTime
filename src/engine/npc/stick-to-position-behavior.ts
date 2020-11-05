namespace splitTime.npc {
    export class StickToPositionBehavior implements Behavior, ConditionalBehavior {
        private readonly helperBehavior: DirectedWalkBehavior

        constructor(
            private readonly npc: Npc,
            private readonly position: Position,
            private readonly moveStance: string
        ) {
            this.helperBehavior = new DirectedWalkBehavior(npc, position)
        }

        isConditionMet(): boolean {
            return !this.helperBehavior.isCloseEnough()
        }

        notifyTimeAdvance(delta: game_seconds): void {
            this.helperBehavior.notifyTimeAdvance(delta)
        }
    }
}