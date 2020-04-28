Vue.component("rendered-layer", {
    props: ["level", "layer", "index", "width", "height", "isActive"],
    template: "#rendered-layer-template",
    computed: {
        containerWidth: function() {
            return this.width + 2*EDITOR_PADDING;
        },
        containerHeight: function() {
            var addedHeight = this.level.layers.length > 0 ? this.level.layers[this.level.layers.length - 1].z : 0;
            return this.height + 2*EDITOR_PADDING + addedHeight;
        },
        viewBox: function() {
            return "" + -EDITOR_PADDING + " " + -EDITOR_PADDING + " " + this.containerWidth + " " + this.containerHeight;
        },
        layerAboveZ: function() {
            var layerAbove = this.level.layers[this.index + 1];
            return layerAbove ? layerAbove.z : Number.MAX_VALUE;
        },
        layerHeight: function() {
            return this.layerAboveZ - this.layer.z;
        },
        styleObject: function() {
            return {
                pointerEvents: this.isActive ? "initial" : "none"
            };
        },
        thingsStyleObject: function() {
            return {
                position: "relative",
                left: EDITOR_PADDING + "px",
                top: EDITOR_PADDING + "px"
            };
        },
        traces: function() {
            var that = this;
            return this.level.traces.filter(function(trace) {
                return trace.z >= that.layer.z && trace.z < that.layerAboveZ;
            });
        },
        props: function() {
            var that = this;
            return this.level.props.filter(function(prop) {
                return prop.z >= that.layer.z && prop.z < that.layerAboveZ;
            });
        },
        positions: function() {
            var that = this;
            return this.level.positions.filter(function(pos) {
                return pos.z >= that.layer.z && pos.z < that.layerAboveZ;
            });
        }
    }
});
