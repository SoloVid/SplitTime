namespace splitTime.editor.collage {
    export interface VueCollageEditor extends client.VueComponent {
        // props
        editorInputs: client.UserInputs
        editorGlobalStuff: client.GlobalEditorShared
        supervisorControl: client.EditorSupervisorControl
        collage: file.Collage
        // data
        sharedStuff: SharedStuff
        traceOptions: {
            type: string,
            color: string,
            help: string
        }[]
        // computed
        inputs: client.UserInputs
        position: Coordinates2D
        editorWidth: number
        editorHeight: number
        // methods
        onCollageChange(): void
        onSupervisorControlChange(): void
    }

    function data(this: VueCollageEditor): Partial<VueCollageEditor> {
        this.onSupervisorControlChange()
        return {
            sharedStuff: new SharedStuff(this as VueCollageEditor),
            traceOptions: client.traceOptions
        }
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
        return {
            x: this.$el.offsetLeft,
            y: this.$el.offsetTop
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

    function onCollageChange(this: VueCollageEditor): void {
        this.sharedStuff.selectedFrame = null
        this.sharedStuff.selectedMontage = null
    }

    function onSupervisorControlChange(this: VueCollageEditor): void {
        this.supervisorControl.triggerSettings = () => {
            this.sharedStuff.editProperties(getCollagePropertiesStuff(this.collage))
        }
    }

    Vue.component("collage-editor", {
        props: {
            editorInputs: Object,
            editorGlobalStuff: Object,
            supervisorControl: Object,
            collage: Object
        },
        data,
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
            collage: onCollageChange,
            supervisorControl: onSupervisorControlChange
        },
        template: `
<div class="collage-editor" style="overflow-y: auto;">
    <div class="top-row" style="display: flex; flex-flow: row; height: 50%;">
        <div class="menu">
            <div class="trace-type-options">
                <div v-for="(traceOption) in traceOptions"
                    :key="traceOption.type"
                    class="option"
                    :style="{ color: 'white', backgroundColor: traceOption.color }"
                    @click="sharedStuff.traceTypeSelected = traceOption.type"
                    :title="traceOption.help"
                >
                    {{ traceOption.type }}
                </div>
            </div>
            <hr/>
            <object-properties
                v-if="!!sharedStuff.propertiesPaneStuff"
                :editor-global-stuff="editorGlobalStuff"
                :spec="sharedStuff.propertiesPaneStuff"
            ></object-properties>
        </div>
        <div class="collage-layout-container" style="flex-grow: 1; height: 100%; overflow: auto">
            <collage-layout
                :editor-inputs="editorInputs"
                :collage-editor-shared="sharedStuff"
            ></collage-layout>
        </div>
        <div class="collage-showcase-container" style="flex-grow: 1; overflow: auto;">
            <collage-showcase
                style="flex-grow: 1;"
                :collage-edit-helper="sharedStuff"
                :collage-view-helper="sharedStuff"
                :editor-inputs="editorInputs"
            ></collage-showcase>
        </div>
    </div>
    <div style="overflow: auto; height: 50%;">
        <montage-editor
            v-if="!!sharedStuff.selectedMontage"
            :collage-editor-shared="sharedStuff"
            :editor-inputs="editorInputs"
            :montage="sharedStuff.selectedMontage"
        ></montage-editor>
    </div>
</div>
        `
    })
}