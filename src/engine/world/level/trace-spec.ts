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
            }
            return trace
        }

        getLocationId() {
            return (
                this.level +
                ":" +
                this.offsetX +
                "," +
                this.offsetY +
                "," +
                this.offsetZ
            )
        }

        drawColor(
            target: GenericCanvasRenderingContext2D | null,
            extraBuffer: splitTime.Canvas,
            color: string | CanvasGradient | ((x: int, y: int) => light.Color),
            offsetPos = { x: 0, y: 0 }
        ) {
            const nonPosVertices: (Coordinates2D | null)[] = []
            for (const v of this.vertices) {
                if (typeof v === "string") {
                    throw new Error("Refusing to draw trace that has positions in it")
                }
                nonPosVertices.push(v)
            }
            const pointsArray = nonPosVertices
                .map(t => t === null ? null : new Coordinates2D(t.x + offsetPos.x, t.y + offsetPos.y))
            utils.drawShapeOpaque(pointsArray, target, extraBuffer, color)
        }

        createStairsGradient(
            ctx: GenericCanvasRenderingContext2D
        ): CanvasGradient {
            const stairsExtremes = this.calculateStairsExtremes()
            return ctx.createLinearGradient(
                stairsExtremes.bottom.x, stairsExtremes.bottom.y,
                stairsExtremes.top.x, stairsExtremes.top.y
            )
        }

        calculateStairsExtremes(): { top: Vector2D, bottom: Vector2D } {
            const points = ensureNoPositions(this.vertices)
                .filter(v => v !== null)
                .map(v => new Vector2D(v!.x, v!.y))
            const polygon = new math.Polygon(points)
            assert(this.direction !== null, "Stairs must have a direction")
            const top = polygon.findPointToward(direction.toRadians(this.direction))
            const bottom = polygon.findPointToward(direction.toRadians(this.direction) + Math.PI)
            return {
                top: top,
                bottom: bottom
            }
        }
    }
}
