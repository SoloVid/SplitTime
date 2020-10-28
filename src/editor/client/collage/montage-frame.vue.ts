namespace splitTime.editor.collage {
    interface VueMontageFrame {
        // props
        collageEditHelper: IVueCollageEditHelper | undefined
        collageViewHelper: IVueCollageViewHelper
        montage: file.collage.Montage
        montageFrame: file.collage.MontageFrame
        editAffectsAllFrames: boolean
        highlight: boolean
        // data
        editorPadding: number
        // computed
        body: file.collage.BodySpec
        frame: splitTime.collage.Frame
        frameTargetBox: math.Rect
        bodyFrontRectRelative: math.Rect
        imageDivStyle: object
        svgStyle: object
        // asyncComputed
        imgSrc: string
        // methods
        trackBody(event: MouseEvent): void
    }

    function body(this: VueMontageFrame): file.collage.BodySpec {
        return this.montage.body
    }

    function frame(this: VueMontageFrame): splitTime.collage.Frame {
        const montageIndex = this.collageViewHelper.collage.montages.indexOf(this.montage)
        const montageFrameIndex = this.montage.frames.indexOf(this.montageFrame)
        return this.collageViewHelper.realCollage.montages[montageIndex].frames[montageFrameIndex]
    }

    function frameTargetBox(this: VueMontageFrame): math.Rect {
        return this.frame.getTargetBox(this.body)
    }

    function bodyFrontRectRelative(this: VueMontageFrame): math.Rect {
        return math.Rect.make(
            EDITOR_PADDING - this.frameTargetBox.x - this.body.width / 2,
            EDITOR_PADDING - this.frameTargetBox.y + this.body.depth / 2 - this.body.height,
            this.body.width,
            this.body.height
        )
    }

    function imageDivStyle(this: VueMontageFrame): object {
        return {
            position: 'relative',
            overflow: 'hidden',
            width: this.frameTargetBox.width + 'px',
            height: this.frameTargetBox.height + 'px',
            outline: this.highlight ? "4px solid red" : "none"
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
        const s = this.collageViewHelper.server
        return await s.imgSrc(this.collageViewHelper.collage.image)
    }

    function trackBody(this: VueMontageFrame, event: MouseEvent): void {
        assert(!!this.collageEditHelper, "trackBody() must be called with edit helper")
        this.collageEditHelper.editProperties(getBodySpecPropertiesStuff(this.body))
        const affectedMontageFrames = this.editAffectsAllFrames ? this.montage.frames : [this.montageFrame]
        this.collageEditHelper.follow({
            shift(dx: number, dy: number) {
                for (const montageFrame of affectedMontageFrames) {
                    montageFrame.offsetX -= dx
                    montageFrame.offsetY -= dy
                }
            }
        })
        // Somewhat type-unsafe way of letting upper events know they should try to set properties
        const anyEvent = event as PropertiesEvent
        anyEvent.propertiesPanelSet = true
        event.preventDefault()
    }

    Vue.component("montage-frame", {
        props: {
            collageEditHelper: Object,
            collageViewHelper: Object,
            montage: Object,
            montageFrame: Object,
            editAffectsAllFrames: Boolean,
            highlight: Boolean
        },
        computed: {
            body,
            frame,
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
            trackBody
        },
        template: `
<div style="position: relative;">
    <div
        :style="imageDivStyle"
    >
        <img :src="imgSrc" :style="{ position: 'absolute', left: -frame.box.x + 'px', top: -frame.box.y + 'px' }"/>
    </div>
    <svg v-if="collageEditHelper" :style="svgStyle">
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
            style="pointer-events: initial; cursor: grab;"
            @mousedown="trackBody"
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
