namespace splitTime.trace {

    export class StairsPlane {
        private readonly v1: Vector3D
        private readonly normal: Vector3D
        private readonly upSign: number

        constructor(
            private readonly spec: TraceSpec,
            pointsArray2D: (Coordinates2D | null)[]
        ) {
            const stairsPlane = calculateStairsPlane(spec, pointsArray2D)
            assert(stairsPlane.length >= 3, "Stairs must have at least three points")
            this.v1 = new Vector3D(stairsPlane[0].x, stairsPlane[0].y, stairsPlane[0].z)
            const v2 = new Vector3D(stairsPlane[1].x, stairsPlane[1].y, stairsPlane[1].z)
            const v3 = new Vector3D(stairsPlane[2].x, stairsPlane[2].y, stairsPlane[2].z)
            // Two vectors along plane
            const s1 = this.v1.plus(v2.times(-1))
            const s2 = v3.plus(v2.times(-1))
            this.normal = s1.cross(s2)
            this.upSign = this.normal.dot(new Vector3D(0, 0, 1))
        }

        isPointAboveStairs(point: Coordinates3D): boolean {
            if (point.z < this.spec.offsetZ) {
                return false
            }
            if (point.z >= this.spec.offsetZ + this.spec.height) {
                return true
            }
            const pointVector = new Vector3D(point.x, point.y, point.z)
            const pointRelativeToPlane = pointVector.plus(this.v1.times(-1))
            const pointProjectedOntoNormal = this.normal.dot(pointRelativeToPlane)
            const positiveIfSignsSame = this.upSign * pointProjectedOntoNormal
            // The equal to zero part is trying to be a little more inclusive
            return positiveIfSignsSame >= 0
        }
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
                z: spec.offsetZ + height
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

    /**
     * Add a custom rendering order for the body to order based on
     * whether or not the other body is fully above the stairs slope plane.
     *
     * The intention is that a prop post processor can call this method.
     * Such a prop post processor should be set on a montage which has
     * a graphic of the stairs/ramp and a single stairs trace.
     * In order to bypass the default rendering order, you'll need to
     * make the prop's body completely cover the cuboid space of the stairs
     * and then also have the prop post processor turn off collisions for the body.
     *
     * Note that using this rendering scheme fails for cases where bodies will be
     * positioned in front (higher y) of the stairs but not on top.
     * For this reason, this method currently only really works for stairs on the back-side
     * of some other larger solid.
     * @param spriteBody 
     */
    export function applyStairsSlopePlaneRenderingOrder(spriteBody: SpriteBody): void {
        const stairsTrace = findStairsTrace(spriteBody)
        stairsTrace.offset = new Coordinates3D(spriteBody.body.x, spriteBody.body.y, spriteBody.body.z)
        const strippedPoints = stairsTrace.getOffsetVertices().filter((v): v is (Coordinates2D | null) => typeof v !== "string")
        const stairsPlane = new StairsPlane(stairsTrace, strippedPoints)
        spriteBody.body.shouldRenderInFrontCustom = otherBody => {
            return !stairsPlane.isPointAboveStairs(otherBody)
        }
    }

    function findStairsTrace(spriteBody: SpriteBody): TraceSpec {
        const collage = G.ASSETS.collages.get(spriteBody.sprite.collageId)
        const montage = spriteBody.sprite.defaultMontageId ? collage.getMontage(spriteBody.sprite.defaultMontageId) : collage.getDefaultMontage()
        for (const trace of montage.traces) {
            if (trace.type === Type.STAIRS) {
                return TraceSpec.fromRaw(trace)
            }
        }
        throw new Error("No stairs trace found in montage")
    }
}
