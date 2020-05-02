var TRACE_GROUND_COLOR = "rgba(100, 100, 100, .5)";
var TRACE_GROUND_HIGHLIGHT_COLOR = "rgba(200, 200, 50, .5)";

Vue.component("rendered-trace", {
    props: ["trace", "index"],
    template: "#rendered-trace-template",
    computed: {
        hasClose: function() {
            var pointArray = safeExtractTraceArray(this.trace.vertices);
            return pointArray.length > 0 && pointArray.pop() === null;
        },
        height: function() {
            return this.trace.height;
        },
        vertices: function() {
            var that = this;
            var pointsArray = safeExtractTraceArray(this.trace.vertices);
            return pointsArray.filter(function(point) {
                return !!point;
            }).map(function(point) {
                return {
                    x: point.x,
                    y: point.y,
                    z: that.trace.z
                };
            });
        },
        points: function() {
            var that = this;
            var pointsArray = safeExtractTraceArray(this.trace.vertices);
            return pointsArray.reduce(function(pointsStr, point) {
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
        },
        pointsShadow: function() {
            var that = this;
            var pointsArray = safeExtractTraceArray(this.trace.vertices);
            pointsArray = pointsArray.map(function(point) {
                if(!point) {
                    return point;
                }
                point.z = that.trace.z + that.trace.height;
                return point;
            });
            return pointsArray.reduce(function(pointsStr, point) {
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
        },
        pointsStairsSlope: function() {
            var that = this;
            var pointsArray = safeExtractTraceArray(this.trace.vertices);
            if(this.trace.type === splitTime.Trace.Type.STAIRS && !!this.trace.direction && pointsArray.length >= 3) {
                var officialTrace = splitTime.Trace.fromRaw(this.trace);
                var extremes = officialTrace.calculateStairsExtremes();
                var stairsVector = new splitTime.Vector2D(extremes.top.x - extremes.bottom.x, extremes.top.y - extremes.bottom.y);
                var stairsLength = stairsVector.magnitude;
                var totalDZ = that.trace.height;
                pointsArray = pointsArray.map(function(point) {
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
            return pointsArray.reduce(function(pointsStr, point) {
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
        },
        traceFill: function() {
            return safeGetColor(this.trace);
        },
        traceStroke: function() {
            return this.hasClose ? "black" : safeGetColor(this.trace);
        },
        traceOpacity: function() {
            return this.hasClose ? 1 : 0;
        },
        traceShadowFill: function() {
            return this.trace.isHighlighted ? TRACE_GROUND_HIGHLIGHT_COLOR : TRACE_GROUND_COLOR;
        },
        traceShadowStroke: function() {
            return "black";
        },
        traceShadowDisplayed: function() {
            return this.height > 0;
        }
    },
    methods: {
        edit: function() {
            showEditorTrace(this.trace);
        },
        track: function(point) {
            if(pathInProgress) {
                return;
            }
            follower = {
                trace: this.trace,
                point: point
            };
        },
        toggleHighlight: function(highlight) {
            if(mouseDown) {
                return;
            }
            this.trace.isHighlighted = highlight && !pathInProgress;
        }
    }
});
