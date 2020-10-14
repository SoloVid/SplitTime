namespace splitTime.editor.level {
    export interface VueRenderedLayer {
        level: Level
        layer: Layer
        index: number
        width: number
        height: number
        isActive: boolean
        containerWidth: number
        containerHeight: number
        viewBox: string
        layerAboveZ: number
        layerHeight: number
        styleObject: object
        thingsStyleObject: object
        traces: Trace[]
        props: Prop[]
        positions: Position[]
    }


    function containerWidth(this: VueRenderedLayer): number {
        return this.width + 2*EDITOR_PADDING;
    }
    function containerHeight(this: VueRenderedLayer): number {
        var addedHeight = this.level.layers.length > 0 ? this.level.layers[this.level.layers.length - 1].obj.z : 0;
        return this.height + 2*EDITOR_PADDING + addedHeight;
    }
    function viewBox(this: VueRenderedLayer): string {
        return "" + -EDITOR_PADDING + " " + -EDITOR_PADDING + " " + this.containerWidth + " " + this.containerHeight;
    }
    function layerAboveZ(this: VueRenderedLayer): number {
        var layerAbove = this.level.layers[this.index + 1];
        return layerAbove ? layerAbove.obj.z : Number.MAX_VALUE;
    }
    function layerHeight(this: VueRenderedLayer): number {
        return this.layerAboveZ - this.layer.obj.z;
    }
    function styleObject(this: VueRenderedLayer): object {
        return {
            pointerEvents: this.isActive ? "initial" : "none"
        };
    }
    function thingsStyleObject(this: VueRenderedLayer): object {
        return {
            position: "relative",
            left: EDITOR_PADDING + "px",
            top: EDITOR_PADDING + "px"
        };
    }
    function traces(this: VueRenderedLayer): Trace[] {
        var that = this;
        return this.level.traces.filter(trace => {
            return trace.obj.z >= that.layer.obj.z && trace.obj.z < that.layerAboveZ;
        });
    }
    function props(this: VueRenderedLayer): Prop[] {
        var that = this;
        return this.level.props.filter(prop => {
            return prop.obj.z >= that.layer.obj.z && prop.obj.z < that.layerAboveZ;
        });
    }
    function positions(this: VueRenderedLayer): Position[] {
        var that = this;
        return this.level.positions.filter(pos => {
            return pos.obj.z >= that.layer.obj.z && pos.obj.z < that.layerAboveZ;
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
<div v-show="layer.metadata.displayed" v-bind:style="styleObject">
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