namespace splitTime.math {

    export class Polygon {
        constructor(readonly vertices: Vector2D[]) {

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
            function calcDAngle(compareRadians: number) {
                const compareRadiansPrime = mod(compareRadians, 2 * Math.PI)
                return Math.abs(compareRadiansPrime - oppositeRadians)
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
            const prevEdgeDAngleLeft = calcDAngle(prevEdge.rotate(Math.PI / 2).angle)
            const prevEdgeDAngleRight = calcDAngle(prevEdge.rotate(-Math.PI / 2).angle)
            if (prevEdgeDAngleLeft < bestAngle || prevEdgeDAngleRight < bestAngle) {
                return measurement.midpoint(bestVertex, prevVertex)
            }

            const nextVertex = that.vertices[mod(bestVertexI + 1, that.vertices.length)]
            const nextEdge = nextVertex.plus(bestVertex.times(-1))
            const nextEdgeDAngleLeft = calcDAngle(nextEdge.rotate(Math.PI / 2).angle)
            const nextEdgeDAngleRight = calcDAngle(nextEdge.rotate(-Math.PI / 2).angle)
            if (nextEdgeDAngleLeft < bestAngle || nextEdgeDAngleRight < bestAngle) {
                return measurement.midpoint(bestVertex, nextVertex)
            }

            return bestVertex
        }
    }
}