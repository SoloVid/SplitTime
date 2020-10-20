namespace splitTime.editor.collage {
    interface VueCollageShowcase extends client.VueComponent {
        // props
        collageEditorShared: CollageEditorShared
        // computed
        collage: file.Collage
        gridStyle: object
        widestMontageWidth: number
        // methods
    }

    function collage(this: VueCollageShowcase): file.Collage {
        return this.collageEditorShared.collage
    }

    function gridStyle(this: VueCollageShowcase): object {
        return {
            display: "grid",
            "grid-template-columns": "repeat(auto-fill, minmax(" + this.widestMontageWidth + "px, 1fr))",
            "grid-gap": "1rem"
        }
    }

    function widestMontageWidth(this: VueCollageShowcase): number {
        return this.collageEditorShared.realCollage.montages.reduce((maxWidth, m) => {
            const mWidth = m.getOverallArea().width
            return Math.max(maxWidth, mWidth)
        }, 0)
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
        },
        template: `
<div :style="gridStyle">
    <montage
        v-for="m in collage.montages"
        :collage-editor-shared="collageEditorShared"
        :montage="m"
    ></montage>
</div>
        `
    })
}