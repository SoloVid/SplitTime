namespace splitTime.math {

    export class Polygon {
        private readonly isClockwise: boolean
        constructor(readonly vertices: readonly Vector2D[]) {
            assert(this.vertices.length >= 3, "Polygon requires at least three vertices")
            this.isClockwise = this.checkClockwise()
        }

        // See https://stackoverflow.com/a/1165943/4639640
        // or https://www.element84.com/blog/determining-the-winding-of-a-polygon-given-as-a-set-of-ordered-points
        private checkClockwise(): boolean {
            const twiceArea = this.vertices.reduce((sum, v, i) => {
                const nextV = this.vertices[(i + 1) % this.vertices.length]
                return sum + (nextV.x - v.x) * (nextV.y + v.y)
            }, 0)
            return twiceArea > 0
        }

        /**
         * Calculate a point on the convex polygon that is thought
         * to be most in the direction of the radians parameter.
         * In other words, if direction is PI / 4, this method
         * would attempt to return the most top-right vertex
         * or edge midpoint of the polygon.
         *
         * @param direction direction (in radians) to choose point
         * @returns a vertex or edge midpoint most closely associated with the direction
         */
        findPointToward(direction: number): Vector2D {
            const oppositeRadians = mod(direction + Math.PI, 2 * Math.PI)
            // See https://stackoverflow.com/a/7869457/4639640
            function calcDAngle(compareRadians: number) {
                const initialDifference = compareRadians - oppositeRadians
                return Math.abs(mod(initialDifference + Math.PI, 2 * Math.PI) - Math.PI)
            }

            const that = this
            // Get a bisector of the vertex so we can tell what direction inward the vertex is pointing
            function getInternalAngleBisectorAngle(iPoint: int): number {
                const refVertex = that.vertices[iPoint]
                const prevVertex = that.vertices[mod(iPoint - 1, that.vertices.length)]
                const nextVertex = that.vertices[mod(iPoint + 1, that.vertices.length)]
                const bisector = angleBisector(prevVertex, nextVertex, refVertex)
                return bisector.angle
            }

            // Find the vertex that most closely aligns with the angle
            let bestAngle = MAX_SAFE_INTEGER
            let bestVertexI = 0
            for (let i = 0; i < this.vertices.length; i++) {
                const bisectorAngle = getInternalAngleBisectorAngle(i)
                const dAngle = calcDAngle(bisectorAngle)
                if (dAngle < bestAngle) {
                    bestAngle = dAngle
                    bestVertexI = i
                }
            }

            const bestVertex = that.vertices[bestVertexI]

            // See if one of the two adjacent edges aligns better with the angle
            const prevVertex = that.vertices[mod(bestVertexI - 1, that.vertices.length)]
            const prevEdge = prevVertex.plus(bestVertex.times(-1))
            const prevRotate = this.isClockwise ? +1 : -1
            const prevEdgeDAngle = calcDAngle(prevEdge.rotate(prevRotate * Math.PI / 2).angle)
            if (prevEdgeDAngle < bestAngle) {
                return measurement.midpoint(bestVertex, prevVertex)
            }

            const nextVertex = that.vertices[mod(bestVertexI + 1, that.vertices.length)]
            const nextEdge = nextVertex.plus(bestVertex.times(-1))
            const nextRotate = -prevRotate
            const nextEdgeDAngle = calcDAngle(nextEdge.rotate(nextRotate * Math.PI / 2).angle)
            if (nextEdgeDAngle < bestAngle) {
                return measurement.midpoint(bestVertex, nextVertex)
            }

            return bestVertex
        }
    }
}