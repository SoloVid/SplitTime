namespace splitTime.editor.level {
    class SharedStuff implements LevelEditorShared {
        activeLayer: int = 0
        mode: Mode = "position"
        typeSelected: string = trace.Type.SOLID
        pathInProgress: splitTime.level.file_data.Trace | null = null
        readonly info = {}
        propertiesPaneStuff: client.ObjectProperties

        constructor(
            private editor: VueLevelEditor
        ) {
            this.propertiesPaneStuff = getLevelPropertiesStuff(this.editor.level)
        }

        get gridCell(): Vector2D {
            return this.editor.editorGlobalStuff.gridCell
        }

        get gridEnabled(): boolean {
            return this.editor.editorGlobalStuff.gridEnabled
        }

        get level(): Level {
            return this.editor.level
        }

        get server(): client.ServerLiaison {
            return this.editor.editorGlobalStuff.server
        }

        get time(): game_seconds {
            return this.editor.editorGlobalStuff.time
        }

        setMode(mode: Mode, subType?: string): void {
            this.mode = mode
            if (subType) {
                this.typeSelected = subType
            }
        }

        shouldDragBePrevented(): boolean {
            return this.editor.inputs.mouse.isDown || this.pathInProgress !== null
        }

        follow(follower: client.Followable): void {
            this.editor.editorGlobalStuff.setFollowers([follower])
        }
    }

    interface VueLevelEditor extends client.VueComponent {
        // props
        editorInputs: client.UserInputs
        editorGlobalStuff: client.GlobalEditorShared
        supervisorControl: client.EditorSupervisorControl
        level: Level
        // data
        sharedStuff: LevelEditorShared
        // computed
        inputs: client.UserInputs
        position: Coordinates2D
        editorWidth: number
        editorHeight: number
        // methods
        onSupervisorControlChange(): void
    }

    function inputs(this: VueLevelEditor): client.UserInputs {
        const mouse = {
            x: this.editorInputs.mouse.x - this.position.x - EDITOR_PADDING,
            y: this.editorInputs.mouse.y - this.position.y - EDITOR_PADDING,
            // FTODO: only is down when inside level editor
            isDown: this.editorInputs.mouse.isDown
        }
        return {
            mouse,
            ctrlDown: this.editorInputs.ctrlDown
        }
    }

    function position(this: VueLevelEditor): Coordinates2D {
        if (!this.$el) {
            return {
                x: 0,
                y: 0
            }
        }
        const $pos = $(this.$el).position()
        return {
            x: $pos.left,
            y: $pos.top
        }
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
            inputs,
            position,
            editorWidth,
            editorHeight
        },
        methods: {
            onSupervisorControlChange
        },
        watch: {
            supervisorControl: onSupervisorControlChange
        },
        template: `
<div class="level-editor" style="display: flex; flex-flow: column;">
    <div class="content" style="flex-grow: 1; overflow: hidden; display: flex;">
        <div class="menu" style="flex-shrink: 0;">
            <level-editor-tools
                :level-editor-shared="sharedStuff"
            ></level-editor-tools>
            <object-properties
                :editor-global-stuff="editorGlobalStuff"
                :title="sharedStuff.propertiesPaneStuff.title"
                :thing="sharedStuff.propertiesPaneStuff.thing"
                :fields="sharedStuff.propertiesPaneStuff.fields"
            ></object-properties>
        </div>

        <div class="layers-container" ref="layersContainer" style="flex-grow: 1; overflow: auto;">
            <level-graphical-editor
                :editor-inputs="editorInputs"
                :level-editor-shared="sharedStuff"
            ></level-graphical-editor>
        </div>

        <div id="layerMenuVue" class="menu" style="flex-shrink: 0;">
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