namespace splitTime.editor.level {
    interface VueRenderedTrace {
        // props
        levelEditorShared: LevelEditorShared
        metadata: client.EditorMetadata
        offset: Coordinates2D
        trace: splitTime.level.file_data.Trace
        // data
        uid: string
        // computed
        acceptMouse: boolean
        hasClose: boolean
        height: number
        vertices: Coordinates3D[]
        mousableStyle: object
        pointsArray: (Readonly<Coordinates2D> | null)[]
        points: string
        pointsShadow: string
        pointsStairsSlope: string
        traceFill: string
        traceStroke: string
        traceShadowFill: string
        traceShadowStroke: string
        traceShadowDisplayed: boolean
        otherLevelDisplayed: boolean
        otherLevelImgSrc: string
        // asyncComputed
        otherLevel: splitTime.level.FileData
        otherLevelImgDim: Coordinates2D
        // methods
        track(point: Coordinates2D): void
        toggleHighlight(highlight: boolean): void
    }

    function acceptMouse(this: VueRenderedTrace): boolean {
        return inGroup(this.levelEditorShared.level, this.levelEditorShared.activeGroup, this.trace)
    }

    function hasClose(this: VueRenderedTrace): boolean {
        var pointArray = this.pointsArray
        return pointArray.length > 0 && pointArray[pointArray.length - 1] === null
    }
    function height(this: VueRenderedTrace): number {
        return this.trace.height
    }
    function vertices(this: VueRenderedTrace): Coordinates3D[] {
        var pointsArray = this.pointsArray
        const nonNullPoints = pointsArray.filter(point => {
            return point !== null
        }) as Readonly<Coordinates2D>[]
        return nonNullPoints.map(point => {
            return {
                x: point.x,
                y: point.y,
                z: this.trace.z
            }
        })
    }

    function mousableStyle(this: VueRenderedTrace): object {
        return {
            "pointer-events": this.acceptMouse ? "initial" : "none"
        }
    }

    function pointsArray(this: VueRenderedTrace): (Readonly<Coordinates2D> | null)[] {
        return safeExtractTraceArray(this.levelEditorShared.level, this.trace.vertices)
    }

