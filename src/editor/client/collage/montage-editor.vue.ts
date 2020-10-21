namespace splitTime.editor.collage {
    interface VueMontageEditor extends client.VueComponent {
        // props
        collageEditorShared: CollageEditorShared
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
        this.collageEditorShared.selectMontageFrame(montageFrame, !(event as PropertiesEvent).propertiesPanelSet)
    }

    Vue.component("montage-editor", {
        props: {
            collageEditorShared: Object,
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
<div :style="gridStyle">
    <div v-if="montage.frames.length === 0">
        Double-click a frame to add it to this montage.
    </div>
    <template v-for="frame in montage.frames">
        <div
            @mousedown="selectFrame(frame, $event)"
        >
            <montage-frame
                :collage-editor-shared="collageEditorShared"
                :montage="montage"
                :montage-frame="frame"
                :edit-affects-all-frames="false"
                :highlight="frame.frameId === selectedFrameId"
            ></montage-frame>
        </div>
    </template>
</div>
        `
    })
}