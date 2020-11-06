namespace splitTime.agent {
    export class BestEffortMovementAgent implements splitTime.TimeNotified {
        private targetLevelLocation: Readonly<Coordinates3D> | null = null
        private targetScreenLocation: Readonly<Coordinates2D> | null = null
        private targetDirection: number | null = null
        speed: number = 32

        public constructor(private readonly spriteBody: SpriteBody) {
        }

        setWalkingTowardBoardLocation(coords: Readonly<Coordinates3D>) {
            this.targetLevelLocation = coords
        }
        setWalkingTowardScreenLocation(coords: Readonly<Coordinates2D>) {
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
                        this.speed * delta,
                        true
                    )
                } else {
                    this.body.x += this.speed * delta * direction.getXMagnitude(this.body.dir)
                    this.body.y += this.speed * delta * direction.getYMagnitude(this.body.dir)
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

        private get body(): Body {
            return this.spriteBody.body
        }

        private get sprite(): Sprite {
            return this.spriteBody.sprite
        }
    }
}
