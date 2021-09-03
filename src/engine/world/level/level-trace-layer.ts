namespace splitTime.level {
    const groundR = 1

    export class TraceLayer {
        /** An array of arrays (array per granularity) containing height-map of solid traces plus flag for pointers. */
        private readonly solidData: Uint8ClampedArray[] = []
        /** An array of arrays (array per granularity) containing bit masks per byte per pixel for pointer traces. */
        private readonly pointerData: Uint8ClampedArray[] = []
        private readonly pointerTraceBins: (Trace[] | null)[] = []
        /** An array of arrays (array per granularity) containing bit masks per byte per pixel for event traces plus flag for pointers. */
        private readonly eventData: Uint8ClampedArray[] = []
        private readonly eventTraceBins: (Trace[] | null)[] = []
        private debugTraceCanvas: splitTime.Canvas | null = null

        constructor(
            readonly t: Traces2,
            readonly z: int,
            readonly nextLayerZ: int,
        ) {
            const pixelDataSize = t.width * t.yWidth

            const solidDataPixel = new Uint8ClampedArray(new ArrayBuffer(pixelDataSize))
            this.solidData.push(solidDataPixel)

            const pointerDataPixel = new Uint8ClampedArray(new ArrayBuffer(pixelDataSize))
            this.pointerData.push(pointerDataPixel)
            this.pointerTraceBins = Array(t.traceBinArraySize).fill(null)
            const pointerTypes = [splitTime.trace.Type.POINTER]

            const eventDataPixel = new Uint8ClampedArray(new ArrayBuffer(pixelDataSize))
            this.eventData.push(eventDataPixel)
            this.eventTraceBins = Array(t.traceBinArraySize).fill(null)
            const eventTypes = [splitTime.trace.Type.EVENT, splitTime.trace.Type.TRANSPORT, splitTime.trace.Type.SEND]

            for (let iGranularity = 0; iGranularity < this.t.granularities.length; iGranularity++) {
                const granularity = this.t.granularities[iGranularity]
                const bucketsWide = this.t.granularityBucketsWide[iGranularity]
                const bucketsWideY = Math.ceil(this.t.yWidth / granularity)
                const bucketDataSize = bucketsWide * bucketsWideY

                this.solidData.push(new Uint8ClampedArray(new ArrayBuffer(bucketDataSize)))
                this.pointerData.push(new Uint8ClampedArray(new ArrayBuffer(bucketDataSize)))
                this.eventData.push(new Uint8ClampedArray(new ArrayBuffer(bucketDataSize)))
            }

            for (const trace of this.t.traces) {
                this.drawPartialSolidTrace(trace, this.solidData)
                this.drawPartialSpecialTrace(pointerTypes, trace, this.pointerData, this.pointerTraceBins)
                this.drawPartialSpecialTrace(eventTypes, trace, this.eventData, this.eventTraceBins)
            }

            // TODO: traces related to props

            if (__DOM__ && splitTime.debug.ENABLED) {
                this.debugTraceCanvas = new splitTime.Canvas(t.width, t.yWidth)
                const debugTraceCtx = this.debugTraceCanvas.context
                debugTraceCtx.clearRect(
                    0,
                    0,
                    this.debugTraceCanvas.width,
                    this.debugTraceCanvas.height
                )
                const debugImageData = debugTraceCtx.getImageData(0, 0, this.debugTraceCanvas.width, this.debugTraceCanvas.height)

                for (let i = 0; i < solidDataPixel.length; i++) {
                    const debugIndex = i * 4
                    if (debugIndex < 0 || debugIndex >= debugImageData.data.length) {
                        continue
                    }
                    // Since this canvas is for debugging, brighten up the colors a bit.
                    debugImageData.data[debugIndex + 0] = eventDataPixel[i] * 200
                    debugImageData.data[debugIndex + 1] = pointerDataPixel[i] * 200
                    debugImageData.data[debugIndex + 2] = solidDataPixel[i] * 200
                    // Make it a little transparent so we can see under the traces.
                    debugImageData.data[debugIndex + 3] = 200
                }

                debugTraceCtx.putImageData(debugImageData, 0, 0)
            }
        }

        private markAt(a: Uint8ClampedArray[], x: int, y: int, adjustValue: (existingValue: int) => int): void {
            if (x < 0 || y < 0 || x >= this.t.width || y >= this.t.yWidth) {
                return
            }
            const i0 = (y * this.t.width + x)
            a[0][i0] = adjustValue(a[0][i0])
            for (let iGranularity = 0; iGranularity < this.t.granularities.length; iGranularity++) {
                const granularity = this.t.granularities[iGranularity]
                const bucketsWide = this.t.granularityBucketsWide[iGranularity]
                const granularX = Math.floor(x / granularity)
                const granularY = Math.floor(y / granularity)
                const bucketIndex = granularY * bucketsWide + granularX
                a[iGranularity + 1][bucketIndex] = adjustValue(a[iGranularity + 1][bucketIndex])
            }
        }

        private drawPartialSolidTrace(trace: Trace, a: Uint8ClampedArray[]): void {
            const that = this
            function markAt(x: int, y: int, value: int) {
                that.markAt(a, x, y, (prev) => Math.max(prev, value))
            }

            const spec = trace.spec
            const maxHeight = this.nextLayerZ - this.z
            if (spec.height > 0 && !isOverlap(spec.offsetZ, spec.height, this.z, maxHeight)) {
                return
            }
            if (spec.height === 0 && (spec.offsetZ < this.z || spec.offsetZ >= this.nextLayerZ)) {
                return
            }
            const minZRelativeToTrace = this.z - spec.offsetZ
            const traceHeightFromMinZ = spec.offsetZ + spec.height - this.z
            const pixelHeight = constrain(traceHeightFromMinZ, 0, maxHeight)
            const topR = Math.min(255, pixelHeight + groundR)
            switch (spec.type) {
                case splitTime.trace.Type.SOLID:
                    math.fillPolygon(spec.getPolygon(), (x, y) => {
                        markAt(x, y, topR)
                    })
                    break
                case splitTime.trace.Type.GROUND:
                    math.fillPolygon(spec.getPolygon(), (x, y) => {
                        markAt(x, y, groundR)
                    })
                    break
                case splitTime.trace.Type.STAIRS:
                    const stairsExtremes = spec.calculateStairsExtremes()
                    const bottom = stairsExtremes.bottom
                    const dx = stairsExtremes.top.x - stairsExtremes.bottom.x
                    const dy = stairsExtremes.top.y - stairsExtremes.bottom.y
                    const m = dy / dx
                    // y intercept
                    const b = bottom.y - m * bottom.x
                    const mInverse = -1/m
                    // Pre-calculate reusable parts for Cramer's rule
                    // We're creating Ax + By = C forms as directly as possible
                    // from y = mx + b form
                    const a1 = -m
                    const b1 = 1
                    const c1 = b
                    const a2 = -mInverse
                    const b2 = 1
                    const determinant = a1 * b2 - a2 * b1

                    // In each layer, we aren't necessarily drawing the full [0,1]
                    // range of the stairs gradient.
                    // 0 <= startFraction < endFraction <= 1
                    const startFraction = minZRelativeToTrace / spec.height
                    const stairsTopThisLayer = Math.min(spec.offsetZ + spec.height, this.nextLayerZ)
                    const stairsTopRelativeToTrace = stairsTopThisLayer - spec.offsetZ
                    const endFraction = stairsTopRelativeToTrace / spec.height

                    math.fillPolygon(spec.getPolygon(), (x, y) => {
                        // y intercept of perpendicular line
                        const c2 = y - mInverse * x

                        // Vertical lines are an exception
                        let xIntersect: number
                        let yIntersect: number
                        if (dx === 0) {
                            xIntersect = bottom.x
                            yIntersect = y
                        } else if (dy === 0) {
                            xIntersect = x
                            yIntersect = bottom.y
                        } else {
                            // This math is Cramer's rule, compliments of https://stackoverflow.com/q/4543506
                            xIntersect = (b2 * c1 - b1 * c2) / determinant
                            yIntersect = (a1 * c2 - a2 * c1) / determinant
                        }

                        // How far is this point along the gradient with respect to x?
                        const xDist = xIntersect - bottom.x
                        const xFraction = xDist / dx
                        // How far is this point along the gradient with respect to y?
                        const yDist = yIntersect - bottom.y
                        const yFraction = yDist / dy
                        // How far is this point along the gradient?
                        const fraction = dx === 0 ? yFraction : xFraction
                        if (fraction < startFraction) {
                            // Don't draw anything
                        } else if (fraction > endFraction) {
                            markAt(x, y, topR)
                        } else {
                            const fractionThisLayer = (fraction - startFraction) /
                                (endFraction - startFraction)
                            const r = fractionThisLayer * (topR - groundR) + groundR
                            markAt(x, y, r)
                        }
                    })
                    break
            }
        }

        private drawPartialSpecialTrace(types: string[], trace: Trace, a: Uint8ClampedArray[], specialTraceBins: (Trace[] | null)[]): void {
            const that = this
            function markAt(x: int, y: int, value: int) {
                that.markAt(a, x, y, (prev) => prev | value)
            }

            const spec = trace.spec
            if (!isOverlap(spec.offsetZ, spec.height, this.z, this.nextLayerZ - this.z)) {
                return
            }
            if (types.indexOf(spec.type) < 0) {
                return
            }

            const colorsAlreadyPicked: int[] = []
            function getColor(x: int, y: int): int {
                if (x < 0 || y < 0 || x >= that.t.width || y >= that.t.yWidth) {
                    return 0
                }

                const binIndex = Math.floor(y / that.t.traceBinWidth) * that.t.binsWide + Math.floor(x / that.t.traceBinWidth)
                if (!!colorsAlreadyPicked[binIndex]) {
                    return colorsAlreadyPicked[binIndex]
                }
                if (specialTraceBins[binIndex] === null) {
                    specialTraceBins[binIndex] = []
                }
                const bin = specialTraceBins[binIndex]!
                const traceId = bin.length
                assert(traceId < 8, "More than 8 traces too closely overlapping within set of trace types: " + types.join(', '))
                // Note: Side effect here!
                bin.push(trace)
                const traceShortId = (0x1 << traceId)
                const value = traceShortId & 0xF
                colorsAlreadyPicked[binIndex] = value
                return value
            }

            math.fillPolygon(spec.getPolygon(), (x, y) => {
                markAt(x, y, getColor(x, y))
            })
        }

        calculateAreaSolidCollision(
            collisionInfo: traces.SolidCollisionInfo,
            startX: int,
            xPixels: int,
            startY: int,
            yPixels: int,
            minZ: int,
        ): void {
            this.calculateAreaCollision(
                this.solidData, this.t.granularities.length - 1,
                startX, xPixels,
                startY, yPixels,
                (value) => {
                    if (value === 0) {
                        return
                    }
                    const height = this.z + (value - groundR)
                    if (height < minZ) {
                        return
                    }
                    collisionInfo.containsSolid = true
                    collisionInfo.zBlockedTopEx = Math.max(
                        height,
                        collisionInfo.zBlockedTopEx
                    )
                }
            )
        }

        calculateAreaPointers(
            pointerInfo: traces.PointerTraceInfo,
            startX: int,
            xPixels: int,
            startY: int,
            yPixels: int,
            minZ: number,
            exMaxZ: number,
        ): void {
            this.calculateAreaCollision(
                this.pointerData, this.t.granularities.length - 1,
                startX, xPixels,
                startY, yPixels,
                (value, x, y) => {
                    if (value === 0) {
                        pointerInfo[traces.SELF_LEVEL_ID] = null
                        return
                    }
                    const traceBinX = Math.floor(x / this.t.traceBinWidth)
                    const traceBinY = Math.floor(y / this.t.traceBinWidth)
                    const bin = this.pointerTraceBins[traceBinY * this.t.binsWide + traceBinX]
                    if (bin === null) {
                        return
                    }
                    let foundOne = false
                    for (let i = 0; i < bin.length; i++) {
                        const flag = (value >>> i) & 0x1
                        if (flag === 0) {
                            continue
                        }
                        const trace = bin[i]
                        if (!isOverlap(minZ, exMaxZ - minZ, trace.spec.offsetZ, trace.spec.height)) {
                            continue
                        }
                        if (trace.spec.type === splitTime.trace.Type.POINTER) {
                            foundOne = true
                            pointerInfo[trace.getOffsetHash()] = trace.getPointerOffset()
                        }
                    }
                    if (!foundOne) {
                        pointerInfo[traces.SELF_LEVEL_ID] = null
                        return
                    }
                }
            )
        }

        calculateAreaEvents(
            eventInfo: traces.EventTraceInfo,
            startX: int,
            xPixels: int,
            startY: int,
            yPixels: int,
            minZ: number,
            exMaxZ: number,
        ): void {
            this.calculateAreaCollision(
                this.eventData, this.t.granularities.length - 1,
                startX, xPixels,
                startY, yPixels,
                (value, x, y) => {
                    if (value === 0) {
                        return
                    }
                    const traceBinX = Math.floor(x / this.t.traceBinWidth)
                    const traceBinY = Math.floor(y / this.t.traceBinWidth)
                    const bin = this.eventTraceBins[traceBinY * this.t.binsWide + traceBinX]
                    if (bin === null) {
                        return
                    }
                    for (let i = 0; i < bin.length; i++) {
                        const flag = (value >>> i) & 0x1
                        if (flag === 0) {
                            continue
                        }
                        const trace = bin[i]
                        if (!isOverlap(minZ, exMaxZ - minZ, trace.spec.offsetZ, trace.spec.height)) {
                            continue
                        }
                        const spec = trace.spec
                        switch (spec.type) {
                            case splitTime.trace.Type.EVENT:
                                assert(spec.eventId !== null, "Event trace has no event ID")
                                eventInfo[spec.eventId] = true
                                break
                            case splitTime.trace.Type.TRANSPORT:
                            case splitTime.trace.Type.SEND:
                                eventInfo[spec.getOffsetHash()] = true
                                break
                        }
                    }
                }
            )
        }

        private calculateAreaCollision(
            data: Uint8ClampedArray[],
            iGranularity: int,
            startX: int,
            xPixels: int,
            startY: int,
            yPixels: int,
            handleValue: (value: int, x: int, y: int) => void,
        ): void {
            // If we've now gotten to pixel granularity, just do simple pixel lookup.
            if (iGranularity < 0) {
                const endY = startY + yPixels
                const endX = startX + xPixels
                for (let y = startY; y < endY; y++) {
                    for (let x = startX; x < endX; x++) {
                        // const pixel = this.getPixelValue(data, x, y)
                        const pixelIndex = y * this.t.width + x
                        const pixel = data[0][pixelIndex]
                        handleValue(pixel, x, y)
                    }
                }
                return
            }

            const granularity = this.t.granularities[iGranularity]
            const endY = startY + yPixels
            const endX = startX + xPixels
            const startXBucket = Math.floor(startX / granularity)
            const startYBucket = Math.floor(startY / granularity)
            const endXBucket = Math.ceil(endX / granularity)
            const endYBucket = Math.ceil(endY / granularity)

            for (let yBucket = startYBucket; yBucket < endYBucket; yBucket++) {
                for (let xBucket = startXBucket; xBucket < endXBucket; xBucket++) {
                    this.calculateAlignedAreaCollision(
                        data,
                        iGranularity,
                        Math.max(startX, xBucket * granularity),
                        Math.min(granularity, endX - (xBucket * granularity), xPixels),
                        Math.max(startY, yBucket * granularity),
                        Math.min(granularity, endY - (yBucket * granularity), yPixels),
                        handleValue
                    )
                }
            }
        }

        // This method assumes that the area specified falls within a single bucket of the specified granularity.
        private calculateAlignedAreaCollision(
            data: Uint8ClampedArray[],
            iGranularity: int,
            startX: int,
            xPixels: int,
            startY: int,
            yPixels: int,
            handleValue: (value: int, x: int, y: int) => void
        ): void {
            const granularity = this.t.granularities[iGranularity]
            const bucketsWide = this.t.granularityBucketsWide[iGranularity]
            const granularX = Math.floor(startX / granularity)
            const granularY = Math.floor(startY / granularity)
            // Note: This method can assume that the specified area falls within a single bucket.
            const bucketIndex = granularY * bucketsWide + granularX
            const bucket = data[iGranularity + 1][bucketIndex]

            // If the bucket is empty, return early with result from just the bucket.
            // This is really the biggest optimization case we're trying to hit.
            if (bucket === 0) {
                handleValue(0, startX, startY)
                return
            }

            // If the query exactly overlaps the bucket at specified granularity,
            // return early with result from just the bucket.
            // Right now, this optimization only works in the solid trace data array.
            if (data === this.solidData && xPixels === granularity && yPixels === granularity) {
                handleValue(bucket, startX, startY)
                return
            }

            // Otherwise recurse at the next granularity.
            const iGranularityNext = iGranularity - 1
            // We're calling the higher-level method here because we'll no longer be aligned at the smaller level.
            this.calculateAreaCollision(
                data, iGranularityNext,
                startX, xPixels,
                startY, yPixels,
                handleValue
            )
        }

        private getPixelValue(a: Uint8ClampedArray[], x: int, y: int): int {
            const pixelIndex = y * this.t.width + x
            return a[0][pixelIndex]
        }

        getDebugTraceCanvas(): splitTime.Canvas {
            assert(this.debugTraceCanvas !== null, "Debug trace canvas requested when null")
            return this.debugTraceCanvas
        }
    }
}
