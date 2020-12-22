namespace splitTime.trace {
    export class TraceSpec {
        type: string
        vertices: TracePointSpec[]
        z: number = 0
        height: number = 0
        linkLevel: string = ""
        linkOffsetX: number = 0
        linkOffsetY: number = 0
        linkOffsetZ: number = 0
        linkPosition: string = ""
        private offsetHash: string = ""
        direction: direction_t | null = null
        eventId: string = ""

        /** variable offset to apply to all coordinates, e.g. position of body if spec is relative */
        offset: Coordinates3D = new Coordinates3D()

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
                    trace.linkLevel = rawTrace.level
                    trace.linkOffsetX = rawTrace.offsetX
                    trace.linkOffsetY = rawTrace.offsetY
                    trace.linkOffsetZ = rawTrace.offsetZ
                    trace.generateOffsetHash()
                    break
                case Type.SEND:
                    trace.linkLevel = rawTrace.level
                    trace.linkPosition = rawTrace.targetPosition
                    trace.generateOffsetHash()
                    break
            }
            return trace
        }

        getOffsetHash() {
            return this.offsetHash
        }

        private generateOffsetHash() {
            this.offsetHash = [
                this.linkLevel,
                this.linkOffsetX,
                this.linkOffsetY,
                this.linkOffsetZ,
                this.linkPosition
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

        /** z value of trace spec with offset applied */
        get offsetZ(): number {
            return this.z + this.offset.z
        }

        /** vertices of trace spec with offset applied */
        getOffsetVertices(): TracePointSpec[] {
            return this.vertices.map(v => {
                if (instanceOf.Coordinates2D(v)) {
                    return new Coordinates2D(v.x + this.offset.x, v.y + this.offset.y)
                }
                return v
            })
        }

        getPolygon(): math.Polygon {
            const points = ensureNoPositions(this.getOffsetVertices())
                .filter(v => v !== null)
                .map(v => new Vector2D(v!.x, v!.y))
            return new math.Polygon(points)
        }
    }
}
