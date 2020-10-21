namespace splitTime.editor.collage {
    interface VueCollageShowcase extends client.VueComponent {
        // props
        collageEditorShared: CollageEditorShared
        // computed
        collage: file.Collage
        gridStyle: object
        widestMontageWidth: number
        // methods
        createNewMontage(): void
    }

    function collage(this: VueCollageShowcase): file.Collage {
        return this.collageEditorShared.collage
    }

    function gridStyle(this: VueCollageShowcase): object {
        return {
            display: "grid",
            "grid-template-columns": "repeat(auto-fill, minmax(" + this.widestMontageWidth + "px, 1fr))",
            "grid-gap": "0.5rem",
            "align-items": "center"
        }
    }

    function widestMontageWidth(this: VueCollageShowcase): number {
        return this.collageEditorShared.realCollage.montages.reduce((maxWidth, m) => {
            const mWidth = m.getOverallArea().width
            return Math.max(maxWidth, mWidth)
        }, 0)
    }

    function createNewMontage(this: VueCollageShowcase): void {
        let frameIndex = this.collage.montages.length
        let frameId = "Montage " + frameIndex
        while (this.collage.frames.some(f => f.id === frameId)) {
            frameIndex++
            frameId = "Montage " + frameIndex
        }
        const defaultBodySpec = {
            width: 16,
            depth: 16,
            height: 48
        }
        const newMontage: file.collage.Montage = {
            id: frameId,
            direction: "",
            frames: [],
            body: defaultBodySpec,
            traces: []
        }
        this.collage.montages.push(newMontage)
        this.collageEditorShared.selectMontage(newMontage)
    }

    Vue.component("collage-showcase", {
        props: {
            collageEditorShared: Object
        },
        data: function() {
            return {
            }
        },
        computed: {
            collage,
            gridStyle,
            widestMontageWidth
        },
        methods: {
            createNewMontage
        },
        template: `
<div :style="gridStyle">
    <template v-for="m in collage.montages">
    <montage
        style="overflow: none;"
        :collage-editor-shared="collageEditorShared"
        :montage="m"
    ></montage>
    </template>
    <div
        @mousedown.left="createNewMontage"
        style="border: 2px solid black; text-align: center;"
    >
        <i class="fas fa-plus fa-2x"></i>
    </div>
</div>
        `
    })
}