import { Assets, Level, World } from "../../splitTime";
type TransitionListener = (oldLevel: Level | null, newLevel: Level) => PromiseLike<void>;
export class LevelManager {
    private currentLevel: Level | null = null;
    private transitionInProgress: boolean = false;
    private regionTransitionStartListener: TransitionListener | null = null;
    private regionTransitionEndListener: TransitionListener | null = null;
    constructor(
        private readonly world: World,
        private readonly assets: Assets
    ) {
    }
    onRegionExit(listener: TransitionListener) {
        this.regionTransitionStartListener = listener;
    }
    onRegionEnter(listener: TransitionListener) {
        this.regionTransitionEndListener = listener;
    }
    /**
     * Transition to a new level
     *
     * STOP!!! This method should ONLY be called by the main game loop.
     *
     * @param level - the destination level
     */
    transition(level: Level): Promise<void> | void {
        if (this.transitionInProgress) {
            throw new Error("Level transition is already in progress. Cannot transition to " +
                level.id);
        }
        if (level === this.currentLevel) {
            return;
        }
        if (this.currentLevel === null || this.currentLevel.getRegion() !== level.getRegion()) {
            this.transitionInProgress = true;
            return this.fullRegionTransition(level).then(() => {
                this.transitionInProgress = false;
            }, () => {
                this.transitionInProgress = false;
            });
        }
        else {
            this.currentLevel.runExitFunction();
            this.currentLevel = level;
            this.currentLevel.runEnterFunction();
        }
    }
    private async fullRegionTransition(level: Level): Promise<void> {
        const enteringLevel = level;
        const exitingLevel = this.currentLevel;
        // Leave current level
        if (exitingLevel) {
            if (this.regionTransitionStartListener) {
                await this.regionTransitionStartListener(exitingLevel, enteringLevel);
            }
            exitingLevel.runExitFunction();
            exitingLevel.getRegion().unloadLevels(this.assets);
        }
        // Enter new level
        this.currentLevel = enteringLevel;
        await enteringLevel.getRegion().loadForPlay(this.world, this.assets);
        enteringLevel.runEnterFunction();
        if (this.regionTransitionEndListener) {
            await this.regionTransitionEndListener(exitingLevel, enteringLevel);
        }
    }
    isTransitioning(): boolean {
        return this.transitionInProgress;
    }
    isCurrentSet(): boolean {
        return !!this.currentLevel;
    }
    // TODO: Maybe nuke this? We might only care about the current region for most purposes.
    getCurrent(): Level {
        if (!this.currentLevel) {
            throw new Error("currentLevel is not set");
        }
        return this.currentLevel;
    }
}
