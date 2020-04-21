namespace splitTime {
    interface ApiCollisionInfo {
        blocked: boolean
        bodies: Body[]
        vStepUpEstimate: int
        events: string[]
        targetLevel: Level
    }

    class InternalCollisionInfo implements ApiCollisionInfo {
        blocked: boolean = false
        bodies: Body[] = []
        vStepUpEstimate: int = 0
        events: string[] = []
        pointerTraces: Trace[] = []
        targetLevel: Level

        constructor(targetLevel: Level) {
            this.targetLevel = targetLevel
        }
    }

    class CollisionCalculator {
        _levelIdStack: string[]
        constructor() {
            this._levelIdStack = []
        }

        /**
         * Calculate collisions in volume. This function is primarily useful for gauging a slice of volume (i.e. one-pixel step).
         */
        calculateVolumeCollision(
            level: splitTime.Level,
            startX: number,
            xPixels: number,
            startY: number,
            yPixels: number,
            startZ: number,
            zPixels: number,
            ignoreBody?: splitTime.Body
        ): ApiCollisionInfo {
            var collisionInfo = new InternalCollisionInfo(level)
            function handleFoundBody(otherBody: Body) {
                if (otherBody !== ignoreBody) {
                    collisionInfo.blocked = true
                    collisionInfo.bodies.push(otherBody)
                    collisionInfo.vStepUpEstimate =
                        otherBody.getZ() + otherBody.height - startZ
                }
            }
            level.getCellGrid().forEachBody(
                startX,
                startY,
                startZ,
                startX + xPixels,
                startY + yPixels,
                startZ + zPixels,
                handleFoundBody
            )

            if (!collisionInfo.blocked) {
                var traceCollision = this.calculateVolumeTraceCollision(
                    level,
                    startX,
                    xPixels,
                    startY,
                    yPixels,
                    startZ,
                    zPixels
                )
                collisionInfo.events = traceCollision.events
                collisionInfo.targetLevel = traceCollision.targetLevel
                if (traceCollision.blocked) {
                    collisionInfo.blocked = traceCollision.blocked
                    collisionInfo.vStepUpEstimate =
                        traceCollision.vStepUpEstimate
                } else {
                    const targetLevels: { [levelId: string]: Level } = {}
                    for (const pointerTrace of traceCollision.pointerTraces) {
                        const otherLevel = pointerTrace.getLevel()
                        if (this._levelIdStack.indexOf(otherLevel.id) >= 0) {
                            continue;
                        }
                        this._levelIdStack.push(level.id)
                        try {
                            var otherLevelCollisionInfo = this.calculateVolumeCollision(
                                otherLevel,
                                startX + pointerTrace.offsetX,
                                xPixels,
                                startY + pointerTrace.offsetY,
                                yPixels,
                                startZ + pointerTrace.offsetZ,
                                zPixels
                            )
                            // TODO: maybe add events?
                            if (otherLevelCollisionInfo.blocked) {
                                collisionInfo.blocked = true
                                collisionInfo.bodies =
                                    otherLevelCollisionInfo.bodies
                                collisionInfo.vStepUpEstimate =
                                    otherLevelCollisionInfo.vStepUpEstimate
                                break
                            }
                            // If we had decided this other level was our target, see if it wants to pawn us off
                            if (otherLevel === collisionInfo.targetLevel) {
                                targetLevels[otherLevelCollisionInfo.targetLevel.id] = otherLevelCollisionInfo.targetLevel
                            }
                        } finally {
                            this._levelIdStack.pop()
                        }
                    }
                    collisionInfo.targetLevel = chooseTheOneOrDefault(targetLevels, collisionInfo.targetLevel)
                }
            }
            return collisionInfo
        }

        /**
         * Check that the volume is open in level collision canvas data.
         */
        private calculateVolumeTraceCollision(
            level: splitTime.Level,
            startX: number,
            xPixels: number,
            startY: number,
            yPixels: number,
            startZ: number,
            zPixels: number
        ): InternalCollisionInfo {
            var originCollisionInfo = new splitTime.level.traces.CollisionInfo()
            level
                .getLevelTraces()
                .calculateVolumeCollision(
                    originCollisionInfo,
                    Math.floor(startX),
                    Math.ceil(xPixels),
                    Math.floor(startY),
                    Math.ceil(yPixels),
                    Math.floor(startZ),
                    Math.ceil(startZ + zPixels)
                )

            let targetLevel = chooseTheOneOrDefault(originCollisionInfo.levels, level)
            const collisionInfo = new InternalCollisionInfo(targetLevel)

            collisionInfo.vStepUpEstimate =
                originCollisionInfo.zBlockedTopEx - startZ
            collisionInfo.blocked =
                originCollisionInfo.containsSolid
            for (var levelId in originCollisionInfo.pointerTraces) {
                collisionInfo.pointerTraces.push(
                    originCollisionInfo.pointerTraces[levelId]
                )
            }
            for (var eventId in originCollisionInfo.events) {
                collisionInfo.events.push(eventId)
            }

            return collisionInfo
        }
    }

    export function chooseTheOneOrDefault<T>(map: { [id: string]: T}, defaultOption: T): T {
        const ids = Object.keys(map)
        if (ids.length == 1) {
            return map[ids[0]]
        }
        return defaultOption
    }

    export const COLLISION_CALCULATOR = new CollisionCalculator()
}
