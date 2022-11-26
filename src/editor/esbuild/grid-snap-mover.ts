import { Coordinates2D } from "api"
import { Vector2D } from "api/math"

// How many pixels before drag will register
const MOVE_THRESHOLD = 8
export class GridSnapMover {
    public readonly originalPoints: readonly Readonly<Vector2D>[]
    private readonly delta: Vector2D = new Vector2D()
    private totalMovement = 0

    constructor(
        private gridCell: Vector2D,
        originalPoints: readonly Readonly<Coordinates2D>[]
    ) {
        if (originalPoints.length === 0) {
            throw new Error("At least one original point required")
        }
        this.originalPoints = originalPoints.map(p => new Vector2D(p.x, p.y))
    }

    applyDelta(dx: number, dy: number): void {
        this.totalMovement += Math.abs(dx) + Math.abs(dy)
        this.delta.x += dx
        this.delta.y += dy
    }

    getSnappedDelta(): Vector2D {
        // Require moving this many pixels before registering any movement
        if (this.totalMovement < MOVE_THRESHOLD) {
            return new Vector2D()
        }

        const snappedPossibilities = this.originalPoints.map(p => {
            const snappedPoint = new Vector2D(
                Math.round((p.x + this.delta.x) / this.gridCell.x) * this.gridCell.x,
                Math.round((p.y + this.delta.y) / this.gridCell.y) * this.gridCell.y
            )
            // Subtract out point to get delta
            return snappedPoint.plus(p.times(-1))
        })
        // Allow original spot to be an option
        let best = new Vector2D(0, 0)
        let bestDist = getDistanceBetween(best, this.delta)
        for (const possibility of snappedPossibilities) {
            const dist = getDistanceBetween(possibility, this.delta)
            if (dist < bestDist) {
                best = possibility
                bestDist = dist
            }
        }
        return best
    }
}

function getDistanceBetween(v1: Vector2D, v2: Vector2D): number {
    const dVector = v1.plus(v2.times(-1))
    return Math.sqrt(dVector.x * dVector.x + dVector.y * dVector.y)
}
