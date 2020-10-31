namespace splitTime.npc {
    const CLOSE_ENOUGH = 2
    export class StickToPositionBehavior implements Behavior, ConditionalBehavior {
        constructor(
            private readonly spriteBody: SpriteBody,
            private readonly position: Position,
            private readonly moveStance: string
        ) {}

        isCloseEnough(): boolean {
            return this.getDistance() <= CLOSE_ENOUGH
        }

        isConditionMet(): boolean {
            return !this.isCloseEnough()
        }

        notifySuspension(): void {
            // Do nothing
        }

        notifyTimeAdvance(delta: game_seconds): void {
            const dir = direction.fromToThing(this.spriteBody.body, this.position)
            const dist = this.getDistance()
            const stepDist = Math.min(this.spriteBody.body.spd * delta, dist)
            this.spriteBody.body.mover.zeldaBump(stepDist, dir)
            this.spriteBody.sprite.requestStance(this.moveStance, dir)
            if (this.isCloseEnough()) {
                this.spriteBody.body.putInPosition(this.position)
            }
        }

        private getDistance(): number {
            // FTODO: 3D?
            return measurement.distanceTrue(
                this.spriteBody.body.x, this.spriteBody.body.y,
                this.position.x, this.position.y)
        }
    }
}