namespace splitTime {
    /**
     * A pair of bit masks that allow bodies to selectively detect collisions with each other.
     */
    export interface CollisionMask {
        /** a la Godot collision layers, bit mask of collision groups this body belongs to */
        membership: int
        /** a la Godot collision mask, bit mask of collision groups to cross-check */
        search: int
    }
    export const defaultCollisionMask: CollisionMask = {
        membership: 1,
        search: ~0
    }

    interface ApiCollisionInfo {
        blocked: boolean
        bodies: Body[]
        vStepUpEstimate: number
        zBlockedTopEx: number
        targetOffset: trace.PointerOffset | null
    }

    interface MinimalLevel {
        lowestLayerZ: number
    }

    class InternalCollisionInfo implements ApiCollisionInfo {
        blocked: boolean = false
        bodies: Body[] = []
        vStepUpEstimate: number = 0
        zBlockedTopEx: number
        pointerOffsets: (trace.PointerOffset)[] = []

        constructor(
            level: MinimalLevel,
            public targetOffset: trace.PointerOffset | null
        ) {
            this.zBlockedTopEx = level.lowestLayerZ
        }
    }

    class CollisionCalculator {
        private pointerStack: string[] = []

        getEventsInVolume(
            level: splitTime.Level,
            startX: number,
            xPixels: number,
            startY: number,
            yPixels: number,
            startZ: number,
            zPixels: number,
        ): string[] {
            const eventTracesMap = {}
            level
                .getLevelTraces()
                .calculateVolumeEvents(
                    eventTracesMap,
                    Math.floor(startX), Math.ceil(xPixels),
                    Math.floor(startY), Math.ceil(yPixels),
                    Math.floor(startZ), Math.ceil(startZ + zPixels)
                )
            // TODO: Maybe look through pointers too?
            return Object.keys(eventTracesMap)
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
            ignoreBodies: readonly splitTime.Body[] = []
        ): ApiCollisionInfo {
            var collisionInfo = new InternalCollisionInfo(level, null)
            if (level.lowestLayerZ > startZ) {
                collisionInfo.vStepUpEstimate = level.lowestLayerZ - startZ
            }
            if (startX < 0 || startX + xPixels >= level.width || startY < 0 || startY + yPixels >= level.yWidth) {
                collisionInfo.blocked = true
                collisionInfo.zBlockedTopEx = Infinity
                collisionInfo.vStepUpEstimate = Infinity
            }
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
                    startX, xPixels,
                    startY, yPixels,
                    startZ, zPixels
                )
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
                                startX + pointerOffset.offsetX, xPixels,
                                startY + pointerOffset.offsetY, yPixels,
                                startZ + pointerOffset.offsetZ, zPixels
                            )
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
            zPixels: number
        ): InternalCollisionInfo {
            const solidCollisionInfo = new splitTime.level.traces.SolidCollisionInfo(level)
            level
                .getLevelTraces()
                .calculateVolumeSolidCollision(
                    solidCollisionInfo,
                    Math.floor(startX), Math.ceil(xPixels),
                    Math.floor(startY), Math.ceil(yPixels),
                    Math.floor(startZ), Math.ceil(startZ + zPixels)
                )

            const pointerTraceInfo: splitTime.level.traces.PointerTraceInfo = {}
            level
                .getLevelTraces()
                .calculateVolumePointers(
                    pointerTraceInfo,
                    Math.floor(startX), Math.ceil(xPixels),
                    Math.floor(startY), Math.ceil(yPixels),
                    Math.floor(startZ), Math.ceil(startZ + zPixels)
                )

            const offset = chooseTheOneOrDefault(pointerTraceInfo, null)
            const collisionInfo = new InternalCollisionInfo(level, offset)

            collisionInfo.zBlockedTopEx = solidCollisionInfo.zBlockedTopEx
            collisionInfo.vStepUpEstimate = solidCollisionInfo.zBlockedTopEx - startZ
            collisionInfo.blocked =
                solidCollisionInfo.containsSolid && collisionInfo.vStepUpEstimate > 0
            for (const offset of Object.values(pointerTraceInfo)) {
                if (offset !== null) {
                    collisionInfo.pointerOffsets.push(offset)
                }
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
