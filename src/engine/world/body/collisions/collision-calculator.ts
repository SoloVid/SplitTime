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
        targetOffset: trace.PointerOffset | null
    }

    class InternalCollisionInfo implements ApiCollisionInfo {
        blocked: boolean = false
        bodies: Body[] = []
        vStepUpEstimate: number = 0
        zBlockedTopEx: number = 0
        events: string[] = []
        pointerOffsets: (trace.PointerOffset)[] = []

        constructor(
            public targetOffset: trace.PointerOffset | null
        ) {}
    }

    class CollisionCalculator {
        private pointerStack: string[] = []

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
            var collisionInfo = new InternalCollisionInfo(null)
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
                collisionInfo.targetOffset = traceCollision.targetOffset
                collisionInfo.blocked = traceCollision.blocked
                collisionInfo.zBlockedTopEx =
                    traceCollision.zBlockedTopEx
                if (traceCollision.blocked) {
                    collisionInfo.vStepUpEstimate =
                        traceCollision.vStepUpEstimate
                } else {
                    const pointerOffsets: { [id: string]: trace.PointerOffset } = {}
                    for (const pointerOffset of traceCollision.pointerOffsets) {
                        const offsetId = pointerOffset.getOffsetHash()
                        if (this.pointerStack.indexOf(offsetId) >= 0) {
                            continue
                        }
                        this.pointerStack.push(offsetId)
                        try {
                            const otherLevelCollisionInfo = this.calculateVolumeCollision(
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
                            const thisTargetOffset = collisionInfo.targetOffset
                            const nextTargetOffset = otherLevelCollisionInfo.targetOffset
                            if (thisTargetOffset !== null && nextTargetOffset !== null && pointerOffset.getOffsetHash() === thisTargetOffset.getOffsetHash()) {
                                pointerOffsets[nextTargetOffset.getOffsetHash()] = nextTargetOffset
                            }
                        } finally {
                            this.pointerStack.pop()
                        }
                    }
                    collisionInfo.targetOffset = chooseTheOneOrDefault(pointerOffsets, collisionInfo.targetOffset)
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

            const offset = chooseTheOneOrDefault(originCollisionInfo.pointerOffsets, null)
            const collisionInfo = new InternalCollisionInfo(offset)

            collisionInfo.zBlockedTopEx = originCollisionInfo.zBlockedTopEx
            collisionInfo.vStepUpEstimate =
                originCollisionInfo.zBlockedTopEx - startZ
            collisionInfo.blocked =
                originCollisionInfo.containsSolid && collisionInfo.vStepUpEstimate > 0
            for (let id in originCollisionInfo.pointerOffsets) {
                const offset = originCollisionInfo.pointerOffsets[id]
                if (offset !== null) {
                    collisionInfo.pointerOffsets.push(offset)
                }
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
