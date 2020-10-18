namespace splitTime.agent {
    export class BestEffortMovementAgent implements splitTime.TimeNotified {
        private body: splitTime.Body
        private targetLevelLocation: ReadonlyCoordinates3D | null = null
        private targetScreenLocation: ReadonlyCoordinates2D | null = null
        private targetDirection: number | null = null

        public constructor(body: splitTime.Body) {
            this.body = body
        }
        setBody(body: Body) {
            this.body = body
            this.resetTarget()
        }

        setWalkingTowardBoardLocation(coords: ReadonlyCoordinates3D) {
            this.targetLevelLocation = coords
        }
        setWalkingTowardScreenLocation(coords: ReadonlyCoordinates2D) {
            this.targetScreenLocation = coords
        }
        setWalkingDirection(dir: number) {
            this.targetDirection = dir
        }

        setStopped() {
            this.resetTarget()
        }

        notifyTimeAdvance(delta: splitTime.game_seconds) {
            var walkingDir = this.getWalkingDirection()
            if (walkingDir !== null) {
                this.body.dir = walkingDir
                if (this.sprite) {
                    this.sprite.requestStance("walk", this.body.dir)
                }
                // TODO: how are we going to handle hills?
                if (this.body.level.isLoaded()) {
                    this.body.mover.horizontal.zeldaStep(
                        this.body.dir,
                        this.body.spd * delta,
                        true
                    )
                } else {
                    this.body.x += this.body.spd * delta * direction.getXMagnitude(this.body.dir)
                    this.body.y += this.body.spd * delta * direction.getYMagnitude(this.body.dir)
                }
            }
        }

        resetTarget() {
            this.targetLevelLocation = null
            this.targetScreenLocation = null
            this.targetDirection = null
        }

        getWalkingDirection() {
            if (this.targetDirection !== null) {
                return this.targetDirection
            } else if (this.targetLevelLocation !== null) {
                return direction.fromToThing(this.body, this.targetLevelLocation)
            } else if (this.targetScreenLocation !== null) {
                // TODO: some other calculation
                return 0
            }
            return null
        }

        private get sprite(): splitTime.Sprite | null {
            return splitTime.body.tryExtractSprite(this.body)
        }
    }
}
