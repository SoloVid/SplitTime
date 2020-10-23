namespace splitTime.editor.collage {
    export interface VueCollageEditor extends client.VueComponent {
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
            this.sharedStuff.propertiesPaneStuff = getCollagePropertiesStuff(this.collage)
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
    <div style="display: flex; flex-flow: row wrap;" class="vertical-bar-separators">
        <div class="menu">
            <object-properties
                :title="sharedStuff.propertiesPaneStuff.title"
                :thing="sharedStuff.propertiesPaneStuff.thing"
                :fields="sharedStuff.propertiesPaneStuff.fields"
            ></object-properties>
        </div>
        <div class="standard-padding">
            <collage-layout
                :editor-inputs="editorInputs"
                :collage-editor-shared="sharedStuff"
            ></collage-layout>
        </div>
        <div style="flex-grow: 1;" class="standard-padding">
            <collage-showcase
                style="flex-grow: 1;"
                :collage-editor-shared="sharedStuff"
            ></collage-showcase>
        </div>
    </div>
    <montage-editor
        v-if="!!sharedStuff.selectedMontage"
        :collage-editor-shared="sharedStuff"
        :montage="sharedStuff.selectedMontage"
    ></montage-editor>
</div>
        `
    })
}