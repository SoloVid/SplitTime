namespace splitTime {
    type transition_listener = (
        oldLevel: Level | null,
        newLevel: Level
    ) => PromiseLike<any>

    export class LevelManager {
        private readonly world: World
        private currentLevel: Level | null = null
        private transitionInProgress: boolean = false

        private transitionStartListener: transition_listener | null = null
        private transitionEndListener: transition_listener | null = null

        constructor(world: World) {
            this.world = world
        }

        onTransitionStart(listener: transition_listener) {
            this.transitionStartListener = listener
        }

        onTransitionEnd(listener: transition_listener) {
            this.transitionEndListener = listener
        }

        /**
         * STOP!!! This method should ONLY be called by the main game loop.
         */
        async transition(level: Level): Promise<void> {
            if (this.transitionInProgress) {
                throw new Error(
                    "Level transition is already in progress. Cannot transition to " +
                        level.id
                )
            }

            if (level === this.currentLevel) {
                return splitTime.Pledge.as()
            }

            this.transitionInProgress = true

            const enteringLevel = level
            const exitingLevel = this.currentLevel

            var changeRegion =
                !exitingLevel ||
                exitingLevel.getRegion() !== enteringLevel.getRegion()

            //********Leave current level

            // TODO: move to listener
            // splitTime.process = "loading";
            if (this.transitionStartListener) {
                await this.transitionStartListener(exitingLevel, enteringLevel)
            }

            if (exitingLevel) {
                exitingLevel.runExitFunction()
                if (changeRegion) {
                    exitingLevel.getRegion().unloadLevels()
                }
            }

            //********Enter new level

            this.currentLevel = enteringLevel

            if (changeRegion) {
                await enteringLevel.getRegion().loadForPlay(this.world)
            }

            // splitTime.process = enteringLevel.type as string;
            if (this.transitionEndListener) {
                await this.transitionEndListener(exitingLevel, enteringLevel)
            }
            enteringLevel.runEnterFunction()

            this.transitionInProgress = false
        }

        isTransitioning(): boolean {
            return this.transitionInProgress
        }

        isCurrentSet(): boolean {
            return !!this.currentLevel
        }

        getCurrent(): Level {
            if (!this.currentLevel) {
                throw new Error("currentLevel is not set")
            }
            return this.currentLevel
        }
    }
}
