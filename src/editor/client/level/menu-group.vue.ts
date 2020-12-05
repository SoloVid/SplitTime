namespace splitTime.editor.level {
    interface VueMenuGroup {
        // props
        levelEditorShared: LevelEditorShared
        level: Level
        group: Group | undefined
        // data
        collapsed: boolean
        displayHelper: GroupDisplayHelper
        // computed
        groupId: string
        subGroups: Group[]
        traces: Trace[]
        props: Prop[]
        positions: Position[]
        allDisplayed: boolean
        allSubGroupsDisplayed: boolean
        allTracesDisplayed: boolean
        allPropsDisplayed: boolean
        allPositionsDisplayed: boolean
        // methods
        edit(): void
        editTrace(trace: Trace): void
        editProp(prop: Prop): void
        editPosition(position: Position): void
        toggleAllDisplayed(): void
        toggleAllSubGroupsDisplayed(): void
        toggleAllTracesDisplayed(): void
        toggleAllPropsDisplayed(): void
        toggleAllPositionsDisplayed(): void
    }

    function data(this: VueMenuGroup): Partial<VueMenuGroup> {
        return {
            collapsed: true,
            displayHelper: new GroupDisplayHelper(
                () => this.level,
                () => this.group
            )
        }
    }

    function groupId(this: VueMenuGroup): string {
        return this.group?.obj.id || ""
    }

    function subGroups(this: VueMenuGroup): Group[] {
        return this.displayHelper.subGroups
    }
    function traces(this: VueMenuGroup): Trace[] {
        return this.displayHelper.traces
    }
    function props(this: VueMenuGroup): Prop[] {
        return this.displayHelper.props
    }
    function positions(this: VueMenuGroup): Position[] {
        return this.displayHelper.positions
    }
    function allDisplayed(this: VueMenuGroup): boolean {
        return this.displayHelper.allDisplayed
    }
    function allSubGroupsDisplayed(this: VueMenuGroup): boolean {
        return this.displayHelper.allSubGroupsDisplayed
    }
    function allTracesDisplayed(this: VueMenuGroup): boolean {
        return this.displayHelper.allTracesDisplayed
    }
    function allPropsDisplayed(this: VueMenuGroup): boolean {
        return this.displayHelper.allPropsDisplayed
    }
    function allPositionsDisplayed(this: VueMenuGroup): boolean {
        return this.displayHelper.allPositionsDisplayed
    }

    function edit(this: VueMenuGroup): void {
        this.levelEditorShared.activeGroup = this.groupId
        if (!this.group) {
            log.debug("Group can't be edited because it is default")
            return
        }
        const wrapper = new GroupWrapper(this.group.obj, this.level)
        this.levelEditorShared.editProperties(getGroupPropertiesStuff(this.level, wrapper))
    }
    function editTrace(this: VueMenuGroup, trace: Trace): void {
        this.levelEditorShared.editProperties(getTracePropertiesStuff(this.level, trace.obj))
    }
    function editProp(this: VueMenuGroup, prop: Prop): void {
        this.levelEditorShared.editProperties(getPropPropertiesStuff(this.level, prop.obj))
    }
    function editPosition(this: VueMenuGroup, position: Position): void {
        this.levelEditorShared.editProperties(getPositionPropertiesStuff(this.level, position.obj))
    }
    function toggleAllDisplayed(this: VueMenuGroup): void {
        this.displayHelper.toggleAllDisplayed()
    }
    function toggleAllSubGroupsDisplayed(this: VueMenuGroup): void {
        this.displayHelper.toggleAllSubGroupsDisplayed()
    }
    function toggleAllTracesDisplayed(this: VueMenuGroup): void {
        this.displayHelper.toggleAllTracesDisplayed()
    }
    function toggleAllPropsDisplayed(this: VueMenuGroup): void {
        this.displayHelper.toggleAllPropsDisplayed()
    }
    function toggleAllPositionsDisplayed(this: VueMenuGroup): void {
        this.displayHelper.toggleAllPositionsDisplayed()
    }

    // defer necessary for icons
    defer(() => {
        Vue.component("menu-group", {
            props: {
                levelEditorShared: Object,
                level: Object,
                group: Object
            },
            data,
            computed: {
                groupId,
                subGroups,
                traces,
                props,
                positions,
                allDisplayed,
                allSubGroupsDisplayed,
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
                toggleAllSubGroupsDisplayed,
                toggleAllTracesDisplayed,
                toggleAllPropsDisplayed,
                toggleAllPositionsDisplayed
            },
            template: `
<div class="menu-group">
    <template v-if="!!group">
        <span @click="collapsed = !collapsed" @mousedown.prevent class="pointer">
            <i v-if="collapsed" class="fas fa-caret-right"></i>
            <i v-if="!collapsed" class="fas fa-caret-down"></i>
        </span>
        <input type="checkbox"
            :checked="allDisplayed"
            @click.left="toggleAllDisplayed"
        />
        <span :class="{ highlighted: levelEditorShared.activeGroup === groupId }">
            <template v-if="!!group">
                <strong @click="edit" class="pointer">
                    <span v-show="!group.obj.id">Untitled Group</span>
                    <span v-show="group.obj.id">{{group.obj.id}}</span>
                </strong>
            </template>
            <template v-if="!group">
                <strong><em>Homeless</em></strong>
            </template>
        </span>
    </template>
    <div v-show="!collapsed || !group" :class="{ 'menu-group-body': true, indent: !!group }">
        <div v-show="subGroups.length === 0 && traces.length === 0 && props.length === 0 && positions.length === 0" class="indent">
            <em>Empty</em>
        </div>
        <div class="sub-groups" v-show="subGroups.length > 0">
            <!--
            <div v-show="traces.length > 0 || props.length > 0 || positions.length > 0">
                <input type="checkbox"
                    :checked="allSubGroupsDisplayed"
                    @click.left="toggleAllSubGroupsDisplayed"
                />
                Sub-Groups
            </div>
            -->
            <div class="indent">
                <div v-for="subGroup in subGroups">
                    <menu-group
                        :levelEditorShared="levelEditorShared"
                        :level="level"
                        :group="subGroup"
                    ></menu-group>
                </div>
            </div>
        </div>
        <div class="traces" v-show="traces.length > 0">
            <!--
            <div v-show="subGroups.length > 0 || props.length > 0 || positions.length > 0">
                <input type="checkbox"
                    :checked="allTracesDisplayed"
                    @click.left="toggleAllTracesDisplayed"
                />
                Traces
            </div>
            -->
            <div class="indent">
                <div v-for="(trace, traceIndex) in traces"
                    @mouseenter="trace.metadata.highlighted = true"
                    @mouseleave="trace.metadata.highlighted = false"
                >
                    <i class="fas fa-${TRACE_ICON}"></i>
                    <input type="checkbox" v-model="trace.metadata.displayed"/>
                    <span @click.left="editTrace(trace)" class="pointer">
                        <span v-show="!trace.obj.id">Trace {{ traceIndex }}</span>
                        <span v-show="trace.obj.id">{{trace.obj.id}}</span>
                    </span>
                </div>
            </div>
        </div>
        <div class="props" v-show="props.length > 0">
            <!--
            <div v-show="subGroups.length > 0 || traces.length > 0 || positions.length > 0">
                <input type="checkbox"
                    :checked="allPropsDisplayed"
                    @click.left="toggleAllPropsDisplayed"
                />
                Props
            </div>
            -->
            <div class="indent">
                <div v-for="(prop, index) in props"
                    @mouseenter="prop.metadata.highlighted = true"
                    @mouseleave="prop.metadata.highlighted = false"
                >
                    <i class="fas fa-${PROP_ICON}"></i>
                    <input type="checkbox" v-model="prop.metadata.displayed"/>
                    <span @click.left="editProp(prop)" class="pointer">
                        <span v-show="!prop.obj.id">Prop {{ index }}</span>
                        <span v-show="prop.obj.id">{{prop.obj.id}}</span>
                    </span>
                </div>
            </div>
        </div>
        <div class="positions" v-show="positions.length > 0">
            <!--
            <div v-show="subGroups.length > 0 || traces.length > 0 || props.length > 0">
                <input type="checkbox"
                    :checked="allPositionsDisplayed"
                    @click.left="toggleAllPositionsDisplayed"
                />
                Positions
            </div>
            -->
            <div class="indent">
                <div v-for="(position, index) in positions"
                    @mouseenter="position.metadata.highlighted = true"
                    @mouseleave="position.metadata.highlighted = false"
                    style="list-style-type: disc"
                >
                    <i class="fas fa-${POSITION_ICON}"></i>
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
    })
}