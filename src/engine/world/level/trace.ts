namespace splitTime {
    interface PointerOffset {
        level: splitTime.Level
        offsetX: number
        offsetY: number
        offsetZ: number
    }

    export class Trace {
        type: string
        vertices: string
        z: number
        height: number
        level: splitTime.Level | null
        offsetX: number | null
        offsetY: number | null
        offsetZ: number | null
        direction: direction_t | null
        eventId: string | null

        constructor(type: string, vertices: string) {
            this.type = type
            this.vertices = vertices
            this.z = 0
            this.height = 0
            this.level = null
            this.offsetX = null
            this.offsetY = null
            this.offsetZ = null
            this.direction = null
            this.eventId = null
        }

        /**
         * Basically a constructor for Trace from level file data
         * @param rawTrace 
         * @param world only pass null if you know what you're doing (e.g. in editor)
         */
        static fromRaw(
            rawTrace: splitTime.level.file_data.Trace,
            world: World | null = null
        ): splitTime.Trace {
            var trace = new splitTime.Trace(rawTrace.type, rawTrace.vertices)
            trace.z = +rawTrace.z
            trace.height = +rawTrace.height
            switch (trace.type) {
                case splitTime.Trace.Type.STAIRS:
                    trace.direction = direction.interpret(rawTrace.direction)
                    break
                case splitTime.Trace.Type.EVENT:
                    trace.eventId = rawTrace.event
                    break
                case splitTime.Trace.Type.POINTER:
                case splitTime.Trace.Type.TRANSPORT:
                    trace.level = world ? world.getLevel(rawTrace.level) : null
                    trace.offsetX = +rawTrace.offsetX
                    trace.offsetY = +rawTrace.offsetY
                    trace.offsetZ = +rawTrace.offsetZ
                    break
            }
            return trace
        }

        getPointerOffset(): PointerOffset {
            assert(!!this.level, "Pointer trace must have a level")
            assert(!!this.offsetX, "Pointer trace must have offsetX")
            assert(!!this.offsetY, "Pointer trace must have offsetY")
            assert(!!this.offsetZ, "Pointer trace must have offsetZ")
            return this as PointerOffset
        }

        getLevel(): Level {
            if (!this.level) {
                throw new Error("Trace does not have a Level")
            }
            return this.level
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

        static draw(
            traceStr: string,
            ctx: GenericCanvasRenderingContext2D,
            type: string,
            offsetPos?: { x: number; y: number } | undefined
        ) {
            var color = splitTime.Trace.getColor(type)
            return splitTime.Trace.drawColor(traceStr, ctx, color, offsetPos)
        }

        static extractArray(
            traceStr: string
        ): ({
            x: number
            y: number
        } | null)[] {
            const pointsArr = []
            var regex = /\([^\)]+\)/g
            var xRegex = /\(([-]?[\d]+),/
            var yRegex = /,[\s]*([-]?[\d]+)\)/

            var points = traceStr.match(regex)
            //console.log(points.length + "|" + points + "|");

            if (!points || points.length === 0) {
                throw new Error("Empty trace string: " + traceStr)
            }

            for (var i = 0; i < points.length; i++) {
                if (points[i] === "(close)") {
                    pointsArr.push(null)
                } else {
                    var xMatch = points[i].match(xRegex)
                    var yMatch = points[i].match(yRegex)
                    if (xMatch === null || yMatch === null) {
                        console.warn(
                            "Invalid trace point " +
                                points[i] +
                                "(" +
                                i +
                                ' point) in trace string "' +
                                traceStr +
                                '"'
                        )
                        continue
                    }

                    pointsArr.push({
                        x: +xMatch[1],
                        y: +yMatch[1]
                    })
                }
            }
            return pointsArr
        }

        static drawColor(
            traceStr: string,
            ctx: GenericCanvasRenderingContext2D,
            color: string | CanvasGradient,
            offsetPos = { x: 0, y: 0 }
        ) {
            ctx.strokeStyle = color
            ctx.fillStyle = ctx.strokeStyle

            var pointsArray = splitTime.Trace.extractArray(traceStr)
            var newX, newY

            ctx.beginPath()

            if (
                !pointsArray ||
                pointsArray.length === 0 ||
                pointsArray[0] === null
            ) {
                throw new Error(
                    'Trace string "' +
                        traceStr +
                        "\" doesn't have a valid point to begin with"
                )
            }

            newX = pointsArray[0].x + offsetPos.x
            newY = pointsArray[0].y + offsetPos.y

            ctx.moveTo(newX, newY)

            // ctx.fillRect(newX - 0.5, newY - 0.5, 1, 1);
            ctx.fillRect(newX - 1, newY - 1, 1, 1)

            for (var k = 1; k < pointsArray.length; k++) {
                const point = pointsArray[k]
                if (point === null) {
                    ctx.closePath()
                    // ctx.stroke();
                    ctx.fill()
                } else {
                    newX = point.x + offsetPos.x
                    newY = point.y + offsetPos.y

                    ctx.lineTo(newX, newY)
                    // ctx.fillRect(newX - 0.5, newY - 0.5, 1, 1);
                    ctx.fillRect(newX - 1, newY - 1, 1, 1)
                }
            }
            ctx.stroke()
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
            const points = Trace.extractArray(this.vertices)
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

        static Type = {
            SOLID: "solid",
            STAIRS: "stairs",
            GROUND: "ground",
            EVENT: "event",
            PATH: "path",
            POINTER: "pointer",
            TRANSPORT: "transport"
        }

        static RColor = {
            SOLID: 255,
            EVENT: 100,
            POINTER: 20
        }
        static typeToColor: { [type: string]: number[] } = {
            solid: [Trace.RColor.SOLID, 0, 0, 1],
            event: [Trace.RColor.EVENT, 0, 0, 1],
            path: [0, 0, 0, 1],
            stairs: [0, 255, 0, 1]
        }
        static colorToType: { [colorString: string]: string } = {}

        static getColor(type: string) {
            return "rgba(" + Trace.typeToColor[type].join(", ") + ")"
        }
        static getType(r: number, g: number, b: number, a?: number) {
            if (a === undefined) {
                a = 1
            }
            return Trace.colorToType[r + "," + g + "," + b + "," + a]
        }

        static getSolidColor(height: number) {
            var g = Math.min(Math.max(0, +height), 255)
            var b = 0
            return "rgba(" + Trace.RColor.SOLID + ", " + g + ", " + b + ", 1)"
        }

        static getEventColor(id: number) {
            var b = id % 256
            var g = Math.floor(id / 256)
            return "rgba(" + Trace.RColor.EVENT + ", " + g + ", " + b + ", 1)"
        }

        static getEventIdFromColor(r: number, g: number, b: number, a: number) {
            return b + 256 * g
        }

        static getPointerColor(id: number) {
            var b = id % 256
            var g = Math.floor(id / 256)
            return "rgba(" + Trace.RColor.POINTER + ", " + g + ", " + b + ", 1)"
        }

        static getPointerIdFromColor(
            r: number,
            g: number,
            b: number,
            a: number
        ) {
            return b + 256 * g
        }
    }

    for (var color in Trace.typeToColor) {
        Trace.colorToType[Trace.typeToColor[color].join(",")] = color
    }
}
