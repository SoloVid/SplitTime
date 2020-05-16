namespace splitTime.agent {
    class StepCallback implements Callback<void> {
        constructor(
            private readonly pathWalker: PathWalker,
            private readonly step: int
        ) {}

        callBack(): void {
            this.pathWalker.advanceFromStep(this.step)
        }
    }

    export class PathWalker implements TimeNotified {
        private nextStepIndex: int = 0
        private currentWalk: Walk | null = null
        private readonly steps: readonly (ILevelLocation2 | Walk | time.MidEventAction)[]
        private isStarted = false
        private readonly completionCallbacks = new ObjectCallbacks<void>()

        constructor(
            private readonly npc: Npc,
            private readonly pathSpec: PathSpec
        ) {
            const builder = new PathDslBuilder()
            pathSpec.setup(builder)
            this.steps = builder.build()
        }

        start(): void {
            this.nextStep()
            this.npc.setDirectedBehavior(this)
            this.isStarted = true
        }

        isComplete(): boolean {
            return this.isStarted && this.nextStepIndex > this.steps.length
        }

        waitForComplete(): ObjectCallbacks<void> {
            return this.completionCallbacks
        }

        notifyTimeAdvance(delta: splitTime.game_seconds): void {
            if (this.currentWalk === null) {
                return
            }

            const walkAs3D = this.currentWalk.location as ReadonlyCoordinates3D
            const coords = {
                x: walkAs3D.x,
                y: walkAs3D.y,
                z: walkAs3D.z || this.npc.body.z
            }
            this.npc.movementAgent.setWalkingTowardBoardLocation(coords)
            this.npc.movementAgent.notifyTimeAdvance(delta)

            // TODO: may need approximate equivalence?
            const approxDist = Math.abs(this.npc.body.x - coords.x) +
                Math.abs(this.npc.body.y - coords.y) +
                Math.abs(this.npc.body.z - coords.z)
            const CLOSE_ENOUGH = 1
            if (approxDist < CLOSE_ENOUGH) {
                if (this.currentWalk.location instanceof Position) {
                    this.npc.body.putInPosition(this.currentWalk.location)
                }
                this.nextStep()
            }
        }

        advanceFromStep(stepIndex: int): void {
            if (stepIndex + 1 === this.nextStepIndex) {
                this.nextStep()
            }
        }

        private nextStep(): void {
            this.currentWalk = null
            const stepIndex = this.nextStepIndex++
            if (stepIndex >= this.steps.length) {
                this.npc.stopBehavior(this)
                this.completionCallbacks.run()
                return
            }

            const step = this.steps[stepIndex]
            if (instanceOf.Runnable(step)) {
                const result = step.run()
                if (result !== undefined) {
                    result.then(new StepCallback(this, stepIndex))
                } else {
                    this.nextStep()
                }
            } else if (step instanceof Position) {
                this.npc.body.putInPosition(step)
                this.nextStep()
            } else if (instanceOf.ILevelLocation2(step)) {
                this.npc.body.putInLocation(step)
                this.nextStep()
            } else {
                this.currentWalk = step
            }
        }
    }
}
