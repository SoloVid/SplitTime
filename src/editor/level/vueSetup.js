levelObject = {
    type: "action",
    region: "somewhere",
    layers: [
        {
        	displayed: true,
            background: "level_FirstFight_Lower.jpg",
			height: 0,
            traces: [
				{
					type: "solid",
					vertices: "(0, 384) (503, 384) (503, 641) (641, 641) (640, 2) (0, 1) (close)"
				}
			],
        }
    ],
    props: [],
    positions: []
};

function imgSrc(fileName) {
	if(!fileName) {
		return "";
	}
    return projectPath + "images/" + fileName;
}

function safeGetColor(type) {
    if(!window.SplitTime) {
        return [];
    }
    return SplitTime.Trace.getColor(type);
}
function safeExtractTraceArray(traceStr) {
    if(!window.SplitTime) {
        return [];
    }
    return SplitTime.Trace.extractArray(traceStr);
}

Vue.component("rendered-trace", {
    props: ["trace", "width", "height"],
    template: "#rendered-trace-template",
    computed: {
        points: function() {
        	var pointsArray = safeExtractTraceArray(this.trace.vertices);
			return pointsArray.reduce(function(pointsStr, point) {
				if(point !== null) {
					return pointsStr + " " + point.x + "," + point.y;
				}
				return pointsStr;
			}, "");
        },
        traceFill: function() {
			return safeGetColor(this.trace.type);
        },
        traceStroke: function() {
			return safeGetColor(this.trace.type);
        },
        traceOpacity: function() {
        	var pointArray = safeExtractTraceArray(this.trace.vertices);
			var hasClose = pointArray.length > 0 && pointArray.pop() === null;
			return hasClose ? 1 : 0;
        }
    }
});

Vue.component("rendered-prop", {
    props: ["prop"],
    template: "#rendered-prop-template",
    computed: {}
});

Vue.component("rendered-layer", {
    props: ["level", "layer", "index", "width", "height"],
    template: "#rendered-layer-template",
    computed: {
    	imgSrc: function() {
    		return imgSrc(this.layer.background);
		},
        props: function() {
    		var layerAbove = this.level.layers[this.index + 1];
    		var maxHeight = layerAbove ? layerAbove.height : Number.MAX_VALUE;
        	return this.level.props.filter(function(prop) {
				return prop.z >= this.layer.height && prop.z < maxHeight;
			});
		},
		positions: function() {
            var layerAbove = this.level.layers[this.index + 1];
            var maxHeight = layerAbove ? layerAbove.height : Number.MAX_VALUE;
            return this.level.positions.filter(function(prop) {
                return prop.z >= this.layer.height && prop.z < maxHeight;
            });
		}
    }
});

var vueApp = new Vue({
	el: '#app',
	data: {
		level: levelObject,
		levelWidth: 0,
		levelHeight: 0,
		activeLayer: 0
	},
	computed: {
		// levelWidth: function() {
		// 	// TODO
		// 	return 100;
		// },
		// levelHeight: function() {
		// 	//TODO
		// 	return 100;
		// }
	}
});
