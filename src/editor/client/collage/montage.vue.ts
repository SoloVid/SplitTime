namespace splitTime.editor.collage {
    interface VueMontage {
        // props
        collageEditorShared: CollageEditorShared
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
        return this.realMontage.getFrameAt(this.collageEditorShared.time)
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
        return this.collageEditorShared.realCollage.getMontage(this.montage.id, dir)
    }

    function containerStyle(this: VueMontage): object {
        return {
            position: 'relative',
            width: this.overallArea.width + 'px',
            height: this.overallArea.height + 'px',
            outline: this.montage === this.collageEditorShared.selectedMontage ? "4px solid red" : "none"
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
        this.collageEditorShared.selectMontage(this.montage, alsoSetProperties)
    }

    Vue.component("montage", {
        props: {
            collageEditorShared: Object,
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
                :collage-editor-shared="collageEditorShared"
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
