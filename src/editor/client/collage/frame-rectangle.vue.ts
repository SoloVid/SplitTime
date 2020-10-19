namespace splitTime.editor.collage {
    interface VueFrameRectangle extends client.VueComponent {
        // props
        collageEditorShared: CollageEditorShared
        frame: file.collage.Frame
        // data
        // computed
        collage: file.Collage
        traceStroke: string
        // asyncComputed
        backgroundSrc: string
        // methods
    }

    function data(this: VueFrameRectangle): Partial<VueFrameRectangle> {
        return {
        }
    }

    function collage(this: VueFrameRectangle): file.Collage {
        return this.collageEditorShared.collage
    }

    function traceStroke(this: VueFrameRectangle): string {
        return "black"
    }

    function backgroundSrc(this: VueFrameRectangle): PromiseLike<string> {
        return this.collageEditorShared.server.imgSrc(this.collage.image)
    }

    Vue.component("frame-rectangle", {
        props: {
            collageEditorShared: Object,
            frame: Object
        },
        data,
        computed: {
            collage,
            traceStroke
        },
        asyncComputed: {
            backgroundSrc
        },
        methods: {
        },
        template: `
<g>
    <rect
        :x="frame.x"
        :y="frame.y"
        :width="frame.width"
        :height="frame.height"
        :stroke="traceStroke"
        stroke-width="2"
        fill="none"
    />
</g>
        `,
    })
}