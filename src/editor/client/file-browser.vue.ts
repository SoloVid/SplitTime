namespace splitTime.editor.client {
    interface VueFileBrowser extends VueComponent {
        // props
        editorInputs: UserInputs
        editorGlobalStuff: level.GlobalEditorShared
        supervisorControl: EditorSupervisorControl
        level: Level
        // computed
        position: Coordinates2D
        editorWidth: number
        editorHeight: number
    }

    function position(this: VueFileBrowser): Coordinates2D {
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

    function editorWidth(this: VueFileBrowser): number {
        if (!this.$el) {
            return 0
        }
        return this.$el.clientWidth
    }
    function editorHeight(this: VueFileBrowser): number {
        if (!this.$el) {
            return 0
        }
        return this.$el.clientHeight
    }

    Vue.component("file-browser", {
        props: {
            editorInputs: Object,
            editorGlobalStuff: Object,
            supervisorControl: Object,
            level: Object
        },
        data: function() {
            return {
            }
        },
        computed: {
            position,
            editorWidth,
            editorHeight
        },
        template: `
        `
    })
}