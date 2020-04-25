namespace splitTime.level {
    export namespace traces {
        export class ZRange {
            constructor(public minZ: number, public exMaxZ: number) {}
        }

        export class CollisionInfo {
            containsSolid: boolean
            levels: { [levelId: string]: Level }
            pointerTraces: { [levelId: string]: splitTime.Trace }
            zBlockedTopEx: int
            zBlockedBottom: int
            events: { [eventId: string]: ZRange }
            constructor() {
                this.containsSolid = false
                this.levels = {}
                this.pointerTraces = {}
                this.zBlockedTopEx = 0
                this.zBlockedBottom = splitTime.MAX_SAFE_INTEGER
                this.events = {}
            }
        }
    }

    export class Traces {
        level: splitTime.Level
        levelFileData: splitTime.level.FileData
        traces: Trace[]
        _layerZs: int[]
        layerFuncData: ImageData[]
        _nextFunctionId: int
        _internalEventIdMap: { [intId: number]: string }
        _nextPointerId: int
        _internalPointerTraceMap: { [intId: number]: splitTime.Trace }
        debugTraceCanvas: splitTime.Canvas | null = null

        constructor(
            level: splitTime.Level,
            levelFileData: splitTime.level.FileData,
            world: World
        ) {
            this.level = level
            this.levelFileData = levelFileData
            this._layerZs = []
            this.layerFuncData = []

            this._internalEventIdMap = {}
            this._internalPointerTraceMap = {}
            this._nextFunctionId = 1
            this._nextPointerId = 1

            const holderCanvas = new splitTime.Canvas(this.level.width, this.level.yWidth)
            const holderCtx = holderCanvas.context

            let debugTraceCtx = null
            if (splitTime.debug.ENABLED) {
                this.debugTraceCanvas = new splitTime.Canvas(this.level.width, this.level.height)
                debugTraceCtx = this.debugTraceCanvas.context
                debugTraceCtx.clearRect(
                    0,
                    0,
                    this.debugTraceCanvas.width,
                    this.debugTraceCanvas.height
                )
            }

            this.traces = []
            const zSet: { [z: number]: true } = {}
            for (const rawTrace of this.levelFileData.traces) {
                this.traces.push(Trace.fromRaw(rawTrace, world))
                zSet[+rawTrace.z] = true
            }
            const zArray: number[] = []
            for (const z in zSet) {
                zArray.push(+z)
            }
            this._layerZs = zArray.sort()

            //Initialize functional map
            for (
                var iLayer = 0;
                iLayer < this._layerZs.length;
                iLayer++
            ) {
                holderCtx.clearRect(
                    0,
                    0,
                    holderCanvas.width,
                    holderCanvas.height
                )

                var layerZ = this._layerZs[iLayer]
                var nextLayerZ = this._layerZs[iLayer + 1] || Number.MAX_VALUE

                holderCtx.translate(0.5, 0.5)

                for (const trace of this.traces) {
                    this.drawPartialSolidTrace(trace, holderCtx, layerZ, nextLayerZ)
                }
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

        drawPartialSolidTrace(trace: Trace, holderCtx: CanvasRenderingContext2D, minZ: int, exMaxZ: int): void {
            const maxHeight = exMaxZ - minZ
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
                    assert(trace.direction !== null, "Stairs trace must have a direction")
                    const gradient = splitTime.Trace.calculateGradient(
                        trace.vertices,
                        holderCtx,
                        trace.direction
                    )
                    const startFraction = minZRelativeToTrace / trace.height
                    if (startFraction >= 0 && startFraction <= 1) {
                        gradient.addColorStop(startFraction, noColor)
                        gradient.addColorStop(startFraction, groundColor)

                        const stairsTopThisLayer = Math.min(trace.z + trace.height, exMaxZ)
                        const stairsTopRelativeToTrace = stairsTopThisLayer - trace.z
                        const endFraction = stairsTopRelativeToTrace / trace.height
                        gradient.addColorStop(endFraction, topColor)
                        gradient.addColorStop(endFraction, noColor)

                        splitTime.Trace.drawColor(
                            trace.vertices,
                            holderCtx,
                            gradient
                        )
                    }
                    break
            }
        }

        drawPartialSpecialTrace(trace: Trace, holderCtx: CanvasRenderingContext2D, minZ: int, exMaxZ: int): void {
            if (!isOverlap(trace.z, trace.height, minZ, exMaxZ)) {
                return
            }
            // FTODO: support adding multiple in same pixel
            // Will require additive blending and probably
            // also cell-based lookups
            switch (trace.type) {
                case splitTime.Trace.Type.EVENT:
                    const eventStringId = trace.eventId
                    assert(eventStringId !== null, "Event trace must have an event")
                    const eventIntId = this._nextFunctionId++
                    this._internalEventIdMap[eventIntId] = eventStringId
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
                    const pointerIntId = this._nextPointerId++
                    this._internalPointerTraceMap[pointerIntId] = trace
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
                    const transportIntId = this._nextFunctionId++
                    this._internalEventIdMap[
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

        getEventIdFromPixel(r: number, g: number, b: number, a: number) {
            var eventIntId = splitTime.Trace.getEventIdFromColor(r, g, b, a)
            return this._internalEventIdMap[eventIntId]
        }

        /**
         * @return {splitTime.Trace}
         */
        getPointerTraceFromPixel(
            r: number,
            g: number,
            b: number,
            a: number
        ): splitTime.Trace {
            var pointerIntId = splitTime.Trace.getPointerIdFromColor(r, g, b, a)
            const pointerTrace = this._internalPointerTraceMap[pointerIntId]
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
            for (var y = startY; y < startY + yPixels; y++) {
                for (var x = startX; x < startX + xPixels; x++) {
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
                iLayer < this._layerZs.length;
                iLayer++
            ) {
                var layerZ = this._layerZs[iLayer]
                var nextLayerZ = this._layerZs[iLayer + 1] || splitTime.MAX_SAFE_INTEGER
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
            var dataIndex = pixCoordToIndex(x, y, imageData)
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
                            collisionInfo.zBlockedBottom = Math.min(
                                layerZ,
                                collisionInfo.zBlockedBottom
                            )
                        }
                        break
                    case splitTime.Trace.RColor.EVENT:
                        var eventId = this.getEventIdFromPixel(r, g, b, a)
                        if (!(eventId in collisionInfo.events)) {
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
                collisionInfo.levels[this.level.id] = this.level
            }
        }

        getDebugTraceCanvas() {
            return this.debugTraceCanvas
        }
    }

    /**
     * Gets the index on canvas data of given coordinates
     * @param {int} x
     * @param {int} y
     * @param {ImageData} data Collision canvas data array
     * @returns {int}
     */
    function pixCoordToIndex(x: int, y: int, data: ImageData): int {
        return (y * data.width + x) * 4
    }
}
