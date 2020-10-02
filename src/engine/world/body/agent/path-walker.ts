namespace splitTime.agent {
    class StageCallback implements SimpleCallback<void> {
        constructor(
            private readonly pathWalker: PathWalker,
            private readonly stage: int
        ) {}

        callBack(): void {
            this.pathWalker.advanceFromStage(this.stage)
        }
    }

    class CurrentWalk {
        // TODO: needs to be 3D
        steps: Coordinates2D[]
        nextDestination: int = 0
        constructor(
            startingLocation: Coordinates2D | Position,
            private readonly walk: Walk,
            public readonly level: Level
        ) {
            if (startingLocation instanceof Position) {
                this.steps = startingLocation.getPathTo(walk.location).concat(walk.location)
            } else {
                this.steps = [walk.location]
            }
        }
    }

    export class PathWalker implements npc.Behavior {
        private lastKnownLocation: Coordinates2D | Position | null = null
        private nextStageIndex: int = 0
        private currentWalk: CurrentWalk | null = null
        private readonly stages: readonly (ILevelLocation2 | Walk | time.MidEventAction)[]
        private isStarted = false
        private readonly completionCallbacks = new ObjectCallbacks<void>()

        constructor(
            private readonly pathSpec: PathSpec,
            private readonly npc: Npc,
        ) {
            const builder = new PathDslBuilder()
            pathSpec.setup(builder)
            this.stages = builder.build()
        }
        isComplete(): boolean {
            return this.isStarted && this.nextStageIndex > this.stages.length
        }

        waitForComplete(): ObjectCallbacks<void> {
            return this.completionCallbacks
        }

        notifySuspension(): void {
            throw new Error("Method not implemented.")
        }

        notifyTimeAdvance(delta: splitTime.game_seconds): void {
            if (!this.isStarted) {
                this.nextStep()
                this.isStarted = true
            }

            if (this.currentWalk === null) {
                return
            }

            const targetLocation = this.currentWalk.steps[this.currentWalk.nextDestination]

            const coords = this.coordsAs3D(targetLocation)
            this.npc.movementAgent.setWalkingTowardBoardLocation(coords)
            this.npc.movementAgent.notifyTimeAdvance(delta)

            if (closeEnough(this.npc.body, coords)) {
                // FTODO: This forced putting could be problematic for collisions
                if (targetLocation instanceof Position) {
                    this.npc.body.putInPosition(targetLocation)
                } else {
                    this.npc.body.x = coords.x
                    this.npc.body.y = coords.y
                    this.npc.body.z = coords.z
                }
                this.lastKnownLocation = targetLocation
                this.nextStep()
            } else if (this.npc.body.level !== this.currentWalk.level) {
                // If the level changed, we're just hoping that the next item was a transport
                // and it happened automatically via walking.
                // Otherwise...not sure what we would do here.
                this.nextStep()
            }
        }

        advanceFromStage(stageIndex: int): void {
            if (stageIndex + 1 === this.nextStageIndex) {
                this.nextStep()
            }
        }

        private nextStep(): void {
            if (this.currentWalk !== null) {
                this.currentWalk.nextDestination++
                if (this.currentWalk.nextDestination < this.currentWalk.steps.length) {
                    return
                }
            }

            this.currentWalk = null
            const stageIndex = this.nextStageIndex++
            if (stageIndex >= this.stages.length) {
                this.completionCallbacks.run()
                return
            }

            const stage = this.stages[stageIndex]
            if (instanceOf.Runnable(stage)) {
                const result = stage.run()
                if (result !== undefined) {
                    result.then(new StageCallback(this, stageIndex))
                } else {
                    this.nextStep()
                }
            } else if (stage instanceof Position) {
                this.npc.body.putInPosition(stage)
                this.lastKnownLocation = stage
                this.nextStep()
            } else if (instanceOf.ILevelLocation2(stage)) {
                this.npc.body.putInLocation(stage)
                this.lastKnownLocation = stage
                this.nextStep()
            } else {
                const previousStep = stageIndex > 0 ? this.stages[stageIndex - 1] : null
                // TODO: support walk as well
                // const startLocation = instanceOf.Coordinates2D(previousStep) ? previousStep : this.npc.body
                const startLocation = this.lastKnownLocation || this.npc.body
                this.currentWalk = new CurrentWalk(startLocation, stage, this.npc.body.level)
            }
        }

        coordsAs3D(coords2D: Coordinates2D): Coordinates3D {
            const newCoords = {
                x: coords2D.x,
                y: coords2D.y,
                z: this.npc.body.z
            }
            const coordsAs3D = coords2D as ReadonlyCoordinates3D
            if (!!coordsAs3D.z || coordsAs3D.z === 0) {
                newCoords.z = coordsAs3D.z
            }
            return newCoords
        }
    }

    function closeEnough(a: Coordinates3D, b: Coordinates3D): boolean {
        const approxDist = Math.abs(a.x - b.x) +
        Math.abs(a.y - b.y) +
        Math.abs(a.z - b.z)
        const CLOSE_ENOUGH = 4
        return approxDist < CLOSE_ENOUGH
    }
}
