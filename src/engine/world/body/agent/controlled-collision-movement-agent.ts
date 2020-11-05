namespace splitTime.agent {
    class EngagedLadder {
        constructor(
            public readonly eventId: string,
            public location: ILevelLocation2,
            public readonly direction: direction_t
        ) {}
    }

    export class ControlledCollisionMovement implements splitTime.TimeNotified {
        private body: splitTime.Body
        private targetLevelLocation: Readonly<Coordinates3D> | null = null
        private targetScreenLocation: Readonly<Coordinates2D> | null = null
        private targetDirection: number | null = null
        private ladder: EngagedLadder | null = null

        public constructor(body: splitTime.Body) {
            this.body = body
        }
        setBody(body: Body) {
            this.body = body
            this.resetTarget()
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

            var walkingDir = this.getWalkingDirection()
            if (walkingDir !== null) {
                this.body.dir = walkingDir
                if (this.sprite) {
                    this.sprite.requestStance("walk", this.body.dir)
                }
                let dz = 0
                if (this.ladder !== null) {
                    if (direction.areWithin90Degrees(this.body.dir, this.ladder.direction)) {
                        dz = this.body.mover.vertical.zeldaVerticalMove(this.body.spd * delta / 2)
                    } else if (!direction.areWithin90Degrees(this.body.dir, this.ladder.direction, 2)) {
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
            // TODO: re-evaluate extracting sprite
            for (const drawable of this.body.drawables) {
                if (drawable instanceof splitTime.Sprite) {
                    return drawable
                }
            }
            return null
        }
    }
}
