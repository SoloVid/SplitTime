namespace splitTime.editor.collage {
    /** Shared component for either prop or position */
    interface VueMontage {
        // props
        collageEditorShared: CollageEditorShared
        montage: file.collage.Parcel
        // computed
        frame: splitTime.collage.Frame
        frameTargetBox: math.Rect
        overallArea: math.Rect
        realMontage: splitTime.collage.Parcel
        containerStyle: object
        imageDivStyle: object
        // asyncComputed
        imgSrc: string
        // methods
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

    function realMontage(this: VueMontage): splitTime.collage.Parcel {
        const dir = this.montage.direction === "" ? undefined : this.montage.direction
        return this.collageEditorShared.realCollage.getParcel(this.montage.id, dir)
    }

    function containerStyle(this: VueMontage): object {
        return {
            position: 'relative',
            width: this.frameTargetBox.width + 'px',
            height: this.frameTargetBox.height + 'px'
        }
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
            frame,
            frameTargetBox,
            overallArea,
            realMontage,
            containerStyle,
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
>
    <div
        :style="imageDivStyle"
    >
        <img :src="imgSrc" :style="{ position: 'absolute', left: -frame.box.x + 'px', top: -frame.box.y + 'px' }"/>
    </div>
</div>
        `
    })
}
