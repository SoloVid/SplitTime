namespace splitTime.level {
    export function forTerrainPoints(
        level: Level,
        start: Coordinates3D,
        end: Coordinates3D,
        callback: (collisionInfo: traces.CollisionInfo) => void | STOP_CALLBACKS_TYPE
    ): void {
        splitTime.bresenham.forEach3DPoint(
            start,
            end,
            p => {
                const collisionInfo = new traces.CollisionInfo()
                level.getLevelTraces().calculatePixelColumnCollisionInfo(
                    collisionInfo,
                    Math.floor(p.x),
                    Math.floor(p.y),
                    Math.floor(p.z),
                    Math.ceil(p.z + 1)
                )
                const result = callback(collisionInfo)
                if (result === STOP_CALLBACKS) {
                    return splitTime.bresenham.ReturnCode.EXIT_EARLY
                }
                return splitTime.bresenham.ReturnCode.CONTINUE
            }
        )
    }
}