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
            var levelTraces = levelFrom.getLevelTraces()
            var left = Math.round(x - this.body.width / 2)
            var topY = Math.round(y - this.body.depth / 2)

            const pointerInfo: splitTime.level.traces.PointerTraceInfo = {}
            levelTraces.calculateVolumePointers(
                pointerInfo,
                left, this.body.width,
                topY, this.body.depth,
                Math.floor(z), Math.ceil(z + this.body.height)
            )

            const offsetHashes = Object.keys(pointerInfo)

            if (offsetHashes.length === 0 || offsetHashes.length > 1) {
                return null
            }

            const pointerOffset = pointerInfo[offsetHashes[0]]
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
