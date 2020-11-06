namespace splitTime.npc {
    export class ChaseBehavior implements Behavior, ConditionalBehavior {

        private timeWithoutSeeing: splitTime.game_seconds = Number.POSITIVE_INFINITY
        BLIND_TIME: splitTime.game_seconds = 2
        TERMINATION_TIME: splitTime.game_seconds = 5
        sightDistance: pixels_t = 256
        senseDistance: pixels_t
        moveStance: string = "run"
        chaseSpeed: pixels_t = 32

        constructor(
            private readonly npc: splitTime.Npc,
            private readonly bodyToChaseGetter: () => Body,
            private readonly howCloseToGet: number
        ) {
            this.senseDistance = 2 * this.npc.body.width
        }

        private inLevel(): boolean {
            return this.npc.body.getLevel() === this.bodyToChaseGetter().getLevel()
        }

        isConditionMet(): boolean {
            if (!this.inLevel()) {
                return false
            }
            if (this.timeWithoutSeeing < this.TERMINATION_TIME) {
                return true
            }
            return this.canDetect()
        }

        notifyTimeAdvance(delta: splitTime.game_seconds): void {
            if (!this.inLevel()) {
                return
            }

            const pb = this.bodyToChaseGetter()
            const b = this.npc.body

            if (this.canDetect()) {
                this.timeWithoutSeeing = 0
            } else {
                this.timeWithoutSeeing += delta
            }

            if (this.timeWithoutSeeing < this.BLIND_TIME) {
                const targetDir = splitTime.direction.fromToThing(b, pb)
                const TURN_SPEED = 4
                b.dir = splitTime.direction.approach(b.dir, targetDir, delta * TURN_SPEED)
                if (splitTime.direction.areWithin90Degrees(targetDir, b.dir, 0.5)) {
                    this.npc.sprite.requestStance(this.moveStance, b.dir)

                    // FTODO: account for 2D (not just x width)
                    const distanceFromChased = splitTime.measurement.distanceTrue(b.x, b.y, pb.x, pb.y) - pb.width / 2
                    const distanceFromTarget = Math.abs(distanceFromChased - this.howCloseToGet)
                    const moveDist = Math.min(delta * this.chaseSpeed, distanceFromTarget)
                    if (distanceFromChased < this.howCloseToGet) {
                        b.mover.zeldaBump(moveDist, direction.getOpposite(b.dir))
                    } else {
                        b.mover.zeldaBump(moveDist, b.dir)
                    }
                } else {
                    // FTODO: explicit stance?
                    this.npc.sprite.requestStance(splitTime.Sprite.DEFAULT_STANCE, b.dir, true)
                }
            } else {
                // Do nothing (wait)
                // FTODO: Maybe look around?
            }
        }

        private canDetect(): boolean {
            return splitTime.body.canDetect(this.npc.body, this.bodyToChaseGetter(), this.sightDistance)
        }
    }
}