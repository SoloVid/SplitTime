namespace splitTime.npc {
    interface WeightedDirection {
        dir: direction_t
        weight: number
    }

    interface BlacklistedDirection {
        dir: direction_t
        location: ILevelLocation2
    }

    export class WeightedDirectionBehavior implements Behavior {
        private temporaryDirectionBlacklist: BlacklistedDirection[] = []

        chaseSpeed: pixels_t

        constructor(
            private readonly npc: splitTime.Npc,
            private readonly getDirectionWeights: () => WeightedDirection[],
            chaseSpeed: pixels_t
        ) {
            this.chaseSpeed = chaseSpeed
        }

        notifyTimeAdvance(delta: splitTime.game_seconds): void {
            const dirWeights = this.getDirectionWeights()
            this.updateBlacklist()
            let bestDir: direction_t | null = null
            let bestWeight = 0
            for (const dirWeight of dirWeights) {
                if (this.isBlacklisted(dirWeight.dir)) {
                    continue
                }
                if (dirWeight.weight > bestWeight) {
                    bestDir = dirWeight.dir
                    bestWeight = dirWeight.weight
                } else if (dirWeight.weight === bestWeight) {
                    if (Math.random() < 0.5) {
                        bestDir = dirWeight.dir
                        bestWeight = dirWeight.weight
                    }
                }
            }

            if (bestDir === null) {
                this.temporaryDirectionBlacklist = []
                return
            }

            const b = this.npc.body
            const TURN_SPEED = 4

            b.dir = splitTime.direction.approach(b.dir, bestDir, delta * TURN_SPEED)

            if (splitTime.direction.areWithin90Degrees(bestDir, b.dir, 1.5)) {
                const moveDist = delta * this.chaseSpeed
                const moved = b.mover.zeldaBump(moveDist, b.dir)

                if (!moved) {
                    this.blacklistDir(bestDir)
                }
            }
        }

        private isBlacklisted(dir: direction_t): boolean {
            for (const item of this.temporaryDirectionBlacklist) {
                if (item.dir === dir) {
                    return true
                }
            }
            return false
        }

        private updateBlacklist(): void {
            // if (this.temporaryDirectionBlacklist.length >= maxSize) {
            //     this.temporaryDirectionBlacklist = []
            // }

            const blacklistDist = Math.max(this.npc.body.width, this.npc.body.depth)
            this.temporaryDirectionBlacklist = this.temporaryDirectionBlacklist.filter(item => {
                if (item.location.level !== this.npc.body.level) {
                    return false
                }
                if (measurement.distanceEasy(
                    item.location.x, item.location.y,
                    this.npc.body.x, this.npc.body.y
                ) > blacklistDist) {
                    return false
                }
                return true
            })
        }

        private blacklistDir(dir: direction_t): void {
            // console.log(`Blacklisting ${dir} for ${this.npc.body.id}`)
            this.temporaryDirectionBlacklist.push({
                dir: dir,
                location: {
                    x: this.npc.body.x,
                    y: this.npc.body.y,
                    z: this.npc.body.z,
                    level: this.npc.body.level
                }
            })
        }
    }
}