namespace splitTime.utils {
    export function drawShapeOpaque(
        points: (ReadonlyCoordinates2D | null)[],
        target: GenericCanvasRenderingContext2D,
        extraBuffer: splitTime.Canvas,
        color: string | CanvasGradient
    ): void {
        extraBuffer.context.clearRect(
            0,
            0,
            extraBuffer.width,
            extraBuffer.height
        )

        if (points.length === 0 || points[0] === null) {
            throw new Error("Polygon doesn't have a valid point to begin with")
        }

        let extents = {
            minX: extraBuffer.width,
            minY: extraBuffer.height,
            maxX: 0,
            maxY: 0
        }
        try {
            extraBuffer.context.translate(0.5, 0.5)

            extraBuffer.context.strokeStyle = color
            extraBuffer.context.fillStyle = color
            extraBuffer.context.beginPath()

            let newX = points[0].x
            let newY = points[0].y
            extents = {
                minX: newX,
                minY: newY,
                maxX: newX,
                maxY: newY
            }
    
            extraBuffer.context.moveTo(newX, newY)

            for (var k = 1; k < points.length; k++) {
                const point = points[k]
                if (point === null) {
                    extraBuffer.context.closePath()
                    extraBuffer.context.fill()
                } else {
                    newX = point.x
                    newY = point.y

                    if (newX < extents.minX) extents.minX = newX
                    if (newX > extents.maxX) extents.maxX = newX
                    if (newY < extents.minY) extents.minY = newY
                    if (newY > extents.maxY) extents.maxY = newY

                    extraBuffer.context.lineTo(newX, newY)
                }
            }
            extraBuffer.context.stroke()
        } finally {
            extraBuffer.context.translate(-0.5, -0.5)
        }

        // Now we're going to remove all color that isn't fully opaque
        const sx = Math.max(0, extents.minX - 1)
        const sy = Math.max(0, extents.minY - 1)
        const sw = Math.min(extraBuffer.width, extents.maxX + 1) - sx
        const sh = Math.min(extraBuffer.height, extents.maxY + 1) - sy
        const imageData = extraBuffer.context.getImageData(sx, sy, sw, sh)
        const data = imageData.data
        for (let i = 0; i < data.length; i += 4) {
            const a = data[i + 3]
            if (a !== 0 && a !== 255) {
                data[i + 0] = 0
                data[i + 1] = 0
                data[i + 2] = 0
                data[i + 3] = 0
            }
        }

        // Draw that opacified data to the target canvas
        extraBuffer.context.putImageData(imageData, sx, sy)
        target.drawImage(extraBuffer.element, 0, 0)
    }
}