namespace splitTime {
    type transition_listener = (
        oldLevel: Level | null,
        newLevel: Level
    ) => PromiseLike<void>

    export class LevelManager {
        private readonly world: World
        private currentLevel: Level | null = null
        private transitionInProgress: boolean = false
        private regionTransitionInProgress: boolean = false

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
         * Transition to a new level
         * 
         * STOP!!! This method should ONLY be called by the main game loop.
         * 
         * @param level - the destination level
         */
        async transition(level: Level): Promise<void> {
            if (this.transitionInProgress) {
                throw new Error(
                    "Level transition is already in progress. Cannot transition to " +
                        level.id
                )
            }

            if (level === this.currentLevel) {
                await splitTime.Pledge.as()
                return
            }

            this.transitionInProgress = true

            const enteringLevel = level
            const exitingLevel = this.currentLevel

            //If this is the initial transition at the start of a game
            var gameLoading = !exitingLevel 
            
            //This will be true if we are changing regions, but not true for the initial game load
            this.regionTransitionInProgress =
                exitingLevel !== null &&
                exitingLevel.getRegion() !== enteringLevel.getRegion()

            //********Leave current level

            // TODO: move to listener
            // splitTime.process = "loading";
            if (this.transitionStartListener) {
                await this.transitionStartListener(exitingLevel, enteringLevel)
            }

            if (exitingLevel) {
                exitingLevel.runExitFunction()
                if (this.regionTransitionInProgress) {
                    exitingLevel.getRegion().unloadLevels()
                }
            }

            //********Enter new level

            this.currentLevel = enteringLevel

            if (gameLoading || this.regionTransitionInProgress) {
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

        isTransitioningRegions(): boolean {
            return this.regionTransitionInProgress
        }

        finishRegionTransition() {
            this.regionTransitionInProgress = false
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