    function points(this: VueRenderedTrace): string {
        var that = this
        var pointsArray = this.pointsArray
        return pointsArray.map(point => {
            if(point !== null) {
                const y = point.y - that.trace.z
                return point.x + "," + y
            } else if(pointsArray.length > 0 && pointsArray[0] !== null) {
                const y = pointsArray[0].y - that.trace.z
                return pointsArray[0].x + "," + y
            }
            return ""
        }).join(" ")
    }
    function pointsShadow(this: VueRenderedTrace): string {
        const pointsArray2D = this.pointsArray
        const pointsArray3D = pointsArray2D.map(point => {
            if(!point) {
                return null
            }
            const point3D = {
                x: point.x,
                y: point.y,
                z: this.trace.z + this.trace.height
            }
            return point3D
        })
        return pointsArray3D.reduce((pointsStr, point) => {
            var y
            if(point !== null) {
                y = point.y - point.z
                return pointsStr + " " + point.x + "," + y
            } else if(pointsArray3D.length > 0 && pointsArray3D[0] !== null) {
                y = pointsArray3D[0].y - pointsArray3D[0].z
                return pointsStr + " " + pointsArray3D[0].x + "," + y
            }
            return pointsStr
        }, "")
    }
    function pointsStairsSlope(this: VueRenderedTrace): string {
        var that = this
        const pointsArray2D = this.pointsArray
        let pointsArray3D: (Coordinates3D | null)[] = []
        if(this.trace.type === splitTime.trace.Type.STAIRS && !!this.trace.direction && pointsArray2D.length >= 3) {
            var officialTrace = splitTime.trace.TraceSpec.fromRaw(this.trace)
            var extremes = officialTrace.calculateStairsExtremes()
            var stairsVector = new splitTime.Vector2D(extremes.top.x - extremes.bottom.x, extremes.top.y - extremes.bottom.y)
            var stairsLength = stairsVector.magnitude
            var totalDZ = that.trace.height
            pointsArray3D = pointsArray2D.map(point => {
                if(!point) {
                    return point
                }
                var partUpVector = new splitTime.Vector2D(point.x - extremes.bottom.x, point.y - extremes.bottom.y) 
                var distanceUp = stairsVector.times(partUpVector.dot(stairsVector) / (stairsLength * stairsLength)).magnitude
                var height = Math.min(Math.round(totalDZ * (distanceUp / stairsLength)), totalDZ)
                const point3D = {
                    x: point.x,
                    y: point.y,
                    z: that.trace.z + height
                }
                return point3D
            })
        }
        return pointsArray3D.reduce(function(pointsStr, point) {
            var y
            if(point !== null) {
                y = point.y - point.z
                return pointsStr + " " + point.x + "," + y
            } else if(pointsArray3D.length > 0 && pointsArray3D[0] !== null) {
                y = pointsArray3D[0].y - pointsArray3D[0].z
                return pointsStr + " " + pointsArray3D[0].x + "," + y
            }
            return pointsStr
        }, "")
    }
    function traceFill(this: VueRenderedTrace): string {
        if (!this.hasClose) {
            return "none"
        }
        if (this.otherLevelDisplayed && this.otherLevelImgSrc) {
            return "url(#img-" + this.uid + ")"
        }
        return safeGetColor(this.trace, this.metadata)
    }
    function traceStroke(this: VueRenderedTrace): string {
        return this.hasClose ? "black" : safeGetColor(this.trace, this.metadata)
    }
    function traceShadowFill(this: VueRenderedTrace): string {
        return this.metadata.highlighted ? client.TRACE_GROUND_HIGHLIGHT_COLOR : client.TRACE_GROUND_COLOR
    }
    function traceShadowStroke(this: VueRenderedTrace): string {
        return "black"
    }
    function traceShadowDisplayed(this: VueRenderedTrace): boolean {
        return this.hasClose && this.height > 0
    }
    function otherLevelDisplayed(this: VueRenderedTrace): boolean {
        const isTypeOtherLevel = this.trace.type === splitTime.trace.Type.POINTER ||
            this.trace.type === splitTime.trace.Type.TRANSPORT
        return isTypeOtherLevel && this.metadata.highlighted
    }

    async function otherLevel(this: VueRenderedTrace): Promise<splitTime.level.FileData> {
        if (!this.trace.level) {
            return exportLevel(new Level())
        }
        const s = this.levelEditorShared.server
        return s.api.levelJson.fetch(s.withProject({ levelId: this.trace.level }))
    }
    function otherLevelImgSrc(this: VueRenderedTrace): string {
        return this.levelEditorShared.server.imgSrc(this.otherLevel.background)
    }
    async function otherLevelImgDim(this: VueRenderedTrace): Promise<Coordinates2D> {
        return new Promise<Coordinates2D>(resolve => {
            const img = new Image()
            img.src = this.otherLevelImgSrc
            img.onload = () => {
                resolve({
                    x: img.width,
                    y: img.height
                })
            }
        })
    }

    function track(this: VueRenderedTrace, point?: Coordinates2D): void {
        if(this.levelEditorShared.shouldDragBePrevented()) {
            return
        }
        const trace = this.trace
        const originalPointString = trace.vertices
        const originalPoint = point ? new Coordinates2D(point.x, point.y) : null
        const vertices = safeExtractTraceArray(this.levelEditorShared.level, trace.vertices)
        const originalPoints = point ? [point] : vertices.filter(instanceOf.Coordinates2D)
        const snappedMover = new client.GridSnapMover(this.levelEditorShared.gridCell, originalPoints)
        const follower = {
            shift: (dx: number, dy: number) => {
                snappedMover.applyDelta(dx, dy)
                const snappedDelta = snappedMover.getSnappedDelta()
                var regex = /\((-?[\d]+),\s*(-?[\d]+)\)/g
                if (originalPoint) {
                    regex = new RegExp("\\((" + originalPoint.x + "),\\s*(" + originalPoint.y + ")\\)", "g")
                }
                trace.vertices = originalPointString.replace(regex, function(match, p1, p2) {
                    var newX = Number(p1) + snappedDelta.x
                    var newY = Number(p2) + snappedDelta.y
                    return "(" + newX + ", " + newY + ")"
                })
            }
        }
        this.levelEditorShared.follow(follower)
        this.levelEditorShared.editProperties(getTracePropertiesStuff(this.levelEditorShared.level, this.trace))
    }
    function toggleHighlight(this: VueRenderedTrace, highlight: boolean): void {
        if(this.levelEditorShared.shouldDragBePrevented()) {
            this.metadata.highlighted = false
            return
        }
        this.metadata.highlighted = highlight
    }


