namespace splitTime.editor.collage {
    /** Shared component for either prop or position */
    interface VueMontage {
        // props
        collageEditorShared: CollageEditorShared
        montage: file.collage.Montage
        // computed
        body: file.collage.BodySpec
        frame: splitTime.collage.Frame
        frameTargetBox: math.Rect
        overallArea: math.Rect
        realMontage: splitTime.collage.Montage
        containerStyle: object
        bodyFrontRectRelative: math.Rect
        imageDivStyle: object
        // asyncComputed
        imgSrc: string
        // methods
    }

    function body(this: VueMontage): file.collage.BodySpec {
        return this.montage.body
    }

    function frame(this: VueMontage): splitTime.collage.Frame {
        return this.realMontage.getFrameAt(this.collageEditorShared.time)
    }

    function frameTargetBox(this: VueMontage): math.Rect {
        return this.frame.getTargetBox(this.realMontage.bodySpec)
    }

    function overallArea(this: VueMontage): math.Rect {
        return this.realMontage.getOverallArea()
    }

    function realMontage(this: VueMontage): splitTime.collage.Montage {
        const dir = this.montage.direction === "" ? undefined : this.montage.direction
        return this.collageEditorShared.realCollage.getMontage(this.montage.id, dir)
    }

    function containerStyle(this: VueMontage): object {
        return {
            position: 'relative',
            width: this.overallArea.width + 'px',
            height: this.overallArea.height + 'px'
        }
    }

    function bodyFrontRectRelative(this: VueMontage): math.Rect {
        return math.Rect.make(
            -this.overallArea.x - this.realMontage.bodySpec.width / 2,
            -this.overallArea.y - this.realMontage.bodySpec.height,
            this.realMontage.bodySpec.width,
            this.realMontage.bodySpec.height
        )
    }

    function imageDivStyle(this: VueMontage): object {
        return {
            position: 'absolute',
            overflow: 'hidden',
            left: (this.frameTargetBox.x - this.overallArea.x) + 'px',
            top: (this.frameTargetBox.y - this.overallArea.y) + 'px',
            width: this.frameTargetBox.width + 'px',
            height: this.frameTargetBox.height + 'px'
        }
    }

    async function imgSrc(this: VueMontage): Promise<string> {
        const s = this.collageEditorShared.server
        return await s.imgSrc(this.collageEditorShared.collage.image)
    }

    Vue.component("montage", {
        props: {
            collageEditorShared: Object,
            montage: Object
        },
        computed: {
            body,
            frame,
            frameTargetBox,
            overallArea,
            realMontage,
            containerStyle,
            bodyFrontRectRelative,
            imageDivStyle
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
<div
    :style="containerStyle"
    class="transparency-checkerboard-background"
>
    <div
        :style="imageDivStyle"
    >
        <img :src="imgSrc" :style="{ position: 'absolute', left: -frame.box.x + 'px', top: -frame.box.y + 'px' }"/>
    </div>
    <svg style="position: relative;">
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
