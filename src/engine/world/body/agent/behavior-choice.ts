namespace splitTime.npc {
    export class BehaviorChoice implements TimeNotified, npc.Behavior {

        private readonly behaviorMap: { [priority: number]: splitTime.npc.Behavior | null } = {}
        private levelUsed: int | null = null

        constructor(
            private readonly priorityLevels: readonly int[] = [npc.PRIORITY, npc.DIRECTED, npc.IDLE]
        ) {
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

        notifySuspension(): void {
            if (this.levelUsed !== null) {
                this.behaviorMap[this.levelUsed]?.notifySuspension()
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
                if (behavior !== null) {
                    this.levelUsed = lastLevelUsed
                    if (this.levelUsed !== lastLevelUsed && lastLevelUsed !== null) {
                        this.behaviorMap[lastLevelUsed]?.notifySuspension()
                    }

                    behavior.notifyTimeAdvance(delta)
                    if (behavior.isComplete()) {
                        this.behaviorMap[level] = null
                    }
                    return
                }
            }
        }

        stop(behavior: splitTime.npc.Behavior): void {
            for (const level of this.priorityLevels) {
                if (this.behaviorMap[level] === behavior) {
                    this.behaviorMap[level] = null
                }
            }
        }

        set(behavior: splitTime.npc.Behavior, level?: int): void {
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