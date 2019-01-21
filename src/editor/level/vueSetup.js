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
                    displayed: true,
                    isHighlighted: false,
                    type: "solid",
                    vertices: "(0, 384) (503, 384) (503, 641) (641, 641) (640, 2) (0, 1) (close)"
                },
                {
                    displayed: true,
                    isHighlighted: false,
                    type: "function",
                    vertices: "(100, 384) (503, 384) (503, 641) (641, 641) (640, 102) (100, 100) (close)"
                },
			],
        }
    ],
    props: [
        {
            displayed: true,
            id: "banner",
			template: "Ruby_Banner",
            x: 50,
            y: 50,
            z: 0,
            dir: 3,
            stance: "default"
        }
	],
    positions: [
		{
			displayed: true,
			id: "patrol1",
			x: 50,
			y: 50,
			z: 0,
			dir: 3,
			stance: "default"
		}
	]
};

function imgSrc(fileName) {
	if(!fileName) {
		return "";
	}
    return projectPath + "images/" + fileName;
}

function safeGetColor(trace) {
    // if(!window.SplitTime) {
    //     return [];
    // }
    // return SplitTime.Trace.getColor(type);
	if(trace.isHighlighted) {
		return traceEditorColors["highlight"];
	}
    return traceEditorColors[trace.type];
}
function safeExtractTraceArray(traceStr) {
    // if(!window.SplitTime) {
    //     return [];
    // }
    return SplitTime.Trace.extractArray(traceStr);
}

Vue.component("rendered-trace", {
    props: ["trace"],
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
			return safeGetColor(this.trace);
        },
        traceStroke: function() {
			return safeGetColor(this.trace);
        },
        traceOpacity: function() {
        	var pointArray = safeExtractTraceArray(this.trace.vertices);
			var hasClose = pointArray.length > 0 && pointArray.pop() === null;
			return hasClose ? 1 : 0;
        }
    },
	methods: {
    	edit: function() {
    		console.log("himom");
    		showEditorTrace(this.trace);
		},
		mousedown: function() {
    		follower = this.trace;
    		setMode("trace");
		}
	}
});

Vue.component("rendered-prop", {
    props: ["prop"],
    template: "#rendered-prop-template",
    computed: {
    	imgSrc: function() {

		},
    	positionLeft: function() {

		},
		positionTop: function() {

		},
		width: function() {

		},
		height: function() {

		},
		cropLeft: function() {
            return 0;
		},
		cropTop: function() {
            return 0;
		}
	}
});

Vue.component("rendered-position", {
    props: ["position"],
    template: "#rendered-position-template",
    computed: {
        imgSrc: function() {

        },
        positionLeft: function() {

        },
        positionTop: function() {

        },
        width: function() {

        },
        height: function() {

        },
        cropLeft: function() {
            return 0;
        },
        cropTop: function() {
			return 0;
        }
    }
});

Vue.component("rendered-layer", {
    props: ["level", "layer", "index", "width", "height"],
    template: "#rendered-layer-template",
    computed: {
    	imgSrc: function() {
    		return imgSrc(this.layer.background);
		},
        props: function() {
    		var that = this;
    		var layerAbove = this.level.layers[this.index + 1];
    		var maxHeight = layerAbove ? layerAbove.height : Number.MAX_VALUE;
        	return this.level.props.filter(function(prop) {
				return prop.z >= that.layer.height && prop.z < maxHeight;
			});
		},
		positions: function() {
    		var that = this;
            var layerAbove = this.level.layers[this.index + 1];
            var maxHeight = layerAbove ? layerAbove.height : Number.MAX_VALUE;
            return this.level.positions.filter(function(pos) {
                return pos.z >= that.layer.height && pos.z < maxHeight;
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
	},
	methods: {
		createLayer: function() {
            this.level.layers.push({
                displayed: true,
                background: "",
                traces: []
            });
		},
		editLayer: function(layer) {
			showEditorLayer(layer);
		},
		editTrace: function(trace) {
			showEditorTrace(trace);
		},
		editProp: function(prop) {
			showEditorProp(prop);
		},
		editPosition: function(position) {
			showEditorPosition(position);
		}
	}
});
