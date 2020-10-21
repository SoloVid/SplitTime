namespace splitTime.editor.collage {
    interface VueMontageEditor extends client.VueComponent {
        // props
        collageEditorShared: CollageEditorShared
        montage: file.collage.Montage
        // computed
        collage: file.Collage
        gridStyle: object
        realMontage: splitTime.collage.Montage
        widestFrameWidth: number
        // methods
        changeActiveFrame(montage: file.collage.Frame): void
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

    function realMontage(this: VueMontageEditor): splitTime.collage.Montage {
        const dir = this.montage.direction === "" ? undefined : this.montage.direction
        return this.collageEditorShared.realCollage.getMontage(this.montage.id, dir)
    }

    function widestFrameWidth(this: VueMontageEditor): number {
        return this.collageEditorShared.collage.frames.reduce((maxWidth, f) => {
            return Math.max(maxWidth, f.width)
        }, 0)
    }

    function changeActiveFrame(this: VueMontageEditor, frame: file.collage.Frame): void {
        // this.collageEditorShared.selectMontage(montage)
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
            realMontage,
            widestFrameWidth
        },
        methods: {
            changeActiveFrame
        },
        template: `
<div :style="gridStyle">
    <template v-for="frame in realMontage.frames">
        <div
        >
            <montage-frame
                :collage-editor-shared="collageEditorShared"
                :frame="frame"
                :montage="montage"
            ></montage-frame>
        </div>
    </template>
</div>
        `
    })
}