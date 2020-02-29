namespace SplitTime.body {
    export class Transporter {
        constructor(public readonly body: Body) {}

        transportLevelIfApplicable(levelId: string) {
            var currentLevel = this.body.getLevel()
            var whereToNext = this._theNextTransport(
                currentLevel,
                levelId,
                this.body.getX(),
                this.body.getY(),
                this.body.getZ()
            )
            var whereTo = null
            while (whereToNext !== null && whereToNext.level !== currentLevel) {
                whereTo = whereToNext
                whereToNext = this._theNextTransport(
                    whereToNext.level,
                    null,
                    whereToNext.x,
                    whereToNext.y,
                    whereToNext.z
                )
            }
            var cyclicEnd = whereToNext !== null
            if (cyclicEnd) {
                if (SplitTime.debug.ENABLED) {
                    console.warn(
                        "Cyclic pointer traces detected on level " +
                            currentLevel.id +
                            " near (" +
                            this.body.getX() +
                            ", " +
                            this.body.getY() +
                            ", " +
                            this.body.getZ() +
                            ")"
                    )
                }
            } else if (whereTo !== null) {
                this.body.put(whereTo.level, whereTo.x, whereTo.y, whereTo.z)
            }
        }

        private _theNextTransport(
            levelFrom: SplitTime.Level,
            levelIdTo: string | null,
            x: number,
            y: number,
            z: number
        ): { level: SplitTime.Level; x: number; y: number; z: number } | null {
            var levelTraces = levelFrom.getLevelTraces()
            var cornerCollisionInfos = [
                new SplitTime.level.traces.CollisionInfo(),
                new SplitTime.level.traces.CollisionInfo(),
                new SplitTime.level.traces.CollisionInfo(),
                new SplitTime.level.traces.CollisionInfo()
            ]
            var left = Math.round(x - this.body.baseLength / 2)
            var topY = Math.round(y - this.body.baseLength / 2)
            var roundBase = Math.round(this.body.baseLength)
            var roundZ = Math.round(z)
            var topZ = roundZ + Math.round(this.body.height)
            levelTraces.calculatePixelColumnCollisionInfo(
                cornerCollisionInfos[0],
                left,
                topY,
                roundZ,
                topZ
            )
            levelTraces.calculatePixelColumnCollisionInfo(
                cornerCollisionInfos[1],
                left,
                topY + roundBase,
                roundZ,
                topZ
            )
            levelTraces.calculatePixelColumnCollisionInfo(
                cornerCollisionInfos[2],
                left + roundBase,
                topY,
                roundZ,
                topZ
            )
            levelTraces.calculatePixelColumnCollisionInfo(
                cornerCollisionInfos[3],
                left + roundBase,
                topY + roundBase,
                roundZ,
                topZ
            )
            for (var i = 0; i < cornerCollisionInfos.length; i++) {
                for (var key in cornerCollisionInfos[i].pointerTraces) {
                    if (levelIdTo === null) {
                        levelIdTo = key
                    } else if (key !== levelIdTo) {
                        return null
                    }
                }
                if (
                    !levelIdTo ||
                    !cornerCollisionInfos[i].pointerTraces[levelIdTo]
                ) {
                    return null
                }
            }
            if (!levelIdTo) {
                return null
            }
            var pointerTrace = cornerCollisionInfos[0].pointerTraces[levelIdTo]
            if (!pointerTrace.level) {
                // FTODO: re-evaluate
                return null
            }
            return {
                level: pointerTrace.level,
                x: x + pointerTrace.offsetX,
                y: y + pointerTrace.offsetY,
                z: z + pointerTrace.offsetZ
            }
        }
    }
}