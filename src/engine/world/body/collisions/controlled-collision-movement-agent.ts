namespace SplitTime.agent {
    export class ControlledCollisionMovement {
        private body: SplitTime.Body
        private targetBoardX: number | null = null
        private targetBoardY: number | null = null
        private targetScreenX: number | null = null
        private targetScreenY: number | null = null
        private targetDirection: number | null = null

        public constructor(body: SplitTime.Body) {
            this.body = body
        }
        setBody(body: Body) {
            this.body = body
            this.resetTarget()
        }

        setWalkingTowardBoardLocation(x: number, y: number) {
            this.targetBoardX = x
            this.targetBoardY = y
        }
        setWalkingTowardScreenLocation(x: number, y: number) {
            this.targetScreenX = x
            this.targetScreenY = y
        }
        setWalkingDirection(dir: number) {
            this.targetDirection = dir
        }
        setStopped() {
            this.resetTarget()
        }
        notifyFrameUpdate(delta: number) {
            var walkingDir = this.getWalkingDirection()
            if (walkingDir !== null) {
                this.body.dir = walkingDir
                if (this.sprite) {
                    this.sprite.requestStance("walk", this.body.dir)
                }
                this.body.mover.horizontal.zeldaStep(
                    this.body.dir,
                    this.body.spd * delta
                )
            }
        }

        resetTarget() {
            this.targetBoardX = null
            this.targetBoardY = null
            this.targetScreenX = null
            this.targetScreenY = null
            this.targetDirection = null
        }

        getWalkingDirection() {
            if (this.targetDirection !== null) {
                return this.targetDirection
            } else if (
                this.targetBoardX !== null &&
                this.targetBoardY !== null
            ) {
                // TODO: return some calculation
                return 0
            } else if (
                this.targetScreenX !== null &&
                this.targetScreenY !== null
            ) {
                // TODO: some other calculation
                return 0
            }
            return null
        }

        private get sprite(): SplitTime.Sprite | null {
            if (this.body.drawable instanceof SplitTime.Sprite) {
                return this.body.drawable
            }
            return null
        }
    }
}
