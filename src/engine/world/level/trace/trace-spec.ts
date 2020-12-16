namespace splitTime.trace {
    export class TraceSpec {
        type: string
        vertices: TracePointSpec[]
        z: number = 0
        height: number = 0
        level: string = ""
        offsetX: number = 0
        offsetY: number = 0
        offsetZ: number = 0
        targetPosition: string = ""
        direction: direction_t | null = null
        eventId: string = ""

        constructor(type: string, vertices: string) {
            this.type = type
            this.vertices = interpretPointString(vertices)
        }

        /**
         * Basically a constructor for Trace from level file data
         */
        static fromRaw(
            rawTrace: splitTime.level.file_data.Trace
        ): TraceSpec {
            var trace = new TraceSpec(rawTrace.type, rawTrace.vertices)
            trace.z = +rawTrace.z
            trace.height = +rawTrace.height
            switch (trace.type) {
                case Type.STAIRS:
                    trace.direction = direction.interpret(rawTrace.direction)
                    break
                case Type.EVENT:
                    trace.eventId = rawTrace.event
                    break
                case Type.POINTER:
                case Type.TRANSPORT:
                    trace.level = rawTrace.level
                    trace.offsetX = rawTrace.offsetX
                    trace.offsetY = rawTrace.offsetY
                    trace.offsetZ = rawTrace.offsetZ
                    break
                case Type.SEND:
                    trace.level = rawTrace.level
                    trace.targetPosition = rawTrace.targetPosition
                    break
            }
            return trace
        }

        getLocationId() {
            return [
                this.level,
                this.offsetX,
                this.offsetY,
                this.offsetZ,
                this.targetPosition
            ].join(",")
        }

        calculateStairsExtremes(): { top: Vector2D, bottom: Vector2D } {
            const polygon = this.getPolygon()
            assert(this.direction !== null, "Stairs must have a direction")
            const top = polygon.findPointToward(direction.toRadians(this.direction))
            const bottom = polygon.findPointToward(direction.toRadians(this.direction) + Math.PI)
            return {
                top: top,
                bottom: bottom
            }
        }

        getPolygon(): math.Polygon {
            const points = ensureNoPositions(this.vertices)
                .filter(v => v !== null)
                .map(v => new Vector2D(v!.x, v!.y))
            return new math.Polygon(points)
        }
    }
}
