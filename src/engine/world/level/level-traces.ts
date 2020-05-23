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
                holderCtx.clearRect(
                    0,
                    0,
                    holderCanvas.width,
                    holderCanvas.height
                )

                const layerZ = this.layerZs[iLayer]
                // This operation is safe because there should be a sentinel
                const nextLayerZ = this.layerZs[iLayer + 1]

                // holderCtx.translate(0.5, 0.5)

                const existingGCO = holderCtx.globalCompositeOperation
                // The operation we want here is to take the brighter of the pixels.
                // According to MDN, that should be "lighten."
                // However, "lighten" seems to be an alias for "lighter" (additive)
                // in all three major browsers I tried.
                // holderCtx.globalCompositeOperation = "lighten"
                for (const trace of tracesSortedFromBottomToTop) {
                    this.drawPartialSolidTrace(trace, holderCtx, extraBuffer, layerZ, nextLayerZ)
                }
                holderCtx.globalCompositeOperation = existingGCO
                // We are drawing these in a separate loop because in the future
                // we want these to be additively drawn ("lighter") while the solids are drawn normally
                for (const trace of this.traces) {
                    this.drawPartialSpecialTrace(trace, holderCtx, extraBuffer, layerZ, nextLayerZ)
                }

                // TODO: traces related to props

                // holderCtx.translate(-0.5, -0.5)

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
            const groundColor = splitTime.trace.getSolidColor(0)
            const topColor = splitTime.trace.getSolidColor(pixelHeight)
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

        private drawPartialSpecialTrace(trace: Trace, holderCtx: GenericCanvasRenderingContext2D, extraBuffer: splitTime.Canvas, minZ: int, exMaxZ: int): void {
            const spec = trace.spec
            if (!isOverlap(spec.z, spec.height, minZ, exMaxZ - minZ)) {
                return
            }
            // FTODO: support adding multiple in same pixel
            // Will require additive blending and probably
            // also cell-based lookups
            switch (spec.type) {
                case splitTime.trace.Type.EVENT:
                    const eventStringId = spec.eventId
                    assert(eventStringId !== null, "Event trace must have an event")
                    const eventIntId = this.nextFunctionId++
                    this.internalEventIdMap[eventIntId] = eventStringId
                    const functionColor = splitTime.trace.getEventColor(
                        eventIntId
                    )
                    trace.drawColor(
                        holderCtx,
                        extraBuffer,
                        functionColor
                    )
                    break
                case splitTime.trace.Type.POINTER:
                    const pointerIntId = this.nextPointerId++
                    this.internalPointerTraceMap[pointerIntId] = trace
                    const pointerColor = splitTime.trace.getPointerColor(
                        pointerIntId
                    )
                    trace.drawColor(
                        holderCtx,
                        extraBuffer,
                        pointerColor
                    )
                    break
                case splitTime.trace.Type.TRANSPORT:
                    const transportStringId = trace.getLocationId()
                    const transportIntId = this.nextFunctionId++
                    this.internalEventIdMap[
                        transportIntId
                    ] = transportStringId
                    const transportColor = splitTime.trace.getEventColor(
                        transportIntId
                    )
                    trace.drawColor(
                        holderCtx,
                        extraBuffer,
                        transportColor
                    )
                    break
            }
        }

        private getEventIdFromPixel(r: number, g: number, b: number, a: number) {
            var eventIntId = splitTime.trace.getEventIdFromColor(r, g, b, a)
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
            var pointerIntId = splitTime.trace.getPointerIdFromColor(r, g, b, a)
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
            let isOtherLevel = false
            if (a === 255) {
                switch (r) {
                    case splitTime.trace.RColor.SOLID:
                        var height = layerZ + g
                        if (height >= minZ) {
                            collisionInfo.containsSolid = true
                            collisionInfo.zBlockedTopEx = Math.max(
                                height,
                                collisionInfo.zBlockedTopEx
                            )
                        }
                        break
                    case splitTime.trace.RColor.EVENT:
                        if (ignoreEvents) {
                            break
                        }
                        // TODO: check event height
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
                    case splitTime.trace.RColor.POINTER:
                        isOtherLevel = true
                        var trace = this.getPointerTraceFromPixel(r, g, b, a)
                        if (!isOverlap(minZ, exMaxZ - minZ, trace.spec.z, trace.spec.height)) {
                            break
                        }
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