    Vue.component("rendered-trace", {
        props: {
            levelEditorShared: Object,
            metadata: Object,
            trace: Object
        },
        data: function() {
            return {
                uid: generateUID()
            }
        },
        computed: {
            acceptMouse,
            hasClose,
            height,
            vertices,
            mousableStyle,
            pointsArray,
            points,
            pointsShadow,
            pointsStairsSlope,
            traceFill,
            traceStroke,
            traceShadowFill,
            traceShadowStroke,
            traceShadowDisplayed,
            otherLevelDisplayed,
            otherLevelImgSrc
        },
        asyncComputed: {
            otherLevel: {
                get: otherLevel,
                default: exportLevel(new Level())
            },
            otherLevelImgDim: {
                get: otherLevelImgDim,
                default: { x: PLACEHOLDER_WIDTH, y: PLACEHOLDER_WIDTH }
            }
        },
        methods: {
            track,
            toggleHighlight
        },
        template: `
<g>
    <defs>
        <!-- Window to linked level FTODO: change to showing more than just background -->
        <pattern
            v-if="otherLevelDisplayed"
            :id="'img-' + uid"
            :x="-trace.offsetX"
            :y="-trace.offsetY + trace.offsetZ"
            :width="otherLevel.width + 1000"
            :height="otherLevel.height + 1000"
            patternUnits="userSpaceOnUse"
        >
            <rect
                x="0"
                y="0"
                :width="otherLevel.width + 1000"
                :height="otherLevel.height + 1000"
                fill="black"
            />
            <image
                :x="otherLevel.backgroundOffsetX"
                :y="otherLevel.backgroundOffsetY"
                :width="otherLevelImgDim.x"
                :height="otherLevelImgDim.y"
                preserveAspectRatio="none"
                :href="otherLevelImgSrc"
            />
        </pattern>
    </defs>
    <!-- Base outline and fill -->
    <polyline
        :style="mousableStyle"
        v-show="metadata.displayed"
        @dblclick.prevent
        @mousedown.left="track(null)"
        @mousemove="toggleHighlight(true)"
        @mouseleave="toggleHighlight(false)"
        :points="points"
        :stroke="traceStroke"
        :fill="traceFill"
    ></polyline>
    <!-- Points/vertices -->
    <circle
        :style="mousableStyle"
        v-show="metadata.displayed"
        class="hoverable"
        v-for="(vertex) in vertices"
        :cx="vertex.x"
        :cy="vertex.y - vertex.z"
        r="3"
        @mousedown.left="track(vertex)"
    />
    <!-- Outline for ramp/slope part of stairs; adds more of a 3D look -->
    <polyline
        v-show="metadata.displayed"
        :points="pointsStairsSlope"
        stroke="red" stroke-width="5" fill="none"
        v-if="pointsStairsSlope"
        style="pointer-events: none;"
    ></polyline>
    <!-- Up-arrows fill pattern on ramp/slope plus additional dashed outline on top of the previous -->
    <polyline
        v-show="metadata.displayed"
        :points="pointsStairsSlope"
        stroke="black" stroke-width="2" stroke-dasharray="10,5" :fill="'url(#up-arrows-pattern)'"
        v-if="pointsStairsSlope"
        style="pointer-events: none;"
    ></polyline>
    <!-- Outline and fill for the top (z-axis/height) face area of the trace's volume -->
    <polyline
        v-show="metadata.displayed"
        :points="pointsShadow"
        :fill="traceShadowFill"
        :stroke="traceShadowStroke"
        v-if="traceShadowDisplayed"
        style="pointer-events: none;"
    ></polyline>
</g>
        `
    })
}
