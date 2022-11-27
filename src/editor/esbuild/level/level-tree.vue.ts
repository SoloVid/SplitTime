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
            parent: "",
            defaultZ: 0,
            defaultHeight: defaultHeight
        }
        this.level.groups.push(client.withMetadata("group", group))
        const wrapper = new GroupWrapper(group, this.level)
        this.levelEditorShared.editProperties(getGroupPropertiesStuff(this.level, wrapper))
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
            <option :value="''">&lt;DEFAULT&gt;</option>
            <option
                v-for="group in levelEditorShared.level.groups"
                :value="group.obj.id"
            >{{ group.obj.id || "Untitled Group" }}</option>
        </select>
    </label>
    <hr/>
    <menu-group
            :level-editor-shared="levelEditorShared"
            :level="level"
    ></menu-group>
    <div class="option" @click.left="createGroup">Add Group</div>
</div>
        `
    })
}