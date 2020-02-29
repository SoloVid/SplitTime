namespace splitTime {
    export class Trace {
        type: string
        level: splitTime.Level | null
        offsetX: number
        offsetY: number
        offsetZ: number
        height: number
        direction: string
        eventId: string

        constructor(type: string) {
            this.type = type
            this.level = null
            this.offsetX = 0
            this.offsetY = 0
            this.offsetZ = 0
            this.height = 0
            this.direction = ""
            this.eventId = ""
        }

        static fromRaw(
            rawTrace: splitTime.level.file_data.Trace,
            world: World
        ): splitTime.Trace {
            var trace = new splitTime.Trace(rawTrace.type)
            switch (trace.type) {
                case splitTime.Trace.Type.SOLID:
                    trace.height = +rawTrace.height
                    break
                case splitTime.Trace.Type.STAIRS:
                    trace.direction = rawTrace.direction
                    break
                case splitTime.Trace.Type.EVENT:
                    trace.eventId = rawTrace.event
                    break
                case splitTime.Trace.Type.POINTER:
                case splitTime.Trace.Type.TRANSPORT:
                    trace.level = world.getLevel(rawTrace.level)
                    trace.offsetX = +rawTrace.offsetX
                    trace.offsetY = +rawTrace.offsetY
                    trace.offsetZ = +rawTrace.offsetZ
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

        static draw(
            traceStr: string,
            ctx: CanvasRenderingContext2D,
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
            ctx: CanvasRenderingContext2D,
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

        static calculateGradient(
            traceStr: string,
            ctx: CanvasRenderingContext2D,
            direction: string
        ): CanvasGradient {
            var pointsArray = splitTime.Trace.extractArray(traceStr)
            var minX = 100000
            var minY = 100000
            var maxX = 0
            var maxY = 0
            for (var i = 0; i < pointsArray.length; i++) {
                var point = pointsArray[i]

                if (point === null) {
                    continue
                }

                if (i === 0) {
                    ctx.beginPath()
                    // TODO: if first point null?
                    ctx.moveTo(point.x, point.y)
                } else {
                    ctx.lineTo(point.x, point.y)
                }

                if (point.x < minX) {
                    minX = point.x
                } else if (point.x > maxX) {
                    maxX = point.x
                }
                if (point.y < minY) {
                    minY = point.y
                } else if (point.y > maxY) {
                    maxY = point.y
                }
            }
            ctx.closePath()

            var xUnit = splitTime.direction.getXSign(direction)
            var minXWeight = 1 + xUnit // for negative X, prefer starting right (weight 0 on minX)
            var maxXWeight = 1 - xUnit // for positive X, prefer starting left (weight 0 on maxX)
            var startX = (minXWeight * minX + maxXWeight * maxX) / 2

            var yUnit = splitTime.direction.getYSign(direction)
            var minYWeight = 1 + yUnit // for negative Y, prefer starting down (weight 0 on minY)
            var maxYWeight = 1 - yUnit // for positive Y, prefer starting up (weight 0 on maxY)
            var startY = (minYWeight * minY + maxYWeight * maxY) / 2

            var checkingX = startX
            var checkingY = startY

            var x0 = null
            var y0 = null
            var x1 = null
            var y1 = null
            for (var iBound = 0; iBound < 100000; iBound++) {
                if (ctx.isPointInPath(checkingX, checkingY)) {
                    if (x0 === null) {
                        x0 = checkingX
                        y0 = checkingY
                    }
                } else {
                    if (x0 !== null && y0 !== null) {
                        x1 = checkingX
                        y1 = checkingY
                        return ctx.createLinearGradient(x0, y0, x1, y1)
                    }
                }

                checkingX += xUnit
                checkingY += yUnit
            }

            throw new Error("Could not create gradient")
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
            var b = 4 * g
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
