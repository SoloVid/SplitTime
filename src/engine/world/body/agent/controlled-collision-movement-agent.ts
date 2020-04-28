namespace splitTime.agent {
    export class ControlledCollisionMovement implements splitTime.TimeNotified {
        private body: splitTime.Body
        private targetBoardX: number | null = null
        private targetBoardY: number | null = null
        private targetScreenX: number | null = null
        private targetScreenY: number | null = null
        private targetDirection: number | null = null
        private ladderLocation: ILevelLocation2 | null = null

        public constructor(body: splitTime.Body) {
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

        setLadderLocation(ladderLocation: ILevelLocation2) {
            this.ladderLocation = ladderLocation
        }

        private checkLadderLocation() {
            if (this.ladderLocation !== null) {
                if (!level.areLocationsEquivalent(this.ladderLocation, this.body)) {
                    this.ladderLocation = null
                }
            }
        }

        notifyTimeAdvance(delta: splitTime.game_seconds) {
            this.checkLadderLocation()
            if (this.ladderLocation !== null) {
                this.body.zVelocity = 0
            }

            var walkingDir = this.getWalkingDirection()
            if (walkingDir !== null) {
                this.body.dir = walkingDir
                if (this.sprite) {
                    this.sprite.requestStance("walk", this.body.dir)
                }
                let dz = 0
                if (this.ladderLocation !== null) {
                    if (direction.areWithin90Degrees(this.body.dir, direction.N)) {
                        dz = this.body.mover.vertical.zeldaVerticalMove(this.body.spd * delta / 2)
                    } else if (direction.areWithin90Degrees(this.body.dir, direction.S)) {
                        dz = this.body.mover.vertical.zeldaVerticalMove(-this.body.spd * delta / 2)
                    }
                }

                if (dz === 0) {
                    this.body.mover.horizontal.zeldaStep(
                        this.body.dir,
                        this.body.spd * delta,
                        true
                    )
                }
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

        private get sprite(): splitTime.Sprite | null {
            if (this.body.drawable instanceof splitTime.Sprite) {
                return this.body.drawable
            }
            return null
        }
    }
}
