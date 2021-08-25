namespace splitTime.body {
    export class Transporter {
        constructor(public readonly body: Body) {}

        private detectApplicableOtherLevel(from: ILevelLocation2): ILevelLocation2 | null {
            const maxDepth = 20
            let whereLast = from
            for (let i = 0; i < maxDepth; i++) {
                const whereToNext = this._theNextTransport(
                    whereLast.level,
                    whereLast.x,
                    whereLast.y,
                    whereLast.z
                )
                if (whereToNext === null) {
                    if (whereLast === from) {
                        return null
                    }
                    return whereLast
                }
                whereLast = whereToNext
            }
            if (splitTime.debug.ENABLED) {
                console.warn(
                    "Cyclic pointer traces detected on level " +
                        from.level.id +
                        " near (" +
                        from.x +
                        ", " +
                        from.y +
                        ", " +
                        from.z +
                        ")"
                )
            }
            return null
        }

        transportLevelIfApplicable(hintLevelId?: string): void {
            if (this.body.levelLocked) {
                return
            }
            const whereTo = this.detectApplicableOtherLevel(this.body)
            if (whereTo !== null) {
                smoothPut(this.body, whereTo)
            }
        }

        private _theNextTransport(
            levelFrom: splitTime.Level,
            x: number,
            y: number,
            z: number
        ): ILevelLocation2 | null {
            let offsetHash: string | null = null
            var levelTraces = levelFrom.getLevelTraces()
            var left = Math.round(x - this.body.width / 2)
            var topY = Math.round(y - this.body.depth / 2)
            var roundZ = Math.round(z)
            var topZ = roundZ + Math.round(this.body.height)
            const xChecks = [left, left + this.body.width]
            const yChecks = [topY, topY + this.body.depth]
            const zChecks = [roundZ, topZ - 1]
            let pointerOffset: trace.PointerOffset | null = null
            for (const xCheck of xChecks) {
                for (const yCheck of yChecks) {
                    for (const zCheck of zChecks) {
                        const cornerCollisionInfo = new splitTime.level.traces.CollisionInfo(levelFrom)
                        levelTraces.calculatePixelColumnCollisionInfo(
                            cornerCollisionInfo,
                            xCheck,
                            yCheck,
                            zCheck,
                            zCheck + 1,
                            true
                        )

                        const pointerOffsets = cornerCollisionInfo.pointerOffsets
                        // Make sure no pointer trace is something different
                        for (var key in pointerOffsets) {
                            if (offsetHash === null) {
                                offsetHash = key
                            } else if (key !== offsetHash) {
                                return null
                            }
                        }
                        // Make sure the pointer trace actually showed up in the list
                        if (!offsetHash || !pointerOffsets[offsetHash]) {
                            return null
                        }
                        pointerOffset = pointerOffsets[offsetHash]
                    }
                }
            }
            if (!pointerOffset || !trace.isPointerOffsetSignificant(pointerOffset, levelFrom)) {
                return null
            }
            return {
                level: pointerOffset.level,
                x: x + pointerOffset.offsetX,
                y: y + pointerOffset.offsetY,
                z: z + pointerOffset.offsetZ
            }
        }
    }
}
