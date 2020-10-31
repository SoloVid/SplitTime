namespace splitTime.npc {
    export class UseAbilityBehavior implements Behavior {
        constructor(
            private readonly ability: player.ability.IAbility
        ) {}

        notifySuspension(): void {
            // FTODO: anything on suspension?
        }

        notifyTimeAdvance(delta: number): void {
            this.ability.use()
        }
    }
}