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
        const width = this.collageEditorShared.realCollage.montages.reduce((maxWidth, m) => {
            const mWidth = m.getOverallArea().width
            return Math.max(maxWidth, mWidth)
        }, 0)
        console.log("widest: " + width)
        return width
    }

    function createNewMontage(this: VueCollageShowcase): void {
        const collageHelper = new CollageHelper(this.collage)
        const newMontage = collageHelper.newMontage()
        this.collage.montages.push(newMontage)
        this.collageEditorShared.selectMontage(newMontage, true)
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