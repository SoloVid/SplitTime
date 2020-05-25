namespace splitTime.level {
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
        private layerFuncData: ImageData[]
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

            const holderCanvas = new splitTime.Canvas(levelWidth, levelYWidth)
            const holderCtx = holderCanvas.context
            const extraBuffer = new splitTime.Canvas(levelWidth, levelYWidth)

            let debugTraceCtx = null
            if (splitTime.debug.ENABLED) {
                this.debugTraceCanvas = new splitTime.Canvas(levelWidth, levelYWidth)
                debugTraceCtx = this.debugTraceCanvas.context
                debugTraceCtx.clearRect(
                    0,
                    0,
                    this.debugTraceCanvas.width,
                    this.debugTraceCanvas.height
                )
            }

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

                holderCtx.clearRect(
                    0,
                    0,
                    holderCanvas.width,
                    holderCanvas.height
                )

                const layerZ = this.layerZs[iLayer]
                // This operation is safe because there should be a sentinel
                const nextLayerZ = this.layerZs[iLayer + 1]
                const specialTraceBins = this.layerSpecialTraceBins[iLayer]

                const existingGCO = holderCtx.globalCompositeOperation

                // The operation we want here is to take the brighter of the pixels.
                // According to MDN, that should be "lighten."
                // However, "lighten" seems to be an alias for "lighter" (additive)
                // in all three major browsers I tried.
                // So instead, we just sorted all of the solid traces first.
                holderCtx.globalCompositeOperation = "source-over"
                for (const trace of tracesSortedFromBottomToTop) {
                    this.drawPartialSolidTrace(trace, holderCtx, extraBuffer, layerZ, nextLayerZ)
                }

                holderCtx.globalCompositeOperation = "lighter"
                for (const trace of this.traces) {
                    this.drawPartialSpecialTrace(trace, holderCtx, extraBuffer, layerZ, nextLayerZ, specialTraceBins)
                }

                holderCtx.globalCompositeOperation = existingGCO

                // TODO: traces related to props

                this.layerFuncData[iLayer] = holderCtx.getImageData(
                    0,
                    0,
                    holderCanvas.width,
                    holderCanvas.height
                )

                if (splitTime.debug.ENABLED && debugTraceCtx !== null) {
                    debugTraceCtx.drawImage(holderCanvas.element, 0, -layerZ)
                }
            }
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

        private drawPartialSolidTrace(trace: Trace, holderCtx: GenericCanvasRenderingContext2D, extraBuffer: splitTime.Canvas, minZ: int, exMaxZ: int): void {
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
            const groundColor = "rgba(" + 1 + ", 0, 0, 1)"
            const topColor = "rgba(" + Math.min(255, pixelHeight + 1) + ", 0, 0, 1)"
            const noColor = "rgba(0, 0, 0, 0)"
            switch (spec.type) {
                case splitTime.trace.Type.SOLID:
                    trace.drawColor(
                        holderCtx,
                        extraBuffer,
                        topColor
                    )
                    break
                case splitTime.trace.Type.GROUND:
                    trace.drawColor(
                        holderCtx,
                        extraBuffer,
                        groundColor
                    )
                    break
                case splitTime.trace.Type.STAIRS:
                    const gradient = trace.createStairsGradient(holderCtx)
                    const startFraction = minZRelativeToTrace / spec.height
                    if (startFraction >= 0 && startFraction <= 1) {
                        gradient.addColorStop(startFraction, noColor)
                        gradient.addColorStop(startFraction, groundColor)

                        const stairsTopThisLayer = Math.min(spec.z + spec.height, exMaxZ)
                        const stairsTopRelativeToTrace = stairsTopThisLayer - spec.z
                        const endFraction = stairsTopRelativeToTrace / spec.height
                        gradient.addColorStop(endFraction, topColor)

                        trace.drawColor(
                            holderCtx,
                            extraBuffer,
                            gradient
                        )
                    }
                    break
            }
        }

        private drawPartialSpecialTrace(trace: Trace, holderCtx: GenericCanvasRenderingContext2D, extraBuffer: splitTime.Canvas, minZ: int, exMaxZ: int, specialTraceBins: (Trace[] | null)[]): void {
            const spec = trace.spec
            if (!isOverlap(spec.z, spec.height, minZ, exMaxZ - minZ)) {
                return
            }
            switch (spec.type) {
                case splitTime.trace.Type.EVENT:
                case splitTime.trace.Type.POINTER:
                case splitTime.trace.Type.TRANSPORT:
                    // Do nothing. We're just trying to weed out the other types.
                    break;
                default:
                    return
            }

            trace.drawColor(
                null,
                extraBuffer,
                // This color is arbitrary. We'll replace it later.
                "rgba(255, 255, 255, 1)"
            )

            const imageData = extraBuffer.context.getImageData(0, 0, extraBuffer.width, extraBuffer.height)

            for (let y = 0; y < this.yWidth; y += this.traceBinWidth) {
                for (let x = 0; x < this.width; x += this.traceBinWidth) {
                    extraBuffer.context.clearRect(
                        0,
                        0,
                        extraBuffer.width,
                        extraBuffer.height
                    )
                    // It's not well documented online, but the 4th and 5th parameters
                    // offset into both the source and destination canvases.
                    extraBuffer.context.putImageData(imageData, 0, 0, x, y, this.traceBinWidth, this.traceBinWidth)

                    const binIndex = y / this.traceBinWidth * this.binsWide + x / this.traceBinWidth
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
                    const color = "rgba(0, " + g + ", " + b + ", 1)"

                    // Change the color of the trace already drawn
                    const prevEbGop = extraBuffer.context.globalCompositeOperation
                    extraBuffer.context.globalCompositeOperation = "source-in"
                    extraBuffer.context.fillStyle = color
                    extraBuffer.context.fillRect(0, 0, extraBuffer.width, extraBuffer.height)
                    extraBuffer.context.globalCompositeOperation = prevEbGop

                    holderCtx.drawImage(extraBuffer.element, 0, 0)
                }
            }
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
            var imageData = this.layerFuncData[layer]
            // This operation needed to be inline to be performant
            var dataIndex = (y * this.width + x) * 4
            var r = imageData.data[dataIndex++]
            var g = imageData.data[dataIndex++]
            var b = imageData.data[dataIndex++]
            var a = imageData.data[dataIndex++]

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
                                break;
                            case splitTime.trace.Type.TRANSPORT:
                                collisionInfo.events[spec.getLocationId()] = true
                                break;
                            case splitTime.trace.Type.POINTER:
                                isOtherLevel = true
                                assert(!!trace.level, "Pointer trace has no level")
                                collisionInfo.pointerTraces[trace.level.id] = trace
                                collisionInfo.levels[trace.level.id] = trace.level
                                break;
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
