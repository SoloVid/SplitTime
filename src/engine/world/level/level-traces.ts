namespace splitTime.level {
    const BYTES_PER_PIXEL = 3

    export namespace traces {
        export const SELF_LEVEL_ID = "__SELF_LEVEL_ID__"

        export class CollisionInfo {
            containsSolid: boolean
            levels: { [levelId: string]: Level | null }
            pointerTraces: { [levelId: string]: splitTime.Trace }
            zBlockedTopEx: int
            events: { [eventId: string]: true }
            constructor() {
                this.containsSolid = false
                this.levels = {}
                this.pointerTraces = {}
                this.zBlockedTopEx = -4096 // arbitrary
                this.events = {}
            }
        }
    }

    export class Traces {
        private width: int
        private yWidth: int
        private layerZs: int[]
        private layerCount: int
        private layerFuncData: Uint8ClampedArray[]
        // This value could potentially be exposed or calculated dynamically.
        // There is a hard limit of 16 traces per pixel in the current paradigm,
        // so this value determines the largest area affected by this
        // technical limitation.
        private readonly traceBinWidth: int = 16
        private readonly layerSpecialTraceBins: (Trace[] | null)[][] = []
        private readonly binsWide: int
        private debugTraceCanvas: splitTime.Canvas | null = null

        constructor(
            readonly traces: readonly Trace[],
            levelWidth: int,
            levelYWidth: int
        ) {
            this.width = levelWidth
            this.binsWide = Math.ceil(this.width / this.traceBinWidth)
            this.yWidth = levelYWidth
            this.layerZs = []
            this.layerFuncData = []

            // let debugTraceCtx = null
            // if (splitTime.debug.ENABLED) {
            //     this.debugTraceCanvas = new splitTime.Canvas(levelWidth, levelYWidth)
            //     debugTraceCtx = this.debugTraceCanvas.context
            //     debugTraceCtx.clearRect(
            //         0,
            //         0,
            //         this.debugTraceCanvas.width,
            //         this.debugTraceCanvas.height
            //     )
            // }

            const tracesSortedFromBottomToTop = this.traces.slice()
                .sort((a, b) => (a.spec.z + a.spec.height) - (b.spec.z + b.spec.height))
            const topZ = tracesSortedFromBottomToTop.length > 0 ?
                tracesSortedFromBottomToTop[tracesSortedFromBottomToTop.length - 1] : 0

            this.layerZs = this.calculateLayerZs(this.traces)
            this.layerCount = this.layerZs.length
            // Put a sentinel on the end
            this.layerZs.push(splitTime.MAX_SAFE_INTEGER)

            //Initialize functional map
            for (
                let iLayer = 0;
                iLayer < this.layerCount;
                iLayer++
            ) {
                this.layerSpecialTraceBins.push(Array(Math.ceil(levelWidth / this.traceBinWidth) * Math.ceil(levelYWidth / this.traceBinWidth)).fill(null))

                const buffer = new ArrayBuffer(this.width * this.yWidth * BYTES_PER_PIXEL)
                const a = new Uint8ClampedArray(buffer)
                this.layerFuncData[iLayer] = a

                const layerZ = this.layerZs[iLayer]
                // This operation is safe because there should be a sentinel
                const nextLayerZ = this.layerZs[iLayer + 1]
                const specialTraceBins = this.layerSpecialTraceBins[iLayer]

                for (const trace of tracesSortedFromBottomToTop) {
                    this.drawPartialSolidTrace(trace, a, layerZ, nextLayerZ)
                }
                for (const trace of this.traces) {
                    this.drawPartialSpecialTrace(trace, a, layerZ, nextLayerZ, specialTraceBins)
                }

                // TODO: traces related to props

                // TODO: Debug image
                // if (splitTime.debug.ENABLED && debugTraceCtx !== null) {
                //     debugTraceCtx.drawImage(holderCanvas.element, 0, -layerZ)
                // }
            }
            // if (splitTime.debug.ENABLED && this.debugTraceCanvas !== null) {
            //     const ctx = this.debugTraceCanvas.context
            //     // Since this canvas is for debugging, brighten up the colors a bit
            //     const imageData = ctx.getImageData(0, 0, this.debugTraceCanvas.width, this.debugTraceCanvas.height)
            //     for (let i = 0; i < imageData.data.length; i++) {
            //         imageData.data[i] *= 200
            //     }
            //     ctx.putImageData(imageData, 0, 0)
            // }
        }

        private calculateLayerZs(traces: readonly Trace[]): int[] {
            let layerZs = this.fillLayerZGaps(traces, traces.map(t => Math.floor(t.spec.z)))
            return layerZs.sort((a, b) => a - b)
        }

        // It isn't enough to just create a layer for every trace z.
        // If a trace is too tall, it might exceed the 255 limit
        // imposed by the resolution of RGB colors used by this collision scheme.
        // This method creates more layers as necessary for such cases.
        private fillLayerZGaps(traces: readonly Trace[], zArray: readonly int[]): int[] {
            const zSet: { [z: number]: true } = {}
            for (const z of zArray) {
                zSet[z] = true
            }
            // Technically, this is something like 255 based on the limit of pixels
            const MAX_LAYER_Z = 240
            for (const trace of traces) {
                const spec = trace.spec
                let startZ = spec.z
                for (let currentZ = startZ; currentZ < spec.z + spec.height; currentZ++) {
                    if (zSet[currentZ]) {
                        startZ = currentZ
                    } else if (currentZ - startZ > MAX_LAYER_Z) {
                        zSet[currentZ] = true
                        startZ = currentZ
                    }
                }
            }
            const newZArray: int[] = []
            for (const z in zSet) {
                newZArray.push(+z)
            }
            return newZArray.sort((a, b) => a - b)
        }

        private drawPartialSolidTrace(trace: Trace, a: Uint8ClampedArray, minZ: int, exMaxZ: int): void {
            const spec = trace.spec
            const maxHeight = exMaxZ - minZ
            if (spec.height > 0 && !isOverlap(spec.z, spec.height, minZ, maxHeight)) {
                return
            }
            if (spec.height === 0 && (spec.z < minZ || spec.z >= exMaxZ)) {
                return
            }
            const minZRelativeToTrace = minZ - spec.z
            const traceHeightFromMinZ = spec.z + spec.height - minZ
            const pixelHeight = constrain(traceHeightFromMinZ, 0, maxHeight)
            const groundR = 1
            const topR = Math.min(255, pixelHeight + 1)
            switch (spec.type) {
                case splitTime.trace.Type.SOLID:
                    math.fillPolygon(spec.getPolygon(), (x, y) => {
                        const i = (y * this.width + x) * BYTES_PER_PIXEL
                        a[i] = Math.max(topR, a[i])
                    })
                    break
                case splitTime.trace.Type.GROUND:
                    math.fillPolygon(spec.getPolygon(), (x, y) => {
                        const i = (y * this.width + x) * BYTES_PER_PIXEL
                        a[i] = Math.max(groundR, a[i])
                    })
                    break
                case splitTime.trace.Type.STAIRS:
                    const stairsExtremes = spec.calculateStairsExtremes()
                    const bottom = stairsExtremes.bottom
                    const dx = stairsExtremes.top.x - stairsExtremes.bottom.x
                    const dy = stairsExtremes.top.y - stairsExtremes.bottom.y
                    const m = dy / dx
                    const b = stairsExtremes.top.y - m * stairsExtremes.top.x
                    const mInverse = -1/m
                    const a1 = -m
                    const b1 = 1
                    const c1 = b
                    const a2 = -mInverse
                    const b2 = 1
                    const determinant = a1 * b2 - a2 * b1

                    const startFraction = minZRelativeToTrace / spec.height
                    const stairsTopThisLayer = Math.min(spec.z + spec.height, exMaxZ)
                    const stairsTopRelativeToTrace = stairsTopThisLayer - spec.z
                    const endFraction = stairsTopRelativeToTrace / spec.height

                    math.fillPolygon(spec.getPolygon(), (x, y) => {
                        const i = (y * this.width + x) * BYTES_PER_PIXEL

                        const c2 = y - mInverse * x
                        let xIntersect: int
                        let yIntersect: int
                        if (dx === 0) {
                            xIntersect = bottom.x
                            yIntersect = y
                        } else if (dy === 0) {
                            xIntersect = x
                            yIntersect = bottom.y
                        } else {
                            xIntersect = Math.round((b2 * c1 - b1 * c2) / determinant)
                            yIntersect = Math.round((a1 * c2 - a2 * c1) / determinant)
                        }

                        const xDist = xIntersect - bottom.x
                        const xFraction = xDist / dx
                        const yDist = yIntersect - bottom.y
                        const yFraction = yDist / dy
                        const fraction = dx === 0 ? yFraction : xFraction
                        if (fraction < startFraction) {
                            // Don't draw anything
                        } else if (fraction > endFraction) {
                            a[i] = Math.max(topR, a[i])
                        } else {
                            const fractionThisLayer = (fraction - startFraction) /
                                (endFraction - startFraction)
                            const r = fractionThisLayer * (topR - groundR) + groundR
                            a[i] = Math.max(r, a[i])
                        }
                    })
                    break
            }
        }

        private drawPartialSpecialTrace(trace: Trace, a: Uint8ClampedArray, minZ: int, exMaxZ: int, specialTraceBins: (Trace[] | null)[]): void {
            const spec = trace.spec
            if (!isOverlap(spec.z, spec.height, minZ, exMaxZ - minZ)) {
                return
            }
            switch (spec.type) {
                case splitTime.trace.Type.EVENT:
                case splitTime.trace.Type.POINTER:
                case splitTime.trace.Type.TRANSPORT:
                    // Do nothing. We're just trying to weed out the other types.
                    break
                default:
                    return
            }

            const colorsAlreadyPicked: light.Color[] = []
            const that = this
            function getColor(x: int, y: int): light.Color {
                const binIndex = Math.floor(y / that.traceBinWidth) * that.binsWide + Math.floor(x / that.traceBinWidth)
                if (!!colorsAlreadyPicked[binIndex]) {
                    return colorsAlreadyPicked[binIndex]
                }
                if (specialTraceBins[binIndex] === null) {
                    specialTraceBins[binIndex] = []
                }
                const bin = specialTraceBins[binIndex]!
                const traceId = bin.length
                assert(traceId < 16, "More than 16 traces too closely overlapping")
                bin.push(trace)
                const traceShortId = (0x1 << traceId)
                const g = (traceShortId >>> 8) & 0xF
                const b = traceShortId & 0xF
                const color = new light.Color(0, g, b)
                colorsAlreadyPicked[binIndex] = color
                return color
            }

            math.fillPolygon(spec.getPolygon(), (x, y) => {
                const color = getColor(x, y)
                const i = (y * this.width + x) * BYTES_PER_PIXEL
                a[i + 1] = a[i + 1] | color.g
                a[i + 2] = a[i + 2] | color.b
            })
        }

        /**
         * Check that the volume is open in level collision canvas data.
         * @param exMaxZ (positive)
         */
        calculateVolumeCollision(
            collisionInfo: traces.CollisionInfo,
            startX: int,
            xPixels: int,
            startY: int,
            yPixels: int,
            minZ: int,
            exMaxZ: int,
            ignoreEvents: boolean = false
        ) {
            const endY = startY + yPixels
            const endX = startX + xPixels
            for (let y = startY; y < endY; y++) {
                for (let x = startX; x < endX; x++) {
                    this.calculatePixelColumnCollisionInfo(
                        collisionInfo,
                        x,
                        y,
                        minZ,
                        exMaxZ,
                        ignoreEvents
                    )
                }
            }
        }

        /**
         * Check that the pixel is open in level collision canvas data.
         * @param exMaxZ (positive)
         */
        calculatePixelColumnCollisionInfo(
            collisionInfo: traces.CollisionInfo,
            x: int,
            y: int,
            minZ: int,
            exMaxZ: int,
            ignoreEvents: boolean = false
        ) {
            for (
                var iLayer = 0;
                iLayer < this.layerCount;
                iLayer++
            ) {
                var layerZ = this.layerZs[iLayer]
                // This operation should be safe because there is a sentinel
                var nextLayerZ = this.layerZs[iLayer + 1]
                if (exMaxZ > layerZ && minZ < nextLayerZ) {
                    this._calculatePixelCollision(
                        collisionInfo,
                        x,
                        y,
                        iLayer,
                        layerZ,
                        Math.max(layerZ, minZ),
                        Math.min(nextLayerZ, exMaxZ),
                        ignoreEvents
                    )
                }
            }
        }

        private _calculatePixelCollision(
            collisionInfo: traces.CollisionInfo,
            x: int,
            y: int,
            layer: int,
            layerZ: int,
            minZ: int,
            exMaxZ: int,
            ignoreEvents: boolean
        ) {
            var pixelArray = this.layerFuncData[layer]
            // This operation needed to be inline to be performant
            var dataIndex = (y * this.width + x) * BYTES_PER_PIXEL
            var r = pixelArray[dataIndex++]
            var g = pixelArray[dataIndex++]
            var b = pixelArray[dataIndex++]

            if (r > 0) {
                var height = layerZ + (r - 1)
                if (height >= minZ) {
                    collisionInfo.containsSolid = true
                    collisionInfo.zBlockedTopEx = Math.max(
                        height,
                        collisionInfo.zBlockedTopEx
                    )
                }
            }

            let isOtherLevel = false
            if (g > 0 || b > 0) {
                const shortFlags = (g << 8) | b
                const bin = this.layerSpecialTraceBins[layer][
                    Math.floor(y / this.traceBinWidth) * this.binsWide + Math.floor(x / this.traceBinWidth)
                ]
                if (bin !== null) {
                    for (let i = 0; i < bin.length; i++) {
                        const flag = (shortFlags >>> i) & 0x1
                        if (flag === 0) {
                            continue
                        }
                        const trace = bin[i]
                        if (!isOverlap(minZ, exMaxZ - minZ, trace.spec.z, trace.spec.height)) {
                            continue
                        }
                        const spec = trace.spec
                        switch (spec.type) {
                            case splitTime.trace.Type.EVENT:
                                assert(spec.eventId !== null, "Event trace has no ID")
                                collisionInfo.events[spec.eventId] = true
                                break
                            case splitTime.trace.Type.TRANSPORT:
                                collisionInfo.events[spec.getLocationId()] = true
                                break
                            case splitTime.trace.Type.POINTER:
                                isOtherLevel = true
                                assert(!!trace.level, "Pointer trace has no level")
                                collisionInfo.pointerTraces[trace.level.id] = trace
                                collisionInfo.levels[trace.level.id] = trace.level
                                break
                            default:
                                throw new Error("Unexpected trace type " + spec.type)
                        }
                    }
                }
            }

            if (!isOtherLevel) {
                collisionInfo.levels[traces.SELF_LEVEL_ID] = null
            }
        }

        getDebugTraceCanvas(): splitTime.Canvas {
            assert(this.debugTraceCanvas !== null, "Debug trace canvas requested when null")
            return this.debugTraceCanvas
        }
    }
}
