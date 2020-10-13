namespace splitTime.editor.level {
    export interface VueRenderedLayer {
        level: any
        layer: any
        index: number
        width: number
        height: number
        isActive: boolean
        containerWidth: any
        containerHeight: any
        viewBox: any
        layerAboveZ: any
        layerHeight: any
        styleObject: any
        thingsStyleObject: any
        traces: any
        props: any
        positions: any
    }


    function containerWidth(this: VueRenderedLayer): any {
        return this.width + 2*EDITOR_PADDING;
    }
    function containerHeight(this: VueRenderedLayer): any {
        var addedHeight = this.level.layers.length > 0 ? this.level.layers[this.level.layers.length - 1].z : 0;
        return this.height + 2*EDITOR_PADDING + addedHeight;
    }
    function viewBox(this: VueRenderedLayer): any {
        return "" + -EDITOR_PADDING + " " + -EDITOR_PADDING + " " + this.containerWidth + " " + this.containerHeight;
    }
    function layerAboveZ(this: VueRenderedLayer): number {
        var layerAbove = this.level.layers[this.index + 1];
        return layerAbove ? layerAbove.z : Number.MAX_VALUE;
    }
    function layerHeight(this: VueRenderedLayer): number {
        return this.layerAboveZ - this.layer.z;
    }
    function styleObject(this: VueRenderedLayer): any {
        return {
            pointerEvents: this.isActive ? "initial" : "none"
        };
    }
    function thingsStyleObject(this: VueRenderedLayer): any {
        return {
            position: "relative",
            left: EDITOR_PADDING + "px",
            top: EDITOR_PADDING + "px"
        };
    }
    function traces(this: VueRenderedLayer): any {
        var that = this;
        return this.level.traces.filter(function(trace: any) {
            return trace.z >= that.layer.z && trace.z < that.layerAboveZ;
        });
    }
    function props(this: VueRenderedLayer): any {
        var that = this;
        return this.level.props.filter(function(prop: any) {
            return prop.z >= that.layer.z && prop.z < that.layerAboveZ;
        });
    }
    function positions(this: VueRenderedLayer): any {
        var that = this;
        return this.level.positions.filter(function(pos: any) {
            return pos.z >= that.layer.z && pos.z < that.layerAboveZ;
        });
    }


    Vue.component("rendered-layer", {
        props: {
            level: Object,
            layer: Object,
            index: Number,
            width: Number,
            height: Number,
            isActive: Boolean
        },
        template: `
    <div v-show="layer.displayed" v-bind:style="styleObject">
        <svg
                style="position:absolute"
                v-bind:width="containerWidth"
                v-bind:height="containerHeight"
                v-bind:viewBox="viewBox"
        >
            <rendered-trace v-for="(trace, traceIndex) in traces"
                            v-bind:trace="trace"
                            v-bind:index="traceIndex"
            ></rendered-trace>
        </svg>
        <div v-bind:style="thingsStyleObject">
            <rendered-prop v-for="(prop, propIndex) in props"
                        v-bind:prop="prop"
            ></rendered-prop>
            <rendered-position v-for="(position, posIndex) in positions"
                            v-bind:position="position"
            ></rendered-position>
        </div>
    </div>
        `,
        computed: {
            containerWidth,
            containerHeight,
            viewBox,
            layerAboveZ,
            layerHeight,
            styleObject,
            thingsStyleObject,
            traces,
            props,
            positions
        }
    });
}