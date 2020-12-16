namespace splitTime {
    interface PointerOffset {
        level: splitTime.Level
        offsetX: number
        offsetY: number
        offsetZ: number
    }

    export class Trace {
        // vertices: Coordinates2D[] = []
        level: splitTime.Level | null = null
        offsetX: number | null = null
        offsetY: number | null = null
        offsetZ: number | null = null

        constructor(readonly spec: trace.TraceSpec) {
        }

        load(level: Level, world: World) {
            // this.vertices = trace.extractCoordinates(this.spec.vertices, level.getPositionMap())
            this.level = this.spec.level ? world.getLevel(this.spec.level) : null
            this.offsetX = this.spec.offsetX
            this.offsetY = this.spec.offsetY
            this.offsetZ = this.spec.offsetZ
        }

        getPointerOffset(): PointerOffset {
            assert(!!this.level, "Pointer trace must have a level")
            assert(!!this.offsetX || this.offsetX === 0, "Pointer trace must have offsetX")
            assert(!!this.offsetY || this.offsetY === 0, "Pointer trace must have offsetY")
            assert(!!this.offsetZ || this.offsetZ === 0, "Pointer trace must have offsetZ")
            return this as PointerOffset
        }

        getLevel(): Level {
            if (!this.level) {
                throw new Error("Trace does not have a Level")
            }
            return this.level
        }

        getTargetPosition(): Position {
            if (!this.spec.targetPosition) {
                throw new Error("Trace does not have a target Position")
            }
            return this.getLevel().getPosition(this.spec.targetPosition)
        }

        getLocationId() {
            return this.spec.getLocationId()
        }

        calculateStairsExtremes(): { top: Vector2D, bottom: Vector2D } {
            return this.spec.calculateStairsExtremes()
        }
    }
}
