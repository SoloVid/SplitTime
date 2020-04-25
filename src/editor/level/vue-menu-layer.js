Vue.component("menu-layer", {
    props: ["level", "layer", "index"],
    template: "#menu-layer-template",
    computed: {
        layerAboveZ: function() {
            var layerAbove = this.level.layers[this.index + 1];
            return layerAbove ? layerAbove.z : Number.MAX_VALUE;
        },
        layerHeight: function() {
            return this.layerAboveZ - this.layer.z;
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
        },
        allTracesDisplayed: function() {
            return this.traces.every(function(trace) {
                return trace.displayed;
            });
        },
        allPropsDisplayed: function() {
            return this.props.every(function(prop) {
                return prop.displayed;
            });
        },
        allPositionsDisplayed: function() {
            return this.positions.every(function(pos) {
                return pos.displayed;
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
        },
        toggleAllTracesDisplayed: function() {
            var displayed = this.allTracesDisplayed;
            this.traces.forEach(function(trace) {
                trace.displayed = !displayed;
            });
        },
        toggleAllPropsDisplayed: function() {
            var displayed = this.allPropsDisplayed;
            this.props.forEach(function(prop) {
                prop.displayed = !displayed;
            });
        },
        toggleAllPositionsDisplayed: function() {
            var displayed = this.allPositionsDisplayed;
            this.positions.forEach(function(pos) {
                pos.displayed = !displayed;
            });
        }
    }
});
