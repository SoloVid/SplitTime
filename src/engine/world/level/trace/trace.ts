namespace splitTime {
    export namespace trace {
        export interface PointerOffset {
            level: splitTime.Level
            offsetX: number
            offsetY: number
            offsetZ: number
            getOffsetHash(): string
        }

        export function isPointerOffsetSignificant(pointerOffset: PointerOffset | null, startLevel: Level): boolean {
            if (pointerOffset === null) {
                return false
            }
            if (pointerOffset.level !== startLevel) {
                return true
            }
            return pointerOffset.offsetX !== 0 || pointerOffset.offsetY !== 0 || pointerOffset.offsetZ !== 0
        }
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
            this.level = this.spec.linkLevel ? world.getLevel(this.spec.linkLevel) : null
            this.offsetX = this.spec.linkOffsetX
            this.offsetY = this.spec.linkOffsetY
            this.offsetZ = this.spec.linkOffsetZ
        }

        getPointerOffset(): trace.PointerOffset {
            assert(!!this.level, "Pointer trace must have a level")
            assert(!!this.offsetX || this.offsetX === 0, "Pointer trace must have offsetX")
            assert(!!this.offsetY || this.offsetY === 0, "Pointer trace must have offsetY")
            assert(!!this.offsetZ || this.offsetZ === 0, "Pointer trace must have offsetZ")
            return this as trace.PointerOffset
        }

        getLevel(): Level {
            if (!this.level) {
                throw new Error("Trace does not have a Level")
            }
            return this.level
        }

        getTargetPosition(): Position {
            if (!this.spec.linkPosition) {
                throw new Error("Trace does not have a target Position")
            }
            return this.getLevel().getPosition(this.spec.linkPosition)
        }

        getOffsetHash() {
            return this.spec.getOffsetHash()
        }

        calculateStairsExtremes(): { top: Vector2D, bottom: Vector2D } {
            return this.spec.calculateStairsExtremes()
        }
    }
}
