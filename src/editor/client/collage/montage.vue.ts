namespace splitTime.editor.collage {
    interface VueMontage {
        // props
        collageEditHelper: IVueCollageEditHelper | undefined
        collageViewHelper: IVueCollageViewHelper
        montage: file.collage.Montage
        // data
        placeholderImgSrc: string
        // computed
        fileMontageFrame: file.collage.MontageFrame
        frame: splitTime.collage.Frame
        frameTargetBox: math.Rect
        overallArea: math.Rect
        realMontage: splitTime.collage.Montage
        containerStyle: object
        frameDivStyle: object
        // asyncComputed
        // methods
        setActiveMontage(event: MouseEvent): void
    }

    function data(this: VueMontage): Partial<VueMontage> {
        return {
            placeholderImgSrc: level.getPlaceholderImage()
        }
    }

    function fileMontageFrame(this: VueMontage): file.collage.MontageFrame {
        const montageFrameIndex = this.realMontage.frames.indexOf(this.frame)
        return this.montage.frames[montageFrameIndex]
    }

    function frame(this: VueMontage): splitTime.collage.Frame {
        return this.realMontage.getFrameAt(this.collageViewHelper.time)
    }

    function frameTargetBox(this: VueMontage): math.Rect {
        return this.frame.getTargetBox(this.realMontage.bodySpec)
    }

    function overallArea(this: VueMontage): math.Rect {
        if (this.montage.frames.length === 0) {
            // FTODO: Consider calculating these values better
            return math.Rect.make(0, 0, 16, 16)
        }
        return this.realMontage.getOverallArea()
    }

    function realMontage(this: VueMontage): splitTime.collage.Montage {
        const dir = this.montage.direction === "" ? undefined : this.montage.direction
        return this.collageViewHelper.realCollage.getMontage(this.montage.id, dir)
    }

    function containerStyle(this: VueMontage): object {
        return {
            position: 'relative',
            width: this.overallArea.width + 'px',
            height: this.overallArea.height + 'px',
            outline: this.montage === this.collageViewHelper.selectedMontage ? "4px solid red" : "none"
        }
    }

    function frameDivStyle(this: VueMontage): object {
        return {
            position: 'absolute',
            left: (this.frameTargetBox.x - this.overallArea.x) + 'px',
            top: (this.frameTargetBox.y - this.overallArea.y) + 'px'
        }
    }

    function setActiveMontage(this: VueMontage, event: MouseEvent): void {
        const alsoSetProperties = !(event as PropertiesEvent).propertiesPanelSet
        if (!!this.collageEditHelper) {
            this.collageEditHelper.selectMontage(this.montage, alsoSetProperties)
        } else {
            this.collageViewHelper.selectMontage(this.montage)
        }
    }

    Vue.component("montage", {
        props: {
            collageEditHelper: Object,
            collageViewHelper: Object,
            montage: Object
        },
        data,
        computed: {
            fileMontageFrame,
            frame,
            frameTargetBox,
            overallArea,
            realMontage,
            containerStyle,
            frameDivStyle
        },
        asyncComputed: {
        },
        methods: {
            setActiveMontage
        },
        template: `
<div
    @mousedown.left="setActiveMontage"
>
    <div
        :style="containerStyle"
        class="transparency-checkerboard-background"
        :title="montage.id + ' (' + montage.direction + ')'"
    >
        <div
            v-if="montage.frames.length === 0"
            style="overflow: hidden; width: 100%; height: 100%;"
        >
            <img v-if="montage.frames.length === 0" :src="placeholderImgSrc"/>
        </div>
        <div
            v-if="montage.frames.length > 0"
            :style="frameDivStyle"
        >
            <montage-frame
                :collage-edit-helper="collageEditHelper"
                :collage-view-helper="collageViewHelper"
                :montage="montage"
                :montage-frame="fileMontageFrame"
                :edit-affects-all-frames="true"
                :highlight="false"
            ></montage-frame>
        </div>
    </div>
</div>
        `
    })
}
