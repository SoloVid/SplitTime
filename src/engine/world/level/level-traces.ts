namespace splitTime.level {
    export namespace traces {
        export const SELF_LEVEL_ID = "__SELF_LEVEL_ID__"

        export class ZRange {
            constructor(public minZ: number, public exMaxZ: number) {}
        }

        export class CollisionInfo {
            containsSolid: boolean
            levels: { [levelId: string]: Level | null }
            pointerTraces: { [levelId: string]: splitTime.Trace }
            zBlockedTopEx: int
            events: { [eventId: string]: ZRange }
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
        private layerZs: int[]
        private layerCount: int
        private layerFuncData: ImageData[]
        private nextFunctionId: int
        private internalEventIdMap: { [intId: number]: string }
        private nextPointerId: int
        private internalPointerTraceMap: { [intId: number]: splitTime.Trace }
        private debugTraceCanvas: splitTime.Canvas | null = null

        constructor(
            readonly traces: readonly Trace[],
            levelWidth: int,
            levelYWidth: int
        ) {
            this.width = levelWidth
            this.layerZs = []
            this.layerFuncData = []

            this.internalEventIdMap = {}
            this.internalPointerTraceMap = {}
            this.nextFunctionId = 1
            this.nextPointerId = 1

            const holderCanvas = new splitTime.Canvas(levelWidth, levelYWidth)
            const holderCtx = holderCanvas.context

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

            const tracesSortedFromBottomToTop = this.traces.slice().sort((a, b) => (a.z + a.height) - (b.z + b.height))
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
                holderCtx.clearRect(
                    0,
                    0,
                    holderCanvas.width,
                    holderCanvas.height
                )

                const layerZ = this.layerZs[iLayer]
                // This operation is safe because there should be a sentinel
                const nextLayerZ = this.layerZs[iLayer + 1]

                holderCtx.translate(0.5, 0.5)

                const existingGCO = holderCtx.globalCompositeOperation
                // The operation we want here is to take the brighter of the pixels.
                // According to MDN, that should be "lighten."
                // However, "lighten" seems to be an alias for "lighter" (additive)
                // in all three major browsers I tried.
                // holderCtx.globalCompositeOperation = "lighten"
                for (const trace of tracesSortedFromBottomToTop) {
                    this.drawPartialSolidTrace(trace, holderCtx, layerZ, nextLayerZ)
                }
                holderCtx.globalCompositeOperation = existingGCO
                // We are drawing these in a separate loop because in the future
                // we want these to be additively drawn while the solids are drawn normally
                for (const trace of this.traces) {
                    this.drawPartialSpecialTrace(trace, holderCtx, layerZ, nextLayerZ)
                }

                // TODO: traces related to props

                holderCtx.translate(-0.5, -0.5)

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
            let layerZs = this.fillLayerZGaps(traces, traces.map(t => Math.floor(t.z)))
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
                let startZ = trace.z
                for (let currentZ = startZ; currentZ < trace.z + trace.height; currentZ++) {
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

        private drawPartialSolidTrace(trace: Trace, holderCtx: GenericCanvasRenderingContext2D, minZ: int, exMaxZ: int): void {
            const maxHeight = exMaxZ - minZ
            if (trace.height > 0 && !isOverlap(trace.z, trace.height, minZ, maxHeight)) {
                return
            }
            if (trace.height === 0 && (trace.z < minZ || trace.z >= exMaxZ)) {
                return
            }
            const minZRelativeToTrace = minZ - trace.z
            const traceHeightFromMinZ = trace.z + trace.height - minZ
            const pixelHeight = constrain(traceHeightFromMinZ, 0, maxHeight)
            const groundColor = splitTime.Trace.getSolidColor(0)
            const topColor = splitTime.Trace.getSolidColor(pixelHeight)
            const noColor = "rgba(0, 0, 0, 0)"
            switch (trace.type) {
                case splitTime.Trace.Type.SOLID:
                    splitTime.Trace.drawColor(
                        trace.vertices,
                        holderCtx,
                        topColor
                    )
                    break
                case splitTime.Trace.Type.GROUND:
                    splitTime.Trace.drawColor(
                        trace.vertices,
                        holderCtx,
                        groundColor
                    )
                    break
                case splitTime.Trace.Type.STAIRS:
                    const gradient = trace.createStairsGradient(holderCtx)
                    const startFraction = minZRelativeToTrace / trace.height
                    if (startFraction >= 0 && startFraction <= 1) {
                        gradient.addColorStop(startFraction, noColor)
                        gradient.addColorStop(startFraction, groundColor)

                        const stairsTopThisLayer = Math.min(trace.z + trace.height, exMaxZ)
                        const stairsTopRelativeToTrace = stairsTopThisLayer - trace.z
                        const endFraction = stairsTopRelativeToTrace / trace.height
                        gradient.addColorStop(endFraction, topColor)

                        splitTime.Trace.drawColor(
                            trace.vertices,
                            holderCtx,
                            gradient
                        )
                    }
                    break
            }
        }

        private drawPartialSpecialTrace(trace: Trace, holderCtx: GenericCanvasRenderingContext2D, minZ: int, exMaxZ: int): void {
            if (!isOverlap(trace.z, trace.height, minZ, exMaxZ - minZ)) {
                return
            }
            // FTODO: support adding multiple in same pixel
            // Will require additive blending and probably
            // also cell-based lookups
            switch (trace.type) {
                case splitTime.Trace.Type.EVENT:
                    const eventStringId = trace.eventId
                    assert(eventStringId !== null, "Event trace must have an event")
                    const eventIntId = this.nextFunctionId++
                    this.internalEventIdMap[eventIntId] = eventStringId
                    const functionColor = splitTime.Trace.getEventColor(
                        eventIntId
                    )
                    splitTime.Trace.drawColor(
                        trace.vertices,
                        holderCtx,
                        functionColor
                    )
                    break
                case splitTime.Trace.Type.POINTER:
                    const pointerIntId = this.nextPointerId++
                    this.internalPointerTraceMap[pointerIntId] = trace
                    const pointerColor = splitTime.Trace.getPointerColor(
                        pointerIntId
                    )
                    splitTime.Trace.drawColor(
                        trace.vertices,
                        holderCtx,
                        pointerColor
                    )
                    break
                case splitTime.Trace.Type.TRANSPORT:
                    const transportStringId = trace.getLocationId()
                    const transportIntId = this.nextFunctionId++
                    this.internalEventIdMap[
                        transportIntId
                    ] = transportStringId
                    const transportColor = splitTime.Trace.getEventColor(
                        transportIntId
                    )
                    splitTime.Trace.drawColor(
                        trace.vertices,
                        holderCtx,
                        transportColor
                    )
                    break
            }
        }

        private getEventIdFromPixel(r: number, g: number, b: number, a: number) {
            var eventIntId = splitTime.Trace.getEventIdFromColor(r, g, b, a)
            return this.internalEventIdMap[eventIntId]
        }

        /**
         * @return {splitTime.Trace}
         */
        private getPointerTraceFromPixel(
            r: number,
            g: number,
            b: number,
            a: number
        ): splitTime.Trace {
            var pointerIntId = splitTime.Trace.getPointerIdFromColor(r, g, b, a)
            const pointerTrace = this.internalPointerTraceMap[pointerIntId]
            assert(!!pointerTrace, "Pointer trace not found: " + pointerIntId)
            return pointerTrace
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
            exMaxZ: int
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
                        exMaxZ
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
            exMaxZ: int
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
                        Math.min(nextLayerZ, exMaxZ)
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
            exMaxZ: int
        ) {
            var imageData = this.layerFuncData[layer]
            // This operation needed to be inline to be performant
            var dataIndex = (y * this.width + x) * 4
            var r = imageData.data[dataIndex++]
            var g = imageData.data[dataIndex++]
            var b = imageData.data[dataIndex++]
            var a = imageData.data[dataIndex++]
            let isOtherLevel = false
            if (a === 255) {
                switch (r) {
                    case splitTime.Trace.RColor.SOLID:
                        var height = layerZ + g
                        if (height >= minZ) {
                            collisionInfo.containsSolid = true
                            collisionInfo.zBlockedTopEx = Math.max(
                                height,
                                collisionInfo.zBlockedTopEx
                            )
                        }
                        break
                    case splitTime.Trace.RColor.EVENT:
                        var eventId = this.getEventIdFromPixel(r, g, b, a)
                        if (!collisionInfo.events[eventId]) {
                            collisionInfo.events[eventId] = new traces.ZRange(
                                minZ,
                                exMaxZ
                            )
                        } else {
                            collisionInfo.events[eventId].minZ = Math.min(
                                minZ,
                                collisionInfo.events[eventId].minZ
                            )
                            collisionInfo.events[eventId].exMaxZ = Math.max(
                                exMaxZ,
                                collisionInfo.events[eventId].exMaxZ
                            )
                        }
                        break
                    case splitTime.Trace.RColor.POINTER:
                        isOtherLevel = true
                        var trace = this.getPointerTraceFromPixel(r, g, b, a)
                        assert(!!trace.level, "Pointer trace has no level")
                        collisionInfo.pointerTraces[trace.level.id] = trace
                        collisionInfo.levels[trace.level.id] = trace.level
                        break
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
