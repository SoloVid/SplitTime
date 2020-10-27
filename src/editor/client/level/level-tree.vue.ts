namespace splitTime.editor.level {
    interface VueLevelTree extends client.VueComponent {
        // props
        levelEditorShared: LevelEditorShared
        // computed
        level: Level
        // methods
        createGroup(): void
    }

    function level(this: VueLevelTree): Level {
        return this.levelEditorShared.level
    }

    function createGroup(this: VueLevelTree): void {
        let defaultHeight = DEFAULT_GROUP_HEIGHT
        if (this.level.groups.length > 0) {
            defaultHeight = this.level.groups[this.level.groups.length - 1].obj.defaultHeight
        }
        const group = {
            id: "Group " + this.level.groups.length,
            defaultZ: 0,
            defaultHeight: defaultHeight
        }
        this.level.groups.push(client.withMetadata("group", group))
        const wrapper = new GroupWrapper(group, this.level)
        this.levelEditorShared.propertiesPaneStuff = getGroupPropertiesStuff(wrapper)
    }

    Vue.component("level-tree", {
        props: {
            levelEditorShared: Object
        },
        data: function() {
            return {
            }
        },
        computed: {
            level
        },
        methods: {
            createGroup
        },
        template: `
<div class="level-tree">
    <label>
        Active Group:
        <select class="active-group block" v-model="levelEditorShared.activeGroup">
            <option
                v-for="(group, index) in levelEditorShared.level.groups"
                :value="index"
            >{{ group.obj.id || ("Group " + index) }}</option>
            <option value="-1">Homeless</option>
        </select>
    </label>
    <hr/>
    <menu-group
            v-for="(group, index) in levelEditorShared.level.groups"
            :key="index"
            :level-editor-shared="levelEditorShared"
            :level="level"
            :group="group"
            :index="index"
    ></menu-group>
    <menu-group
            :level-editor-shared="levelEditorShared"
            :level="level"
            :index="-1"
            class="catch-all-group"
    ></menu-group>
    <div class="option" @click.left="createGroup">Add Group</div>
</div>
        `
    })
}