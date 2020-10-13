namespace splitTime.editor.level {
    export interface VueMenuLayer {
        level: any
        layer: any
        index: number
        layerAboveZ: number
        layerHeight: number
        traces: any[]
        props: any[]
        positions: any[]
        allTracesDisplayed: boolean
        allPropsDisplayed: boolean
        allPositionsDisplayed: boolean
        edit(): any
        editTrace(trace: any): any
        editProp(prop: any): any
        editPosition(position: any): any
        toggleAllTracesDisplayed(): any
        toggleAllPropsDisplayed(): any
        toggleAllPositionsDisplayed(): any
    }

    function layerAboveZ(this: VueMenuLayer): any {
        var layerAbove = this.level.layers[this.index + 1];
        return layerAbove ? layerAbove.z : Number.MAX_VALUE;
    }
    function layerHeight(this: VueMenuLayer): any {
        return this.layerAboveZ - this.layer.z;
    }
    function traces(this: VueMenuLayer): any {
        var that = this;
        return this.level.traces.filter(function(trace: any) {
            return trace.z >= that.layer.z && trace.z < that.layerAboveZ;
        });
    }
    function props(this: VueMenuLayer): any {
        var that = this;
        return this.level.props.filter(function(prop: any) {
            return prop.z >= that.layer.z && prop.z < that.layerAboveZ;
        });
    }
    function positions(this: VueMenuLayer): any {
        var that = this;
        return this.level.positions.filter(function(pos: any) {
            return pos.z >= that.layer.z && pos.z < that.layerAboveZ;
        });
    }
    function allTracesDisplayed(this: VueMenuLayer): any {
        return this.traces.every(function(trace) {
            return trace.displayed;
        });
    }
    function allPropsDisplayed(this: VueMenuLayer): any {
        return this.props.every(function(prop) {
            return prop.displayed;
        });
    }
    function allPositionsDisplayed(this: VueMenuLayer): any {
        return this.positions.every(function(pos) {
            return pos.displayed;
        });
    }

    function edit(this: VueMenuLayer): any {
        showEditorLayer(this.layer);
    }
    function editTrace(this: VueMenuLayer, trace: any): any {
        showEditorTrace(trace);
    }
    function editProp(this: VueMenuLayer, prop: any): any {
        showEditorProp(prop);
    }
    function editPosition(this: VueMenuLayer, position: any): any {
        showEditorPosition(position);
    }
    function toggleAllTracesDisplayed(this: VueMenuLayer): any {
        var displayed = this.allTracesDisplayed;
        this.traces.forEach(function(trace) {
            trace.displayed = !displayed;
        });
    }
    function toggleAllPropsDisplayed(this: VueMenuLayer): any {
        var displayed = this.allPropsDisplayed;
        this.props.forEach(function(prop) {
            prop.displayed = !displayed;
        });
    }
    function toggleAllPositionsDisplayed(this: VueMenuLayer): any {
        var displayed = this.allPositionsDisplayed;
        this.positions.forEach(function(pos) {
            pos.displayed = !displayed;
        });
    }

Vue.component("menu-layer", {
    props: {
        level: Object,
        layer: Object,
        index: Number
    },
    template: `
<div>
    <input type="checkbox" v-model="layer.displayed"/>
    <strong v-on:click="edit" class="pointer">
        <span v-show="!layer.id">Layer {{ index }}</span>
        <span v-show="layer.id">{{layer.id}}</span>
    </strong>
    <div class="indent">
        <div v-show="traces.length > 0">
            <div>
                <input type="checkbox"
                    v-bind:checked="allTracesDisplayed"
                    v-on:click.left="toggleAllTracesDisplayed"
                />
                Traces
            </div>
            <div class="indent">
                <div v-for="(trace, traceIndex) in traces"
                    v-on:mouseenter="trace.isHighlighted = true"
                    v-on:mouseleave="trace.isHighlighted = false"
                >
                    <input type="checkbox" v-model="trace.displayed"/>
                    <span v-on:click.left="editTrace(trace)" class="pointer">
                        <span v-show="!trace.id">Trace {{ traceIndex }}</span>
                        <span v-show="trace.id">{{trace.id}}</span>
                    </span>
                </div>
            </div>
        </div>
        <div v-show="props.length > 0">
            <div>
                <input type="checkbox"
                    v-bind:checked="allPropsDisplayed"
                    v-on:click.left="toggleAllPropsDisplayed"
                />
                Props
            </div>
            <div class="indent">
                <div v-for="(prop, index) in props"
                    v-on:mouseenter="prop.isHighlighted = true"
                    v-on:mouseleave="prop.isHighlighted = false"
                >
                    <input type="checkbox" v-model="prop.displayed"/>
                    <span v-on:click.left="editProp(prop)" class="pointer">
                        <span v-show="!prop.id">Prop {{ index }}</span>
                        <span v-show="prop.id">{{prop.id}}</span>
                    </span>
                </div>
            </div>
        </div>
        <div v-show="positions.length > 0">
            <div>
                <input type="checkbox"
                    v-bind:checked="allPositionsDisplayed"
                    v-on:click.left="toggleAllPositionsDisplayed"
                />
                Positions
            </div>
            <div class="indent">
                <div v-for="(position, index) in positions"
                    v-on:mouseenter="position.isHighlighted = true"
                    v-on:mouseleave="position.isHighlighted = false"
                    style="list-style-type: disc"
                >
                    <input type="checkbox" v-model="position.displayed"/>
                    <span v-on:click.left="editPosition(position)" class="pointer">
                        <span v-show="!position.id">Position {{ index }}</span>
                        <span v-show="position.id">{{position.id}}</span>
                    </span>
                </div>
            </div>
        </div>
    </div>
</div>
    `,
    computed: {
        layerAboveZ,
        layerHeight,
        traces,
        props,
        positions,
        allTracesDisplayed,
        allPropsDisplayed,
        allPositionsDisplayed
    },
    methods: {
        edit,
        editTrace,
        editProp,
        editPosition,
        toggleAllTracesDisplayed,
        toggleAllPropsDisplayed,
        toggleAllPositionsDisplayed
    }
});
}