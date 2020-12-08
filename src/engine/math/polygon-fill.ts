namespace splitTime.math {

    export function fillPolygon(polygon: Polygon, callback: (x: int, y: int) => void): void {
        const edgesWaiting: EdgeInfo[] = []
        for (let i = 0; i < polygon.vertices.length; i++) {
            const start = polygon.vertices[i]
            const end = polygon.vertices[(i + 1) % polygon.vertices.length]
            const edge = new EdgeInfo(start, end)
            if (edge.dy !== 0) {
                edgesWaiting.push(edge)
            }
        }

        // In the event that two adjacent edges form a single contiguous
        // vertical contour, we don't want to count the vertex twice on
        // that scan line. So I'm just bumping the upper one in that case.
        for (let i = 0; i < edgesWaiting.length; i++) {
            const me = edgesWaiting[i]
            const next = edgesWaiting[(i + 1) % edgesWaiting.length]
            const bothUp = me.start.y < me.end.y && next.start.y < next.end.y
            if (bothUp) {
                next.yMin++
                next.advanceY()
            }
            const bothDown = me.start.y > me.end.y && next.start.y > next.end.y
            if (bothDown) {
                me.yMin++
                me.advanceY()
            }
        }

        // Sort from bottom to top
        edgesWaiting.sort((a, b) => a.yMin - b.yMin)
        const maxY = edgesWaiting.reduce((max, e) => Math.max(max, e.yMax), Number.NEGATIVE_INFINITY)

        let edgesActive: EdgeInfo[] = []
        // Start with the first edge
        edgesActive.push(edgesWaiting.shift()!)
        let y = edgesActive[0].yMin
        
        for (let y = edgesActive[0].yMin; y <= maxY; y++) {
            // Recruit any upcoming edges
            while (edgesWaiting.length > 0 && edgesWaiting[0].yMin <= y) {
                edgesActive.push(edgesWaiting.shift()!)
            }
            // Remove edges that are past
            edgesActive = edgesActive.filter(e => e.yMax >= y)

            // Soft from left to right
            const xStops = edgesActive.map(e => e.x).sort()
            const maxX = xStops[xStops.length - 1]
            let drawing = false
            for (let x = xStops[0]; x <= maxX; x++) {
                let hitStop = false
                while (x === xStops[0]) {
                    hitStop = true
                    drawing = !drawing
                    xStops.shift()
                }
                if (drawing || hitStop) {
                    callback(x, y)
                }
            }

            // Inch x values along
            edgesActive.forEach(e => e.advanceY())
        }
    }

    class EdgeInfo {
        yMin: int
        readonly yMax: int
        readonly sign: unit
        readonly dx: int
        readonly dy: int

        x: int
        undershoot: int

        constructor(
            public readonly start: Vector2D,
            public readonly end: Vector2D,
        ) {
            const isUp = start.y < end.y
            const top = isUp ? end : start
            const bottom = isUp ? start : end

            this.yMin = bottom.y
            this.yMax = top.y
            assert(this.yMax >= this.yMin, "yMax should be >= yMin")

            this.dy = this.yMax - this.yMin
            this.dx = Math.abs(top.x - bottom.x)
            this.sign = top.x < bottom.x ? -1 : 1

            this.x = bottom.x
            this.undershoot = 0
        }

        advanceY(): void {
            this.undershoot += this.dx
            // FTODO: Don't use loop here
            while (this.undershoot >= this.dy) {
                this.x += this.sign
                this.undershoot -= this.dy
            }
        }
    }
}