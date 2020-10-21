namespace splitTime.editor.collage {
    interface VueMontage {
        // props
        collageEditorShared: CollageEditorShared
        montage: file.collage.Montage
        // computed
        frame: splitTime.collage.Frame
        frameTargetBox: math.Rect
        overallArea: math.Rect
        realMontage: splitTime.collage.Montage
        containerStyle: object
        frameDivStyle: object
        // asyncComputed
        // methods
        setActiveMontage(): void
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

    function frameDivStyle(this: VueMontage): object {
        return {
            position: 'absolute',
            left: (this.frameTargetBox.x - this.overallArea.x) + 'px',
            top: (this.frameTargetBox.y - this.overallArea.y) + 'px'
        }
    }

    function setActiveMontage(this: VueMontage): void {
        this.collageEditorShared.selectMontage(this.montage)
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
            frameDivStyle
        },
        asyncComputed: {
        },
        methods: {
            setActiveMontage
        },
        template: `
<div
    :style="containerStyle"
    class="transparency-checkerboard-background"
    @mousedown.left="setActiveMontage"
>
    <div
        :style="frameDivStyle"
    >
        <montage-frame
            :collage-editor-shared="collageEditorShared"
            :frame="frame"
            :montage="montage"
        ></montage-frame>
    </div>
</div>
        `
    })
}
