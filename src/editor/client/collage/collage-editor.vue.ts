namespace splitTime.editor.collage {
    class SharedStuff implements CollageEditorShared {
        readonly info = {}
        // propertiesPaneStuff: client.ObjectProperties

        constructor(
            private editor: VueCollageEditor
        ) {
            // this.propertiesPaneStuff = getLevelPropertiesStuff(this.editor.level)
        }

        get collage(): file.Collage {
            return this.editor.collage
        }

        get realCollage(): splitTime.Collage {
            return splitTime.collage.makeCollageFromFile(this.collage)
        }

        get server(): client.ServerLiaison {
            return this.editor.editorGlobalStuff.server
        }

        get time(): game_seconds {
            return this.editor.editorGlobalStuff.time
        }

        // follow(follower: client.Followable): void {
        //     this.editor.editorGlobalStuff.setFollowers([follower])
        // }
    }

    interface VueCollageEditor extends client.VueComponent {
        // props
        editorInputs: client.UserInputs
        editorGlobalStuff: client.GlobalEditorShared
        supervisorControl: client.EditorSupervisorControl
        collage: file.Collage
        // data
        sharedStuff: CollageEditorShared
        // computed
        inputs: client.UserInputs
        position: Coordinates2D
        editorWidth: number
        editorHeight: number
        // methods
        onSupervisorControlChange(): void
    }

    function inputs(this: VueCollageEditor): client.UserInputs {
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

    function position(this: VueCollageEditor): Coordinates2D {
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

    function editorWidth(this: VueCollageEditor): number {
        if (!this.$el) {
            return 0
        }
        return this.$el.clientWidth
    }
    function editorHeight(this: VueCollageEditor): number {
        if (!this.$el) {
            return 0
        }
        return this.$el.clientHeight
    }

    function onSupervisorControlChange(this: VueCollageEditor): void {
        this.supervisorControl.triggerSettings = () => {
            // TODO: implement
            // this.sharedStuff.propertiesPaneStuff = getLevelPropertiesStuff(this.level)
        }
    }

    Vue.component("collage-editor", {
        props: {
            editorInputs: Object,
            editorGlobalStuff: Object,
            supervisorControl: Object,
            collage: Object
        },
        data: function() {
            (this as VueCollageEditor).onSupervisorControlChange()
            return {
                sharedStuff: new SharedStuff(this as VueCollageEditor)
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
    <collage-layout
        :editor-inputs="editorInputs"
        :collage-editor-shared="sharedStuff"
    ></collage-layout>
    <div>
        <montage
            v-for="m in collage.parcels"
            :collage-editor-shared="sharedStuff"
            :montage="m"
        ></montage>
    </div>
</div>
        `
    })
}