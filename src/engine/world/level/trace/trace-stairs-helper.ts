namespace splitTime.trace {

    export function isPointAboveStairs(
        point: Coordinates3D,
        spec: TraceSpec,
        pointsArray2D: (Coordinates2D | null)[]
    ): boolean {
        if (point.z < spec.z) {
            return false
        }
        if (point.z > spec.z + spec.height) {
            return true
        }

        const stairsPlane = calculateStairsPlane(spec, pointsArray2D)
        assert(stairsPlane.length >= 3, "Stairs must have at least three points")
        const v1 = new Vector3D(stairsPlane[0].x, stairsPlane[0].y, stairsPlane[0].z)
        const v2 = new Vector3D(stairsPlane[1].x, stairsPlane[1].y, stairsPlane[1].z)
        const v3 = new Vector3D(stairsPlane[2].x, stairsPlane[2].y, stairsPlane[2].z)
        // Two vectors along plane
        const s1 = v1.plus(v2.times(-1))
        const s2 = v3.plus(v2.times(-1))
        const normal = s1.cross(s2)
        const upSign = normal.dot(new Vector3D(0, 0, 1))

        const pointVector = new Vector3D(point.x, point.y, point.z)
        const pointRelativeToPlane = pointVector.plus(v1.times(-1))
        const pointProjectedOntoNormal = normal.dot(pointRelativeToPlane)
        const positiveIfSignsSame = upSign * pointProjectedOntoNormal
        // The equal to zero part is trying to be a little more inclusive
        return positiveIfSignsSame >= 0
    }

    /**
     * Calculate an array of coordinates representing the slanted plane of the stairs
     * @param spec the stairs trace
     * @param pointsArray2D the points of the trace, with any positions mapped to coordinates
     */
    export function calculateStairsPlane(spec: TraceSpec, pointsArray2D: (Coordinates2D | null)[]): Coordinates3D[] {
        const extremes = spec.calculateStairsExtremes()
        const stairsVector = new splitTime.Vector2D(extremes.top.x - extremes.bottom.x, extremes.top.y - extremes.bottom.y)
        const stairsLength = stairsVector.magnitude
        const stairsUnitVector = stairsVector.times(1 / stairsLength)
        const totalDZ = spec.height
        const maybeNullPoints = pointsArray2D.map(point => {
            if(!point) {
                return point
            }
            const partUpVector = new splitTime.Vector2D(point.x - extremes.bottom.x, point.y - extremes.bottom.y)
            const distanceUp = partUpVector.dot(stairsUnitVector)
            // const distanceUp = stairsVector.times(partUpVector.dot(stairsVector) / (stairsLength * stairsLength)).magnitude
            const height = Math.min(Math.round(totalDZ * (distanceUp / stairsLength)), totalDZ)
            const point3D = {
                x: point.x,
                y: point.y,
                z: spec.z + height
            }
            return point3D
        })
        const firstPoint = maybeNullPoints[0]
        assert(firstPoint !== null, "First point can't be close")
        return maybeNullPoints.map(p => {
            if (p === null) {
                return new Coordinates3D(firstPoint.x, firstPoint.y, firstPoint.z)
            }
            return p
        })
    }
}
