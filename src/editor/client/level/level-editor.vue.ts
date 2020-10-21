namespace splitTime.editor.level {
    class SharedStuff implements LevelEditorShared {
        activeLayer: int = 0
        // TODO: make this editable, hard-set now for testing
        gridCell = new Vector2D(32, 32)
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
<div>
    <div>
        <div ref="layersContainer">
            <level-graphical-editor
                :editor-inputs="editorInputs"
                :level-editor-shared="sharedStuff"
            ></level-graphical-editor>
        </div>

        <div class="menu" style="left:0px;width:100px">
            <level-editor-tools
                :level-editor-shared="sharedStuff"
            ></level-editor-tools>
            <object-properties
                :title="sharedStuff.propertiesPaneStuff.title"
                :thing="sharedStuff.propertiesPaneStuff.thing"
                :fields="sharedStuff.propertiesPaneStuff.fields"
            ></object-properties>
        </div>
        <div id="layerMenuVue" class="menu" style="right:0px;">
            <level-tree
                :level-editor-shared="sharedStuff"
            ></level-tree>
        </div>
    </div>

    <div id="XMLEditorBack" class="backdrop">
        <div id="XMLEditor">
            <div id="XMLEditorFields"></div>
            <button id="saveChanges" style="right:0;">Save Changes</button>
            <button id="deleteThing">Delete This</button>
        </div>
    </div>

    <div id="infoPane" class="menu" style="left: 0; top: auto; bottom: 0; width: auto;">
        <span v-for="(value, name) in sharedStuff.info" :key="name">
            {{ name }}: {{ value }}
        </span>
    </div>
</div>
        `
    })
}