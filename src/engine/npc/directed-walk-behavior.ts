namespace splitTime.npc {
    export class DirectedWalkBehavior implements Behavior, TemporaryBehavior {
        constructor(
            private readonly npc: Npc,
            private readonly targetLocation: ILevelLocation2
        ) {}

        isComplete(): boolean {
            if (closeEnough(this.npc.body, this.targetLocation)) {
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
            this.npc.movementAgent.setWalkingTowardBoardLocation(this.targetLocation)
            this.npc.movementAgent.notifyTimeAdvance(delta)

            if (closeEnough(this.npc.body, this.targetLocation)) {
                // FTODO: This forced putting could be problematic for collisions
                if (this.targetLocation instanceof Position) {
                    this.npc.body.putInPosition(this.targetLocation)
                } else {
                    this.npc.body.x = this.targetLocation.x
                    this.npc.body.y = this.targetLocation.y
                    this.npc.body.z = this.targetLocation.z
                }
            }
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
