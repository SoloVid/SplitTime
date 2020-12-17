namespace splitTime.trace {
    const backward = new Vector3D(0, -1, 0)
    export class TraceVerticalPlaneDivide {
        private readonly v1: Vector3D
        private readonly normal: Vector3D
        private readonly backSign: number

        constructor(
            private readonly spec: TraceSpec
        ) {
            const basePoly = spec.getPolygon()
            const xExtremes = splitTime.math.polygon.getXExtremes(basePoly)
            this.v1 = new Vector3D(xExtremes.left.x, xExtremes.left.y, spec.z)
            const v2 = new Vector3D(xExtremes.right.x, xExtremes.right.y, spec.z)
            const v3 = new Vector3D(this.v1.x, this.v1.y, spec.z + spec.height)
            // Two vectors along plane
            const s1 = this.v1.plus(v2.times(-1))
            const s2 = v3.plus(v2.times(-1))
            this.normal = s1.cross(s2)
            this.backSign = this.normal.dot(backward)
        }

        isPointBehindPlane(point: Coordinates3D): boolean {
            const pointVector = new Vector3D(point.x, point.y, point.z)
            const pointRelativeToPlane = pointVector.plus(this.v1.times(-1))
            const pointProjectedOntoNormal = this.normal.dot(pointRelativeToPlane)
            const positiveIfSignsSame = this.backSign * pointProjectedOntoNormal
            return positiveIfSignsSame > 0
        }
    }

    /**
     * Add a custom rendering order for the body to order based on
     * whether or not the other body is behind the best guess vertical plane.
     *
     * The intention is that a prop post processor can call this method.
     * Such a prop post processor should be set on a montage which has
     * a single trace whose left-most and right-most points plus the height
     * entail where the rendering order should divide.
     * In order to bypass the default rendering order, you'll need to
     * make the prop's body completely cover the cuboid space of the stairs
     * and then also have the prop post processor turn off collisions for the body.
     *
     * For best results, the trace should be a convex polygon.
     */
    export function applyVerticalPlaneRenderingOrder(spriteBody: SpriteBody): void {
        const stairsTrace = findFirstTrace(spriteBody)
        stairsTrace.offset = new Coordinates3D(spriteBody.body.x, spriteBody.body.y, spriteBody.body.z)
        const verticalPlane = new TraceVerticalPlaneDivide(stairsTrace)
        spriteBody.body.shouldRenderInFrontCustom = otherBody => {
            return verticalPlane.isPointBehindPlane(otherBody)
        }
    }

    function findFirstTrace(spriteBody: SpriteBody): TraceSpec {
        const collage = G.ASSETS.collages.get(spriteBody.sprite.collageId)
        const montage = spriteBody.sprite.defaultMontageId ? collage.getMontage(spriteBody.sprite.defaultMontageId) : collage.getDefaultMontage()
        assert(montage.traces.length === 1, "Montage must have a single trace")
        return TraceSpec.fromRaw(montage.traces[0])
    }
}