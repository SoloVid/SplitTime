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
                pointsArray = pointsArray.map(function(point) {
                    if(!point) {
                        return point;
                    }
                    point.z = that.trace.z + that.trace.height;
                    return point;
                });
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
        // stairsGradient: function() {
        //     return {
        //         x1: "0%",
        //         y1: "0%",
        //         x2: "100%",
        //         y2: "0%"
        //     };
        // },
        traceFill: function() {
            // if(this.trace.type === "stairs") {
            //     return "url(#stairGradient" + this.index + ")";
            // }
			return safeGetColor(this.trace);
        },
        traceStroke: function() {
			return safeGetColor(this.trace);
        },
        traceOpacity: function() {
			return this.hasClose ? 1 : 0;
        },
        traceShadowFill: function() {
            return "rgba(100, 100, 100, .5)";
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
		track: function() {
    	    if(pathInProgress) {
    	        return;
            }
    		follower = this.trace;
		},
        toggleHighlight: function(highlight) {
            if(mouseDown || pathInProgress) {
                return;
            }
            this.trace.isHighlighted = highlight;
        }
	}
});
