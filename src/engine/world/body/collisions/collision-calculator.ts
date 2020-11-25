namespace splitTime {
    /**
     * A pair of bit masks that allow bodies to selectively detect collisions with each other.
     */
    export interface CollisionMask {
        // a la Godot collision layers, bit mask of collision groups this body belongs to
        membership: int
        // a la Godot collision mask, bit mask of collision groups to cross-check
        search: int
    }

    interface ApiCollisionInfo {
        blocked: boolean
        bodies: Body[]
        vStepUpEstimate: number
        zBlockedTopEx: number
        events: string[]
        targetLevel: Level
    }

    class InternalCollisionInfo implements ApiCollisionInfo {
        blocked: boolean = false
        bodies: Body[] = []
        vStepUpEstimate: number = 0
        zBlockedTopEx: number = 0
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
            collisionMask: CollisionMask,
            level: splitTime.Level,
            startX: number,
            xPixels: number,
            startY: number,
            yPixels: number,
            startZ: number,
            zPixels: number,
            ignoreBodies: splitTime.Body[] = [],
            ignoreEvents: boolean = false
        ): ApiCollisionInfo {
            var collisionInfo = new InternalCollisionInfo(level)
            function handleFoundBody(otherBody: Body) {
                for (const ignoreBody of ignoreBodies) {
                    if (otherBody === ignoreBody) {
                        return
                    }
                }

                collisionInfo.blocked = true
                collisionInfo.bodies.push(otherBody)
                collisionInfo.zBlockedTopEx =
                    otherBody.getZ() + otherBody.height
                collisionInfo.vStepUpEstimate =
                    otherBody.getZ() + otherBody.height - startZ
            }
            level.getCellGrid().forEachBody(
                collisionMask,
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
                    zPixels,
                    ignoreEvents
                )
                collisionInfo.events = traceCollision.events
                collisionInfo.targetLevel = traceCollision.targetLevel
                collisionInfo.blocked = traceCollision.blocked
                collisionInfo.zBlockedTopEx =
                    traceCollision.zBlockedTopEx
                if (traceCollision.blocked) {
                    collisionInfo.vStepUpEstimate =
                        traceCollision.vStepUpEstimate
                } else {
                    const targetLevels: { [levelId: string]: Level } = {}
                    for (const pointerTrace of traceCollision.pointerTraces) {
                        const pointerOffset = pointerTrace.getPointerOffset()
                        if (this._levelIdStack.indexOf(pointerOffset.level.id) >= 0) {
                            continue;
                        }
                        this._levelIdStack.push(level.id)
                        try {
                            var otherLevelCollisionInfo = this.calculateVolumeCollision(
                                collisionMask,
                                pointerOffset.level,
                                startX + pointerOffset.offsetX,
                                xPixels,
                                startY + pointerOffset.offsetY,
                                yPixels,
                                startZ + pointerOffset.offsetZ,
                                zPixels
                            )
                            // TODO: maybe add events?
                            // Note that the sign on the offset is flipped here
                            // because we are coming back from the other level's
                            // coordinates to our own.
                            const backTranslatedZBlockedTopEx =
                                otherLevelCollisionInfo.zBlockedTopEx -
                                pointerOffset.offsetZ
                            collisionInfo.zBlockedTopEx = Math.max(collisionInfo.zBlockedTopEx,
                                backTranslatedZBlockedTopEx)
                            if (otherLevelCollisionInfo.blocked) {
                                collisionInfo.blocked = true
                                collisionInfo.bodies =
                                    otherLevelCollisionInfo.bodies
                                collisionInfo.vStepUpEstimate =
                                    otherLevelCollisionInfo.vStepUpEstimate
                                break
                            }
                            // If we had decided this other level was our target, see if it wants to pawn us off
                            if (pointerOffset.level === collisionInfo.targetLevel) {
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
            zPixels: number,
            ignoreEvents: boolean
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
                    Math.ceil(startZ + zPixels),
                    ignoreEvents
                )

            const targetLevel = chooseTheOneOrDefault(originCollisionInfo.levels, level)
            const collisionInfo = new InternalCollisionInfo(targetLevel || level)

            collisionInfo.zBlockedTopEx = originCollisionInfo.zBlockedTopEx
            collisionInfo.vStepUpEstimate =
                originCollisionInfo.zBlockedTopEx - startZ
            collisionInfo.blocked =
                originCollisionInfo.containsSolid && collisionInfo.vStepUpEstimate > 0
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
