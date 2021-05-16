namespace splitTime.editor.client {
    export interface IRenderedTraceTracker {
        track(event: MouseEvent, point?: Coordinates2D): void
    }

    interface VueRenderedTrace {
        // props
        acceptMouse: boolean
        metadata: client.EditorMetadata
        pointsArray: (Readonly<Coordinates2D> | null)[]
        server: client.ServerLiaison
        shouldDragBePrevented: boolean
        trace: splitTime.level.file_data.Trace
        tracker: IRenderedTraceTracker
        // data
        uid: string
        // computed
        hasClose: boolean
        height: number
        vertices: Coordinates3D[]
        mousableStyle: object
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
        const pointsArray2D = this.pointsArray
        let pointsArray3D: (Coordinates3D)[] = []
        if(this.trace.type === splitTime.trace.Type.STAIRS && !!this.trace.direction && pointsArray2D.length >= 3) {
            const officialTrace = splitTime.trace.TraceSpec.fromRaw(this.trace)
            pointsArray3D = splitTime.trace.calculateStairsPlane(officialTrace, pointsArray2D)
        }
        return pointsArray3D.reduce(function(pointsStr, point) {
            const y = point.y - point.z
            return pointsStr + " " + point.x + "," + y
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
            return level.exportLevel(new level.Level())
        }
        const s = this.server
        return s.api.levelJson.fetch(s.withProject({ levelId: this.trace.level }))
    }
    function otherLevelImgSrc(this: VueRenderedTrace): string {
        return this.server.imgSrc(this.otherLevel.background)
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

    function track(this: VueRenderedTrace, event: MouseEvent, point?: Coordinates2D): void {
        if(this.shouldDragBePrevented) {
            return
        }
        this.tracker.track(event, point)
    }
    function toggleHighlight(this: VueRenderedTrace, highlight: boolean): void {
        if(this.shouldDragBePrevented) {
            this.metadata.highlighted = false
            return
        }
        this.metadata.highlighted = highlight
    }


    Vue.component("rendered-trace", {
        props: {
            acceptMouse: Boolean,
            metadata: Object,
            pointsArray: Array,
            server: Object,
            shouldDragBePrevented: Boolean,
            trace: Object,
            tracker: Object
        },
        data: function() {
            return {
                uid: generateUID()
            }
        },
        computed: {
            hasClose,
            height,
            vertices,
            mousableStyle,
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
                default: level.exportLevel(new level.Level())
            },
            otherLevelImgDim: {
                get: otherLevelImgDim,
                default: { x: level.PLACEHOLDER_WIDTH, y: level.PLACEHOLDER_WIDTH }
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
        @mousedown.left="track($event, null)"
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
        @mousedown.left="track($event, vertex)"
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
