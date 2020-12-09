namespace splitTime.npc {
    export class DirectedWalkBehavior implements Behavior, TemporaryBehavior {
        constructor(
            private readonly npc: Npc,
            private readonly targetLocation: ILevelLocation2,
            private readonly speed: Indirect<number>,
            private readonly stance: string
        ) {}

        isComplete(): boolean {
            if (this.isCloseEnough()) {
                return true
            }
            if (this.npc.body.level !== this.targetLocation.level) {
                // If the level changed, we're just hoping that the next item was a transport
                // and it happened automatically via walking.
                // Otherwise...not sure what we would do here.
                return true
            }
            return false
        }

        notifyTimeAdvance(delta: splitTime.game_seconds): void {
            const dirBefore = direction.fromToThing(this.npc.body, this.targetLocation)
            this.npc.movementAgent.setWalkingTowardBoardLocation(this.targetLocation)
            this.npc.movementAgent.speed = this.speed
            this.npc.movementAgent.stance = this.stance
            this.npc.movementAgent.notifyTimeAdvance(delta)
            const dirAfter = direction.fromToThing(this.npc.body, this.targetLocation)
            const overshot = !direction.areWithin90Degrees(dirBefore, dirAfter)

            if (overshot || this.isCloseEnough()) {
                // FTODO: This forced putting could be problematic for collisions
                // if (this.targetLocation instanceof Position) {
                //     this.npc.spriteBody.putInPosition(this.targetLocation)
                // } else {
                    this.npc.body.x = this.targetLocation.x
                    this.npc.body.y = this.targetLocation.y
                    this.npc.body.z = this.targetLocation.z
                // }
            }
        }

        isCloseEnough(): boolean {
            return closeEnough(this.npc.body, this.targetLocation)
        }
    }

    function closeEnough(a: Coordinates3D, b: Coordinates3D): boolean {
        const approxDist = Math.abs(a.x - b.x) +
        Math.abs(a.y - b.y) +
        Math.abs(a.z - b.z)
        const CLOSE_ENOUGH = 1
        return approxDist < CLOSE_ENOUGH
    }
}
