namespace splitTime.editor.level {
    interface VueMenuGroup {
        // props
        levelEditorShared: LevelEditorShared
        level: Level
        group: Group | undefined
        index: number
        // data
        collapsed: boolean
        // computed
        traces: Trace[]
        props: Prop[]
        positions: Position[]
        allDisplayed: boolean
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

    function data(this: VueMenuGroup): Partial<VueMenuGroup> {
        return {
            collapsed: true
        }
    }

    function traces(this: VueMenuGroup): Trace[] {
        return this.level.traces.filter(trace => inGroup(this.level, this.index, trace.obj))
    }
    function props(this: VueMenuGroup): Prop[] {
        return this.level.props.filter(prop => inGroup(this.level, this.index, prop.obj))
    }
    function positions(this: VueMenuGroup): Position[] {
        return this.level.positions.filter(pos => inGroup(this.level, this.index, pos.obj))
    }
    function allDisplayed(this: VueMenuGroup): boolean {
        return this.allTracesDisplayed && this.allPropsDisplayed && this.allPositionsDisplayed
    }
    function allTracesDisplayed(this: VueMenuGroup): boolean {
        return this.traces.every(trace => {
            return trace.metadata.displayed
        })
    }
    function allPropsDisplayed(this: VueMenuGroup): boolean {
        return this.props.every(prop => {
            return prop.metadata.displayed
        })
    }
    function allPositionsDisplayed(this: VueMenuGroup): boolean {
        return this.positions.every(pos => {
            return pos.metadata.displayed
        })
    }

    function edit(this: VueMenuGroup): void {
        if (!this.group) {
            log.debug("Group can't be edited because it is default")
            return
        }
        const wrapper = new GroupWrapper(this.group.obj, this.level)
        this.levelEditorShared.propertiesPaneStuff = getGroupPropertiesStuff(wrapper)
    }
    function editTrace(this: VueMenuGroup, trace: Trace): void {
        this.levelEditorShared.propertiesPaneStuff = getTracePropertiesStuff(trace.obj)
    }
    function editProp(this: VueMenuGroup, prop: Prop): void {
        this.levelEditorShared.propertiesPaneStuff = getPropPropertiesStuff(prop.obj)
    }
    function editPosition(this: VueMenuGroup, position: Position): void {
        this.levelEditorShared.propertiesPaneStuff = getPositionPropertiesStuff(position.obj)
    }
    function toggleAllDisplayed(this: VueMenuGroup): void {
        const displayed = this.allDisplayed
        this.traces.forEach(trace => {
            trace.metadata.displayed = !displayed
        })
        this.props.forEach(prop => {
            prop.metadata.displayed = !displayed
        })
        this.positions.forEach(pos => {
            pos.metadata.displayed = !displayed
        })
    }
    function toggleAllTracesDisplayed(this: VueMenuGroup): void {
        var displayed = this.allTracesDisplayed
        this.traces.forEach(trace => {
            trace.metadata.displayed = !displayed
        })
    }
    function toggleAllPropsDisplayed(this: VueMenuGroup): void {
        var displayed = this.allPropsDisplayed
        this.props.forEach(prop => {
            prop.metadata.displayed = !displayed
        })
    }
    function toggleAllPositionsDisplayed(this: VueMenuGroup): void {
        var displayed = this.allPositionsDisplayed
        this.positions.forEach(pos => {
            pos.metadata.displayed = !displayed
        })
    }

    Vue.component("menu-group", {
        props: {
            levelEditorShared: Object,
            level: Object,
            group: Object,
            index: Number
        },
        data,
        computed: {
            traces,
            props,
            positions,
            allDisplayed,
            allTracesDisplayed,
            allPropsDisplayed,
            allPositionsDisplayed
        },
        methods: {
            edit,
            editTrace,
            editProp,
            editPosition,
            toggleAllDisplayed,
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
    <input type="checkbox"
        :checked="allDisplayed"
        @click.left="toggleAllDisplayed"
    />
    <template v-if="!!group">
        <strong @click="edit" class="pointer">
            <span v-show="!group.obj.id">Group {{ index }}</span>
            <span v-show="group.obj.id">{{group.obj.id}}</span>
        </strong>
    </template>
    <template v-if="!group">
        <strong><em>Homeless</em></strong>
    </template>
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