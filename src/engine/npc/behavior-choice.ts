namespace splitTime.npc {
    export class BehaviorChoice implements TimeNotified, Behavior, TemporaryBehavior, ConditionalBehavior {

        private readonly behaviorMap: { [priority: number]: splitTime.npc.Behavior | null } = {}
        private levelUsed: int | null = null

        constructor(
            private readonly priorityLevels: readonly int[] = [npc.PRIORITY, npc.DIRECTED, npc.IDLE]
        ) {
            assert(this.priorityLevels.length !== 0, "At least one priority level should be specified")
            for (const level of this.priorityLevels) {
                this.behaviorMap[level] = null
            }
        }

        isComplete(): boolean {
            for (const level of this.priorityLevels) {
                if (this.behaviorMap[level] !== null) {
                    return false
                }
            }
            return true
        }

        isConditionMet(): boolean {
            for (const level of this.priorityLevels) {
                const behavior = this.behaviorMap[level]
                if (behavior !== null) {
                    // Unconditional behaviors count as condition always met
                    if (!instanceOf.ConditionalBehavior(behavior)) {
                        return true
                    }
                    if (behavior.isConditionMet()) {
                        return true
                    }
                }
            }
            return false
        }

        notifySuspension(): void {
            if (this.levelUsed !== null) {
                this.behaviorMap[this.levelUsed]?.notifySuspension?.()
            }
            this.levelUsed = null
        }

        hasPriority(level: int = npc.PRIORITY): boolean {
            this.ensureLevelApplicable(level)
            return this.behaviorMap[level] !== null
        }

        notifyTimeAdvance(delta: game_seconds): void {
            const lastLevelUsed = this.levelUsed
            this.levelUsed = null
            for (const level of this.priorityLevels) {
                const behavior = this.behaviorMap[level]
                if (behavior === null) {
                    continue
                }
                if (instanceOf.ConditionalBehavior(behavior) && !behavior.isConditionMet()) {
                    continue
                }
                this.levelUsed = level
                if (this.levelUsed !== lastLevelUsed && lastLevelUsed !== null) {
                    this.behaviorMap[lastLevelUsed]?.notifySuspension?.()
                }

                behavior.notifyTimeAdvance(delta)
                if (instanceOf.TemporaryBehavior(behavior) && behavior.isComplete()) {
                    this.behaviorMap[level] = null
                }
                return
            }
        }

        stop(behavior: Behavior): void {
            for (const level of this.priorityLevels) {
                if (this.behaviorMap[level] === behavior) {
                    this.behaviorMap[level] = null
                }
            }
        }

        set(behavior: Behavior | TemporaryBehavior | ConditionalBehavior, level?: int): void {
            if (level === undefined) {
                level = this.priorityLevels[0]
            }
            this.ensureLevelApplicable(level)
            this.behaviorMap[level] = behavior
        }

        private ensureLevelApplicable(level: int): void {
            if (this.priorityLevels.indexOf(level) < 0) {
                throw new Error("Level " + level + " not applicable for NPC")
            }
        }
    }
}