namespace splitTime.editor.collage {
    interface VueCollageShowcase extends client.VueComponent {
        // props
        collageEditHelper: IVueCollageEditHelper | undefined
        collageViewHelper: IVueCollageViewHelper
        // computed
        collage: file.Collage
        gridStyle: object
        widestMontageWidth: number
        // methods
        createNewMontage(): void
    }

    function collage(this: VueCollageShowcase): file.Collage {
        return this.collageViewHelper.collage
    }

    function gridStyle(this: VueCollageShowcase): object {
        return {
            display: "grid",
            "grid-template-columns": "repeat(auto-fill, minmax(" + this.widestMontageWidth + "px, 1fr))",
            "grid-gap": "0.5rem",
            "align-items": "center",
            "justify-items": "center"
        }
    }

    function widestMontageWidth(this: VueCollageShowcase): number {
        const width = this.collageViewHelper.realCollage.montages.reduce((maxWidth, m) => {
            const mWidth = m.getOverallArea().width
            return Math.max(maxWidth, mWidth)
        }, 0)
        return Math.max(width, 16)
    }

    function createNewMontage(this: VueCollageShowcase): void {
        const collageHelper = new CollageHelper(this.collage)
        const newMontage = collageHelper.newMontage()
        this.collage.montages.push(newMontage)
        assert(!!this.collageEditHelper, "Collage editor should be defined for montage editing")
        this.collageEditHelper.selectMontage(newMontage, true)
    }

    Vue.component("collage-showcase", {
        props: {
            collageEditHelper: Object,
            collageViewHelper: Object
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
            :collage-edit-helper="collageEditHelper"
            :collage-view-helper="collageViewHelper"
            :montage="m"
        ></montage>
    </template>
    <div
        v-if="collageEditHelper"
        @mousedown.left="createNewMontage"
        title="Add montage"
        style="text-align: center; cursor: pointer;"
    >
        <i class="fas fa-plus fa-2x"></i>
    </div>
</div>
        `
    })
}