namespace splitTime.editor.collage {
    interface VueMontageEditor extends client.VueComponent {
        // props
        collageEditorShared: CollageEditorShared
        editorInputs: client.UserInputs
        montage: file.collage.Montage
        // computed
        collage: file.Collage
        gridStyle: object
        selectedFrameId: string | null
        widestFrameWidth: number
        // methods
        selectFrame(montageFrame: file.collage.MontageFrame, event: MouseEvent): void
    }

    function collage(this: VueMontageEditor): file.Collage {
        return this.collageEditorShared.collage
    }

    function gridStyle(this: VueMontageEditor): object {
        return {
            display: "grid",
            "grid-template-columns": "repeat(auto-fill, minmax(" + this.widestFrameWidth + "px, 1fr))",
            "grid-gap": "0.5rem"
        }
    }

    function selectedFrameId(this: VueMontageEditor): string | null {
        if (this.collageEditorShared.selectedFrame === null) {
            return null
        }
        return this.collageEditorShared.selectedFrame.id
    }

    function widestFrameWidth(this: VueMontageEditor): number {
        return this.collageEditorShared.collage.frames.reduce((maxWidth, f) => {
            return Math.max(maxWidth, f.width)
        }, 0)
    }

    function selectFrame(this: VueMontageEditor, montageFrame: file.collage.MontageFrame, event: MouseEvent): void {
        if (this.collageEditorShared.traceInProgress) {
            return
        }
        this.collageEditorShared.selectMontageFrame(montageFrame, !(event as PropertiesEvent).propertiesPanelSet)
    }

    Vue.component("montage-editor", {
        props: {
            collageEditorShared: Object,
            editorInputs: Object,
            montage: Object
        },
        data: function() {
            return {
            }
        },
        computed: {
            collage,
            gridStyle,
            selectedFrameId,
            widestFrameWidth
        },
        methods: {
            selectFrame
        },
        template: `
<div class="standard-margin standard-padding transparency-checkerboard-background" :style="gridStyle">
    <div v-if="montage.frames.length === 0">
        Double-click a frame to add it to this montage.
    </div>
    <template v-for="frame in montage.frames">
        <div
            @mousedown.left="selectFrame(frame, $event)"
        >
            <montage-frame
                :collage-edit-helper="collageEditorShared"
                :collage-view-helper="collageEditorShared"
                :edit-affects-all-frames="false"
                :editor-inputs="editorInputs"
                :highlight="frame.frameId === selectedFrameId"
                :montage="montage"
                :montage-frame="frame"
            ></montage-frame>
        </div>
    </template>
</div>
        `
    })
}