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
            return pointsArray.reduce(function(pointsStr, point) {
                var y;
                if(point !== null) {
                    y = point.y - that.trace.z - that.height;
                    return pointsStr + " " + point.x + "," + y;
                } else if(pointsArray.length > 0 && pointsArray[0] !== null) {
                    y = pointsArray[0].y - that.trace.z - that.height;
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
