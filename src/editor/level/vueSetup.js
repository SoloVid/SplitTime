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
                    id: "himom",
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
            isHighlighted: false,
            id: "banner",
			template: "Ruby Banner",
            x: 350,
            y: 250,
            z: 0,
            dir: 3,
            stance: "default"
        }
	],
    positions: [
		{
			displayed: true,
            isHighlighted: false,
			id: "patrol1",
			x: 50,
			y: 50,
			z: 0,
			dir: 3,
			stance: "default"
		}
	]
};

Vue.component("rendered-trace", {
    props: ["trace"],
    template: "#rendered-trace-template",
    computed: {
        hasClose: function() {
            var pointArray = safeExtractTraceArray(this.trace.vertices);
            return pointArray.length > 0 && pointArray.pop() === null;
        },
        points: function() {
        	var pointsArray = safeExtractTraceArray(this.trace.vertices);
            return pointsArray.reduce(function(pointsStr, point) {
				if(point !== null) {
					return pointsStr + " " + point.x + "," + point.y;
				} else if(pointsArray.length > 0 && pointsArray[0] !== null) {
				    return pointsStr + " " + pointsArray[0].x + "," + pointsArray[0].y;
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
			return this.hasClose ? 1 : 0;
        }
    },
	methods: {
    	edit: function() {
    		console.log("himom");
    		showEditorTrace(this.trace);
		},
		track: function() {
    		follower = this.trace;
    		setMode("trace");
		},
        toggleHighlight: function(highlight) {
            if(follower) {
                return;
            }
            this.trace.isHighlighted = highlight;
        }
	}
});

Vue.component("rendered-prop", {
    props: ["prop"],
    template: "#rendered-prop-template",
    computed: {
        styleObject: function() {
            return {
                outline: this.prop.isHighlighted ? "2px solid yellow" : "",
                backgroundColor: this.prop.isHighlighted ? "yellow" : "initial",
                position: 'absolute',
                overflow: 'hidden',
                left: this.positionLeft + 'px',
                top: this.positionTop + 'px',
                width: this.width + 'px',
                height: this.height + 'px'
            };
        },
    	body: function() {
    		return loadBodyFromTemplate(this.prop.template);
		},
    	imgSrc: function() {
            return this.body.img ? imgSrc(this.body.img) : subImg;
		},
    	positionLeft: function() {
            return this.prop.x - this.body.xres/2 - this.body.baseOffX - this.body.offX;
		},
		positionTop: function() {
            return this.prop.y - this.body.yres + this.body.baseLength/2 - this.body.baseOffY - this.body.offY;
		},
		width: function() {
			return this.body.xres;
		},
		height: function() {
			return this.body.yres;
		},
		cropLeft: function() {
            return this.body.getAnimationFrameCrop(this.body.dir, this.body.stance, 0);
		},
		cropTop: function() {
            return 0;
		}
	},
    methods: {
        edit: function() {
            showEditorTrace(this.prop);
        },
        track: function() {
            follower = this.prop;
            setMode("prop");
        },
        toggleHighlight: function(highlight) {
            if(follower) {
                return;
            }
            this.prop.isHighlighted = highlight;
        }
    }
});

Vue.component("rendered-position", {
    props: ["position"],
    template: "#rendered-position-template",
    computed: {
        styleObject: function() {
            return {
                outline: this.position.isHighlighted ? "2px solid yellow" : "",
                backgroundColor: this.position.isHighlighted ? "yellow" : "initial",
                position: 'absolute',
                overflow: 'hidden',
                left: this.positionLeft + 'px',
                top: this.positionTop + 'px',
                width: this.width + 'px',
                height: this.height + 'px'
            };
        },
        body: function() {
            return loadBodyFromTemplate();
        },
        imgSrc: function() {
            return this.body.img ? imgSrc(this.body.img) : subImg;
        },
        positionLeft: function() {
            return this.position.x - this.body.xres/2 - this.body.baseOffX - this.body.offX;
        },
        positionTop: function() {
            return this.position.y - this.body.yres + this.body.baseLength/2 - this.body.baseOffY - this.body.offY;
        },
        width: function() {
            return this.body.xres;
        },
        height: function() {
            return this.body.yres;
        },
        cropLeft: function() {
            return this.body.getAnimationFrameCrop(this.body.dir, this.body.stance, 0);
        },
        cropTop: function() {
            return 0;
        }
    },
    methods: {
        edit: function() {
            showEditorTrace(this.position);
        },
        track: function() {
            follower = this.position;
            setMode("position");
        },
        toggleHighlight: function(highlight) {
            if(follower) {
                return;
            }
            this.position.isHighlighted = highlight;
        }
    }
});

Vue.component("menu-layer", {
    props: ["level", "layer", "index"],
    template: "#menu-layer-template",
    computed: {
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
    },
    methods: {
        edit: function() {
            showEditorLayer(this.layer);
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

Vue.component("rendered-layer", {
    props: ["level", "layer", "index", "width", "height", "isActive"],
    template: "#rendered-layer-template",
    computed: {
        styleObject: function() {
            return {
                pointerEvents: this.isActive ? "initial" : "none"
            };
        },
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
		activeLayer: 0,
		traceOptions: traceEditorColors
	},
	methods: {
	    selectModeOption: function(mode) {
	        setMode(mode);
        },
		selectTraceOption: function(type) {
            typeSelected = type;
            setMode("trace");
        },
		createLayer: function() {
	        addNewLayer();
		}
	}
});