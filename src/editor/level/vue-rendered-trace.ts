namespace splitTime.editor.level {

    export interface VueRenderedTrace {
        trace: any
        index: number
        hasClose: any
        height: any
        vertices: any
        points: any
        pointsShadow: any
        pointsStairsSlope: any
        traceFill: any
        traceStroke: any
        traceShadowFill: any
        traceShadowStroke: any
        traceShadowDisplayed: any
        edit(): any
        track(point: any): any
        toggleHighlight(highlight: boolean): any
    }

    export const TRACE_GROUND_COLOR = "rgba(100, 100, 100, .5)";
    export const TRACE_GROUND_HIGHLIGHT_COLOR = "rgba(200, 200, 50, .5)";

    function hasClose(this: VueRenderedTrace): any {
        var pointArray = safeExtractTraceArray(this.trace.vertices);
        return pointArray.length > 0 && pointArray.pop() === null;
    }
    function height(this: VueRenderedTrace): any {
        return this.trace.height;
    }
    function vertices(this: VueRenderedTrace): any {
        var that = this;
        var pointsArray = safeExtractTraceArray(this.trace.vertices);
        return pointsArray.filter(function(point) {
            return !!point;
        }).map(function(point: any) {
            return {
                x: point!.x,
                y: point!.y,
                z: that.trace.z
            };
        });
    }
    function points(this: VueRenderedTrace): any {
        var that = this;
        var pointsArray: any[] = safeExtractTraceArray(this.trace.vertices);
        return pointsArray.reduce(function(pointsStr, point: any) {
            var y;
            if(point !== null) {
                y = point.y - that.trace.z;
                return pointsStr + " " + point.x + "," + y;
            } else if(pointsArray.length > 0 && pointsArray[0] !== null) {
                y = pointsArray[0].y - that.trace.z;
                return pointsStr + " " + pointsArray[0].x + "," + y;
            }
            return pointsStr;
        }, "");
    }
    function pointsShadow(this: VueRenderedTrace): any {
        var that = this;
        var pointsArray: any[] = safeExtractTraceArray(this.trace.vertices);
        pointsArray = pointsArray.map(function(point) {
            if(!point) {
                return point;
            }
            point.z = that.trace.z + that.trace.height;
            return point;
        });
        return pointsArray.reduce(function(pointsStr, point: any) {
            var y;
            if(point !== null) {
                y = point.y - point.z;
                return pointsStr + " " + point.x + "," + y;
            } else if(pointsArray.length > 0 && pointsArray[0] !== null) {
                y = pointsArray[0].y - pointsArray[0].z;
                return pointsStr + " " + pointsArray[0].x + "," + y;
            }
            return pointsStr;
        }, "");
    }
    function pointsStairsSlope(this: VueRenderedTrace): any {
        var that = this;
        var pointsArray: any[] = safeExtractTraceArray(this.trace.vertices);
        if(this.trace.type === splitTime.trace.Type.STAIRS && !!this.trace.direction && pointsArray.length >= 3) {
            var officialTrace = splitTime.trace.TraceSpec.fromRaw(this.trace);
            var extremes = officialTrace.calculateStairsExtremes();
            var stairsVector = new splitTime.Vector2D(extremes.top.x - extremes.bottom.x, extremes.top.y - extremes.bottom.y);
            var stairsLength = stairsVector.magnitude;
            var totalDZ = that.trace.height;
            pointsArray = pointsArray.map(function(point: any) {
                if(!point) {
                    return point;
                }
                var partUpVector = new splitTime.Vector2D(point.x - extremes.bottom.x, point.y - extremes.bottom.y); 
                var distanceUp = stairsVector.times(partUpVector.dot(stairsVector) / (stairsLength * stairsLength)).magnitude;
                var height = Math.min(Math.round(totalDZ * (distanceUp / stairsLength)), totalDZ);
                point.z = that.trace.z + height;
                return point;
            });
        } else {
            pointsArray = [];
        }
        return pointsArray.reduce(function(pointsStr, point: any) {
            var y;
            if(point !== null) {
                y = point.y - point.z;
                return pointsStr + " " + point.x + "," + y;
            } else if(pointsArray.length > 0 && pointsArray[0] !== null) {
                y = pointsArray[0].y - pointsArray[0].z;
                return pointsStr + " " + pointsArray[0].x + "," + y;
            }
            return pointsStr;
        }, "");
    }
    function traceFill(this: VueRenderedTrace): any {
        return safeGetColor(this.trace);
    }
    function traceStroke(this: VueRenderedTrace): any {
        return this.hasClose ? "black" : safeGetColor(this.trace);
    }
    function traceShadowFill(this: VueRenderedTrace): any {
        return this.trace.isHighlighted ? TRACE_GROUND_HIGHLIGHT_COLOR : TRACE_GROUND_COLOR;
    }
    function traceShadowStroke(this: VueRenderedTrace): any {
        return "black";
    }
    function traceShadowDisplayed(this: VueRenderedTrace): any {
        return this.hasClose && this.height > 0;
    }

    function edit(this: VueRenderedTrace) {
        showEditorTrace(this.trace);
    }
    function track(this: VueRenderedTrace, point: any) {
        if(pathInProgress) {
            return;
        }
        follower = {
            trace: this.trace,
            point: point
        };
    }
    function toggleHighlight(this: VueRenderedTrace, highlight: boolean) {
        if(mouseDown) {
            return;
        }
        this.trace.isHighlighted = highlight && !pathInProgress;
    }


    Vue.component("rendered-trace", {
        props: {
            trace: Object,
            index: Number
        },
        template: `
    <g>
        <polyline
                v-show="trace.displayed && hasClose"
                v-on:dblclick="edit"
                v-on:mousedown.left="track(null)"
                v-on:mouseenter="toggleHighlight(true)"
                v-on:mouseleave="toggleHighlight(false)"
                v-bind:points="points"
                v-bind:fill="traceFill"
        ></polyline>
        <polyline
                v-show="trace.displayed"
                v-on:dblclick="edit"
                v-on:mousedown.left="track(null)"
                v-on:mouseenter="toggleHighlight(true)"
                v-on:mouseleave="toggleHighlight(false)"
                v-bind:points="points"
                v-bind:stroke="traceStroke"
                fill="none"
        ></polyline>
        <circle
                class="hoverable"
                v-for="(vertex) in vertices"
                v-bind:cx="vertex.x"
                v-bind:cy="vertex.y - vertex.z"
                r="3"
                v-on:mousedown.left="track(vertex)"
        />
        <polyline
                v-show="trace.displayed"
                v-bind:points="pointsStairsSlope"
                stroke="red" stroke-width="5" fill="none"
                v-if="pointsStairsSlope"
                style="pointer-events: none;"
        ></polyline>
        <polyline
                v-show="trace.displayed"
                v-bind:points="pointsStairsSlope"
                stroke="black" stroke-width="2" stroke-dasharray="10,5" fill="url(#up-arrows-pattern)"
                v-if="pointsStairsSlope"
                style="pointer-events: none;"
        ></polyline>
        <polyline
                v-show="trace.displayed"
                v-bind:points="pointsShadow"
                v-bind:fill="traceShadowFill"
                v-bind:stroke="traceShadowStroke"
                v-if="traceShadowDisplayed"
                style="pointer-events: none;"
        ></polyline>
    </g>
        `,
        computed: {
            hasClose,
            height,
            vertices,
            points,
            pointsShadow,
            pointsStairsSlope,
            traceFill,
            traceStroke,
            traceShadowFill,
            traceShadowStroke,
            traceShadowDisplayed
        },
        methods: {
            edit,
            track,
            toggleHighlight
        }
    });
}
