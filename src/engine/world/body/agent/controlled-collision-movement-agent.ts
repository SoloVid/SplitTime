namespace splitTime.agent {
    export class ControlledCollisionMovement implements splitTime.TimeNotified {
        private targetLevelLocation: Readonly<Coordinates3D> | null = null
        private targetDirection: number | null = null
        private ladder: EngagedLadder | null = null
        speed: Indirect<number> = 32
        stance: string = "walk"

        constructor(
            private readonly spriteBody: SpriteBody
        ) {}

        setWalkingTowardBoardLocation(coords: Readonly<Coordinates3D>) {
            this.targetDirection = null
            this.targetLevelLocation = coords
        }
        setWalkingDirection(dir: number) {
            this.targetLevelLocation = null
            this.targetDirection = dir
        }

        setStopped() {
            this.resetTarget()
        }

        setLadder(eventId: string, direction: direction_t, keepExistingDirection: boolean = true) {
            if (keepExistingDirection && this.ladder) {
                this.ladder.location = level.copyLocation(this.body)
            } else {
                this.ladder = new EngagedLadder(eventId, level.copyLocation(this.body), direction)
            }
        }

        private checkLadder() {
            if (this.ladder !== null) {
                if (!level.areLocationsEquivalent(this.ladder.location, this.body)) {
                    // FTODO: should this check more/different part of Body than base?
                    const baseCollisionCheck = splitTime.COLLISION_CALCULATOR.calculateVolumeCollision(
                        this.body.collisionMask,
                        this.body.level,
                        this.body.getLeft(), this.body.width,
                        this.body.getTopY(), this.body.depth,
                        this.body.z, 1,
                        [this.body]
                    )
                    if (baseCollisionCheck.events.includes(this.ladder.eventId)) {
                        this.ladder.location = level.copyLocation(this.body)
                    } else {
                        this.ladder = null
                    }
                }
            }
        }

        notifyTimeAdvance(delta: splitTime.game_seconds) {
            this.checkLadder()
            if (this.ladder !== null) {
                this.body.zVelocity = 0
            }

            const speed = redirect(this.speed)
            var walkingDir = this.getWalkingDirection()
            if (walkingDir !== null) {
                this.body.dir = walkingDir
                this.sprite.requestStance(this.stance, this.body.dir)
                // TODO: how are we going to handle hills?
                if (this.body.level.isLoaded()) {
                    let dz = 0
                    if (this.ladder !== null) {
                        if (direction.areWithin90Degrees(this.body.dir, this.ladder.direction)) {
                            dz = this.body.mover.vertical.zeldaVerticalMove(speed * delta / 2)
                        } else if (!direction.areWithin90Degrees(this.body.dir, this.ladder.direction, 2)) {
                            dz = this.body.mover.vertical.zeldaVerticalMove(-speed * delta / 2)
                        }
                    }

                    if (dz === 0) {
                        this.body.mover.horizontal.zeldaStep(
                            this.body.dir,
                            speed * delta,
                            true
                        )
                    }
                } else {
                    this.body.x += speed * delta * direction.getXMagnitude(this.body.dir)
                    this.body.y += speed * delta * direction.getYMagnitude(this.body.dir)
                }
            }
            this.resetTarget()
        }

        resetTarget() {
            this.targetLevelLocation = null
            this.targetDirection = null
        }

        getWalkingDirection() {
            if (this.targetDirection !== null) {
                return this.targetDirection
            } else if (this.targetLevelLocation !== null) {
                return direction.fromToThing(this.body, this.targetLevelLocation)
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

    class EngagedLadder {
        constructor(
            public readonly eventId: string,
            public location: ILevelLocation2,
            public readonly direction: direction_t
        ) {}
    }
}
