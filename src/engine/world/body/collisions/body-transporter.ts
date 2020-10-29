namespace splitTime.body {
    export class Transporter {
        constructor(public readonly body: Body) {}

        detectApplicableOtherLevel(fromLevel: Level, fromX: number, fromY: number, fromZ: number): ILevelLocation2 | null {
            var whereToNext = this._theNextTransport(
                fromLevel,
                fromX,
                fromY,
                fromZ
            )
            var whereTo = null
            while (whereToNext !== null && whereToNext.level !== fromLevel) {
                whereTo = whereToNext
                whereToNext = this._theNextTransport(
                    whereToNext.level,
                    whereToNext.x,
                    whereToNext.y,
                    whereToNext.z
                )
            }
            var cyclicEnd = whereToNext !== null
            if (cyclicEnd) {
                if (splitTime.debug.ENABLED) {
                    console.warn(
                        "Cyclic pointer traces detected on level " +
                            fromLevel.id +
                            " near (" +
                            fromX +
                            ", " +
                            fromY +
                            ", " +
                            fromZ +
                            ")"
                    )
                }
            } else if (whereTo !== null) {
                return whereTo
            }
            return null
        }

        transportLevelIfApplicable(hintLevelId?: string) {
            const whereTo = this.detectApplicableOtherLevel(
                this.body.getLevel(),
                this.body.getX(),
                this.body.getY(),
                this.body.getZ()
            )
            if (whereTo !== null) {
                smoothPut(this.body, whereTo)
            }
        }

        private _theNextTransport(
            levelFrom: splitTime.Level,
            x: number,
            y: number,
            z: number
        ): { level: splitTime.Level; x: number; y: number; z: number } | null {
            let levelIdTo: string | null = null
            var levelTraces = levelFrom.getLevelTraces()
            var left = Math.round(x - this.body.width / 2)
            var topY = Math.round(y - this.body.depth / 2)
            var roundZ = Math.round(z)
            var topZ = roundZ + Math.round(this.body.height)
            const xChecks = [left, left + this.body.width]
            const yChecks = [topY, topY + this.body.depth]
            const zChecks = [roundZ, topZ - 1]
            let pointerTrace: Trace | null = null
            for (const xCheck of xChecks) {
                for (const yCheck of yChecks) {
                    for (const zCheck of zChecks) {
                        const cornerCollisionInfo = new splitTime.level.traces.CollisionInfo()
                        levelTraces.calculatePixelColumnCollisionInfo(
                            cornerCollisionInfo,
                            xCheck,
                            yCheck,
                            zCheck,
                            zCheck + 1,
                            true
                        )

                        const pointerTraces = cornerCollisionInfo.pointerTraces
                        // Make sure no pointer trace is something different
                        for (var key in pointerTraces) {
                            if (levelIdTo === null) {
                                levelIdTo = key
                            } else if (key !== levelIdTo) {
                                return null
                            }
                        }
                        // Make sure the pointer trace actually showed up in the list
                        if (!levelIdTo || !pointerTraces[levelIdTo]) {
                            return null
                        }
                        pointerTrace = pointerTraces[levelIdTo]
                    }
                }
            }
            if (!pointerTrace) {
                return null
            }
            const pointerOffset = pointerTrace.getPointerOffset()
            return {
                level: pointerOffset.level,
                x: x + pointerOffset.offsetX,
                y: y + pointerOffset.offsetY,
                z: z + pointerOffset.offsetZ
            }
        }
    }
}
