namespace splitTime.editor.level {
    export interface VueLevelEditor extends client.VueComponent {
        // props
        editorInputs: client.UserInputs
        editorGlobalStuff: client.GlobalEditorShared
        supervisorControl: client.EditorSupervisorControl
        level: Level
        // data
        sharedStuff: LevelEditorShared
        // computed
        editorWidth: number
        editorHeight: number
        // methods
        onSupervisorControlChange(): void
        trackLeftMenuResize(): void
        trackRightMenuResize(): void
    }

    function editorWidth(this: VueLevelEditor): number {
        if (!this.$el) {
            return 0
        }
        return this.$el.clientWidth
    }
    function editorHeight(this: VueLevelEditor): number {
        if (!this.$el) {
            return 0
        }
        return this.$el.clientHeight
    }

    function onSupervisorControlChange(this: VueLevelEditor): void {
        this.supervisorControl.triggerSettings = () => {
            this.sharedStuff.propertiesPaneStuff = getLevelPropertiesStuff(this.level)
        }
    }

    const MIN_MENU_WIDTH = 32
    function trackLeftMenuResize(this: VueLevelEditor): void {
        this.sharedStuff.follow({
            shift: (dx, dy) => {
                // const width = this.$refs.leftMenu.clientWidth
                const width = +this.$refs.leftMenu.style.width.replace(/[^0-9-]/g, "")
                const newWidth = Math.max(width + dx, MIN_MENU_WIDTH)
                this.$refs.leftMenu.style.width = newWidth + "px"
            }
        })
    }

    function trackRightMenuResize(this: VueLevelEditor): void {
        this.sharedStuff.follow({
            shift: (dx, dy) => {
                // const width = this.$refs.rightMenu.clientWidth
                const width = +this.$refs.rightMenu.style.width.replace(/[^0-9-]/g, "")
                const newWidth = Math.max(width - dx, MIN_MENU_WIDTH)
                this.$refs.rightMenu.style.width = newWidth + "px"
            }
        })
    }

    Vue.component("level-editor", {
        props: {
            editorInputs: Object,
            editorGlobalStuff: Object,
            supervisorControl: Object,
            level: Object
        },
        data: function() {
            (this as VueLevelEditor).onSupervisorControlChange()
            return {
                sharedStuff: new SharedStuff(this as VueLevelEditor)
            }
        },
        computed: {
            editorWidth,
            editorHeight
        },
        methods: {
            onSupervisorControlChange,
            trackLeftMenuResize,
            trackRightMenuResize
        },
        watch: {
            supervisorControl: onSupervisorControlChange
        },
        template: `
<div class="level-editor" style="display: flex; flex-flow: column;">
    <div class="content" style="flex-grow: 1; overflow: hidden; display: flex;">
        <div ref="leftMenu" class="menu" style="flex-shrink: 0; width: 128px;">
            <level-editor-tools
                :editor-global-stuff="editorGlobalStuff"
                :level-editor-shared="sharedStuff"
            ></level-editor-tools>
            <hr/>
            <object-properties
                :editor-global-stuff="editorGlobalStuff"
                :title="sharedStuff.propertiesPaneStuff.title"
                :thing="sharedStuff.propertiesPaneStuff.thing"
                :fields="sharedStuff.propertiesPaneStuff.fields"
            ></object-properties>
        </div>
        <div
            class="vertical-resize-bar"
            @mousedown.left.prevent="trackLeftMenuResize"
            style="flex-shrink: 0; right: 0;"
        ></div>

        <div class="layers-container" ref="layersContainer" style="flex-grow: 1; overflow: auto;">
            <level-graphical-editor
                :editor-inputs="editorInputs"
                :level-editor-shared="sharedStuff"
            ></level-graphical-editor>
        </div>

        <div
            class="vertical-resize-bar"
            @mousedown.left.prevent="trackRightMenuResize"
            style="flex-shrink: 0; left: 0;"
        ></div>
        <div ref="rightMenu" class="menu" style="flex-shrink: 0; width: 128px; position: relative;">
            <level-tree
                :level-editor-shared="sharedStuff"
            ></level-tree>
        </div>
    </div>

    <div id="info-pane" style="padding: 2px;">
        <span v-for="(value, name) in sharedStuff.info" :key="name">
            {{ name }}: {{ value }}
        </span>
    </div>
</div>
        `
    })
}