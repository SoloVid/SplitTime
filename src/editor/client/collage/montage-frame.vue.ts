namespace splitTime.editor.collage {
    interface VueMontageFrame {
        // props
        collageEditorShared: CollageEditorShared
        frame: splitTime.collage.Frame
        montage: file.collage.Montage
        // data
        editorPadding: number
        // computed
        body: file.collage.BodySpec
        frameTargetBox: math.Rect
        bodyFrontRectRelative: math.Rect
        imageDivStyle: object
        svgStyle: object
        // asyncComputed
        imgSrc: string
        // methods
    }

    function body(this: VueMontageFrame): file.collage.BodySpec {
        return this.montage.body
    }

    function frameTargetBox(this: VueMontageFrame): math.Rect {
        return this.frame.getTargetBox(this.body)
    }

    function bodyFrontRectRelative(this: VueMontageFrame): math.Rect {
        return math.Rect.make(
            EDITOR_PADDING - this.frameTargetBox.x - this.body.width / 2,
            EDITOR_PADDING - this.frameTargetBox.y - this.body.height,
            this.body.width,
            this.body.height
        )
    }

    function imageDivStyle(this: VueMontageFrame): object {
        return {
            position: 'relative',
            overflow: 'hidden',
            width: this.frameTargetBox.width + 'px',
            height: this.frameTargetBox.height + 'px'
        }
    }

    function svgStyle(this: VueMontageFrame): object {
        return {
            position: 'absolute',
            left: (-EDITOR_PADDING) + "px",
            top: (-EDITOR_PADDING) + "px",
            width: (this.frameTargetBox.width + 2 * EDITOR_PADDING) + "px",
            height: (this.frameTargetBox.height + 2 * EDITOR_PADDING) + "px",
            // Note: pointer events need to be manually turned back on for child elements that care
            "pointer-events": "none"
        }
    }

    async function imgSrc(this: VueMontageFrame): Promise<string> {
        const s = this.collageEditorShared.server
        return await s.imgSrc(this.collageEditorShared.collage.image)
    }

    Vue.component("montage-frame", {
        props: {
            collageEditorShared: Object,
            frame: Object,
            montage: Object
        },
        computed: {
            body,
            frameTargetBox,
            bodyFrontRectRelative,
            imageDivStyle,
            svgStyle
        },
        asyncComputed: {
            imgSrc: {
                get: imgSrc,
                default: ""
            }
        },
        methods: {
        },
        template: `
<div style="position: relative;">
    <div
        :style="imageDivStyle"
    >
        <img :src="imgSrc" :style="{ position: 'absolute', left: -frame.box.x + 'px', top: -frame.box.y + 'px' }"/>
    </div>
    <svg :style="svgStyle">
        <rect
            :x="bodyFrontRectRelative.x"
            :y="bodyFrontRectRelative.y + body.height - body.depth"
            :width="body.width"
            :height="body.depth"
            stroke="red"
            stroke-width="2"
            stroke-dasharray="2,1"
            fill="none"
        />
        <rect
            style="pointer-events: initial;"
            :x="bodyFrontRectRelative.x"
            :y="bodyFrontRectRelative.y"
            :width="bodyFrontRectRelative.width"
            :height="bodyFrontRectRelative.height"
            fill="url(#diagonal-hatch)"
            stroke="red"
            stroke-width="2"
            stroke-dasharray="2,1"
        />
        <rect
            :x="bodyFrontRectRelative.x"
            :y="bodyFrontRectRelative.y - body.depth"
            :width="body.width"
            :height="body.depth"
            stroke="red"
            stroke-width="2"
            stroke-dasharray="2,1"
            fill="none"
        />
    </svg>
</div>
        `
    })
}
