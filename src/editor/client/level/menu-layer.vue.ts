namespace splitTime.editor.level {
    interface VueMenuLayer {
        // props
        levelEditorShared: LevelEditorShared
        level: Level
        layer: Layer
        index: number
        // data
        collapsed: boolean
        // computed
        layerAboveZ: number
        layerHeight: number
        traces: Trace[]
        props: Prop[]
        positions: Position[]
        allTracesDisplayed: boolean
        allPropsDisplayed: boolean
        allPositionsDisplayed: boolean
        // methods
        edit(): void
        editTrace(trace: Trace): void
        editProp(prop: Prop): void
        editPosition(position: Position): void
        toggleAllTracesDisplayed(): void
        toggleAllPropsDisplayed(): void
        toggleAllPositionsDisplayed(): void
    }

    function data(this: VueMenuLayer): Partial<VueMenuLayer> {
        return {
            collapsed: true
        }
    }

    function layerAboveZ(this: VueMenuLayer): number {
        var layerAbove = this.level.layers[this.index + 1]
        return layerAbove ? layerAbove.obj.z : Number.MAX_VALUE
    }
    function layerHeight(this: VueMenuLayer): number {
        return this.layerAboveZ - this.layer.obj.z
    }
    function traces(this: VueMenuLayer): Trace[] {
        return this.level.traces.filter(trace => {
            return trace.obj.z >= this.layer.obj.z && trace.obj.z < this.layerAboveZ
        })
    }
    function props(this: VueMenuLayer): Prop[] {
        return this.level.props.filter(prop => {
            return prop.obj.z >= this.layer.obj.z && prop.obj.z < this.layerAboveZ
        })
    }
    function positions(this: VueMenuLayer): Position[] {
        return this.level.positions.filter(pos => {
            return pos.obj.z >= this.layer.obj.z && pos.obj.z < this.layerAboveZ
        })
    }
    function allTracesDisplayed(this: VueMenuLayer): boolean {
        return this.traces.every(trace => {
            return trace.metadata.displayed
        })
    }
    function allPropsDisplayed(this: VueMenuLayer): boolean {
        return this.props.every(prop => {
            return prop.metadata.displayed
        })
    }
    function allPositionsDisplayed(this: VueMenuLayer): boolean {
        return this.positions.every(pos => {
            return pos.metadata.displayed
        })
    }

    function edit(this: VueMenuLayer): void {
        this.levelEditorShared.propertiesPaneStuff = getLayerPropertiesStuff(this.layer)
    }
    function editTrace(this: VueMenuLayer, trace: Trace): void {
        this.levelEditorShared.propertiesPaneStuff = getTracePropertiesStuff(trace.obj)
    }
    function editProp(this: VueMenuLayer, prop: Prop): void {
        this.levelEditorShared.propertiesPaneStuff = getPropPropertiesStuff(prop.obj)
    }
    function editPosition(this: VueMenuLayer, position: Position): void {
        this.levelEditorShared.propertiesPaneStuff = getPositionPropertiesStuff(position.obj)
    }
    function toggleAllTracesDisplayed(this: VueMenuLayer): void {
        var displayed = this.allTracesDisplayed
        this.traces.forEach(trace => {
            trace.metadata.displayed = !displayed
        })
    }
    function toggleAllPropsDisplayed(this: VueMenuLayer): void {
        var displayed = this.allPropsDisplayed
        this.props.forEach(prop => {
            prop.metadata.displayed = !displayed
        })
    }
    function toggleAllPositionsDisplayed(this: VueMenuLayer): void {
        var displayed = this.allPositionsDisplayed
        this.positions.forEach(pos => {
            pos.metadata.displayed = !displayed
        })
    }

    Vue.component("menu-layer", {
        props: {
            levelEditorShared: Object,
            level: Object,
            layer: Object,
            index: Number
        },
        data,
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
        },
        template: `
<div>
    <span @click="collapsed = !collapsed" @mousedown.prevent class="pointer">
        <i v-if="collapsed" class="fas fa-chevron-right"></i>
        <i v-if="!collapsed" class="fas fa-chevron-down"></i>
    </span>
    <input type="checkbox" v-model="layer.metadata.displayed"/>
    <strong @click="edit" class="pointer">
        <span v-show="!layer.obj.id">Layer {{ index }}</span>
        <span v-show="layer.obj.id">{{layer.obj.id}}</span>
    </strong>
    <div v-show="!collapsed" class="indent">
        <div v-show="traces.length > 0">
            <div>
                <input type="checkbox"
                    :checked="allTracesDisplayed"
                    @click.left="toggleAllTracesDisplayed"
                />
                Traces
            </div>
            <div class="indent">
                <div v-for="(trace, traceIndex) in traces"
                    @mouseenter="trace.metadata.highlighted = true"
                    @mouseleave="trace.metadata.highlighted = false"
                >
                    <input type="checkbox" v-model="trace.metadata.displayed"/>
                    <span @click.left="editTrace(trace)" class="pointer">
                        <span v-show="!trace.obj.id">Trace {{ traceIndex }}</span>
                        <span v-show="trace.obj.id">{{trace.obj.id}}</span>
                    </span>
                </div>
            </div>
        </div>
        <div v-show="props.length > 0">
            <div>
                <input type="checkbox"
                    :checked="allPropsDisplayed"
                    @click.left="toggleAllPropsDisplayed"
                />
                Props
            </div>
            <div class="indent">
                <div v-for="(prop, index) in props"
                    @mouseenter="prop.metadata.highlighted = true"
                    @mouseleave="prop.metadata.highlighted = false"
                >
                    <input type="checkbox" v-model="prop.metadata.displayed"/>
                    <span @click.left="editProp(prop)" class="pointer">
                        <span v-show="!prop.obj.id">Prop {{ index }}</span>
                        <span v-show="prop.obj.id">{{prop.obj.id}}</span>
                    </span>
                </div>
            </div>
        </div>
        <div v-show="positions.length > 0">
            <div>
                <input type="checkbox"
                    :checked="allPositionsDisplayed"
                    @click.left="toggleAllPositionsDisplayed"
                />
                Positions
            </div>
            <div class="indent">
                <div v-for="(position, index) in positions"
                    @mouseenter="position.metadata.highlighted = true"
                    @mouseleave="position.metadata.highlighted = false"
                    style="list-style-type: disc"
                >
                    <input type="checkbox" v-model="position.metadata.displayed"/>
                    <span @click.left="editPosition(position)" class="pointer">
                        <span v-show="!position.obj.id">Position {{ index }}</span>
                        <span v-show="position.obj.id">{{position.obj.id}}</span>
                    </span>
                </div>
            </div>
        </div>
    </div>
</div>
        `
    })
}