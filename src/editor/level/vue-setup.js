var vueApp = new Vue({
    el: '#app',
    data: {
        info: {
            x: undefined,
            y: undefined,
            z: undefined
        },
        level: levelObject,
        activeLayer: 0,
        traceOptions: [
            {
                type: splitTime.Trace.Type.SOLID,
                color: "rgba(0, 0, 255, .7)",
                help: "Completely impenetrable areas bodies may not pass through (but may sit on top)"
            },
            {
                type: splitTime.Trace.Type.STAIRS,
                color: "rgba(0, 200, 0, .7)",
                help: "Solid trace slope up to the next layer"
            },
            {
                type: splitTime.Trace.Type.GROUND,
                color: TRACE_GROUND_COLOR,
                help: "Zero-height solid trace, perfect for bridges"
            },
            {
                type: splitTime.Trace.Type.EVENT,
                color: "rgba(255, 0, 0, .7)",
                help: "Indicates area of the level which will trigger a function call when a body moves into the area"
            },
            {
                type: splitTime.Trace.Type.PATH,
                color: "rgba(0, 0, 0, 1)",
                help: "Link positions together for walking purposes"
            },
            {
                type: splitTime.Trace.Type.POINTER,
                color: "rgba(100, 50, 100, .8)",
                help: "Link to another level. Traces from that level will affect this area, and a body fully moved into the pointer trace will be transported to that level."
            },
            {
                type: splitTime.Trace.Type.TRANSPORT,
                color: "rgba(200, 100, 10, .8)",
                help: "Link to another level regardless of what's on the other side. Note: You'll want to use opposite values for pairs of these traces, but be careful not to overlap the traces and leave enough room for the maximum expected base between."
            }
        ]
    },
    computed: {
        backgroundSrc: function() {
            return imgSrc(this.level.background);
        },
        containerWidth: function() {
            return this.level.width + 2*EDITOR_PADDING;
        },
        containerHeight: function() {
            var addedHeight = this.level.layers.length > 0 ? this.level.layers[this.level.layers.length - 1].z : 0;
            return this.level.height + 2*EDITOR_PADDING + addedHeight;
        },
        leftPadding: function() {
            return EDITOR_PADDING + this.level.backgroundOffsetX;
        },
        topPadding: function() {
            return EDITOR_PADDING + this.level.backgroundOffsetY;
        }
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
