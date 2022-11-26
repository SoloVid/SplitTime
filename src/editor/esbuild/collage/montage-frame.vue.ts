namespace splitTime.editor.collage {
    interface VueMontageFrame extends client.VueComponent {
        // props
        collageEditHelper: IVueCollageEditHelper | undefined
        collageViewHelper: IVueCollageViewHelper
        editAffectsAllFrames: boolean
        editorInputs: client.UserInputs
        highlight: boolean
        montage: file.collage.Montage
        montageFrame: file.collage.MontageFrame
        // data
        editorPadding: number
        // computed
        body: file.collage.BodySpec
        bodyFrontRectRelative: math.Rect
        frame: splitTime.collage.Frame
        frameTargetBox: math.Rect
        imageDivStyle: object
        inputs: client.UserInputs
        svgStyle: object
        svgTransform: string
        // asyncComputed
        imgSrc: string
        // methods
        editBody(event: MouseEvent): void
        trackBody(event: MouseEvent): void
    }

    function body(this: VueMontageFrame): file.collage.BodySpec {
        return this.montage.body
    }

    function bodyFrontRectRelative(this: VueMontageFrame): math.Rect {
        return math.Rect.make(
            -this.body.width / 2,
            this.body.depth / 2 - this.body.height,
            this.body.width,
            this.body.height
        )
    }

    function frame(this: VueMontageFrame): splitTime.collage.Frame {
        const montageIndex = this.collageViewHelper.collage.montages.indexOf(this.montage)
        const montageFrameIndex = this.montage.frames.indexOf(this.montageFrame)
        return this.collageViewHelper.realCollage.montages[montageIndex].frames[montageFrameIndex]
    }

    function frameTargetBox(this: VueMontageFrame): math.Rect {
        return this.frame.getTargetBox(this.body)
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

    function inputs(this: VueMontageFrame): client.UserInputs {
        let position = {
            x: 0,
            y: 0
        }
        if (this.$el) {
            position = {
                x: this.$el.offsetLeft - this.$el.parentElement!.scrollLeft,
                y: this.$el.offsetTop - this.$el.parentElement!.scrollTop
            }
        }
        const mouse = {
            x: this.editorInputs.mouse.x - position.x,
            y: this.editorInputs.mouse.y - position.y,
            isDown: this.editorInputs.mouse.isDown
        }
        return {
            mouse,
            ctrlDown: this.editorInputs.ctrlDown
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

    function svgTransform(this: VueMontageFrame): string {
        // Note that the frameTargetBox coordinates are typically negative
        const x = EDITOR_PADDING - this.frameTargetBox.x
        const y = EDITOR_PADDING - this.frameTargetBox.y
        return "translate(" + x + " " + y + ")"
    }

    async function imgSrc(this: VueMontageFrame): Promise<string> {
        const s = this.collageViewHelper.server
        return await s.imgSrc(this.collageViewHelper.collage.image)
    }

    function markEventAsPropertiesSet(event: MouseEvent): void {
        // Somewhat type-unsafe way of letting upper events know they should try to set properties
        const anyEvent = event as PropertiesEvent
        anyEvent.propertiesPanelSet = true
    }

    function editBody(this: VueMontageFrame, event: MouseEvent): void {
        assert(!!this.collageEditHelper, "editBody() must be called with edit helper")
        this.collageEditHelper.editProperties(getBodySpecPropertiesStuff(this.body))
        markEventAsPropertiesSet(event)
        event.preventDefault()
        this.collageEditHelper.traceInProgress = null
    }

    function trackBody(this: VueMontageFrame, event: MouseEvent): void {
        assert(!!this.collageEditHelper, "trackBody() must be called with edit helper")
        if (this.collageEditHelper.traceInProgress) {
            return
        }
        const affectedMontageFrames = this.editAffectsAllFrames ? this.montage.frames : [this.montageFrame]
        this.collageEditHelper.follow({
            shift(dx: number, dy: number) {
                for (const montageFrame of affectedMontageFrames) {
                    montageFrame.offsetX -= dx
                    montageFrame.offsetY -= dy
                }
            }
        })
        event.preventDefault()
    }

    function addNewTrace(montage: file.collage.Montage, type: string): splitTime.level.file_data.Trace {
        const z = 0
        const defaultHeight = level.DEFAULT_GROUP_HEIGHT
        let height = defaultHeight
        if(type === splitTime.trace.Type.GROUND) {
            type = splitTime.trace.Type.SOLID
            height = 0
        }
        const t = {
            id: "",
            group: "",
            type: type,
            vertices: "",
            z: z,
            height: height,
            direction: "",
            event: "",
            level: "",
            offsetX: 0,
            offsetY: 0,
            offsetZ: 0,
            targetPosition: ""
        }
        montage.traces.push(t)
        return t
    }

    function handleMouseUp(this: VueMontageFrame, event: MouseEvent): void {
        const helper = this.collageEditHelper || null
        // FTODO: Allow editing from animated montage
        // Right now, there are some issues with position for montages in showcase
        if (helper === null || this.editAffectsAllFrames) {
            return
        }

        const y = this.inputs.mouse.y + this.frameTargetBox.y
        const x = this.inputs.mouse.x + this.frameTargetBox.x
        const isLeftClick = event.which === 1
        const isRightClick = event.which === 3

        const gridCell = { x: 1, y: 1 }
        const snappedX = Math.round(x / gridCell.x) * gridCell.x
        const snappedY = Math.round(y / gridCell.y) * gridCell.y
        var literalPoint = "(" +
            Math.floor(snappedX) + ", " +
            Math.floor(snappedY) + ")"
        const traceInProgress = helper.traceInProgress
        const traceType = helper.traceTypeSelected
        if(isLeftClick) {
            if(traceInProgress) {
                traceInProgress.vertices = traceInProgress.vertices + " " + literalPoint
                markEventAsPropertiesSet(event)
            }
        } else if(isRightClick) {
            if(!traceInProgress) {
                var trace = addNewTrace(this.montage, traceType)
                trace.vertices = literalPoint
                helper.traceInProgress = trace
                helper.editProperties(getTracePropertiesStuff(this.montage, trace))
                markEventAsPropertiesSet(event)
            } else {
                if(!this.inputs.ctrlDown) {
                    traceInProgress.vertices = traceInProgress.vertices + " (close)"
                }
                helper.traceInProgress = null
                markEventAsPropertiesSet(event)
            }
        }
    }

    Vue.component("montage-frame", {
        props: {
            collageEditHelper: Object,
            collageViewHelper: Object,
            editAffectsAllFrames: Boolean,
            editorInputs: Object,
            highlight: Boolean,
            montage: Object,
            montageFrame: Object
        },
        computed: {
            body,
            bodyFrontRectRelative,
            frame,
            frameTargetBox,
            imageDivStyle,
            inputs,
            svgStyle,
            svgTransform
        },
        asyncComputed: {
            imgSrc: {
                get: imgSrc,
                default: ""
            }
        },
        methods: {
            editBody,
            handleMouseUp,
            trackBody
        },
        template: `
<div style="position: relative;"
    @contextmenu.prevent
    @mouseup="handleMouseUp"
>
    <div
        :style="imageDivStyle"
    >
        <img :src="imgSrc" :style="{ position: 'absolute', left: -frame.box.x + 'px', top: -frame.box.y + 'px' }"/>
    </div>
    <svg v-if="collageEditHelper" :style="svgStyle">
        <template v-for="trace in montage.traces">
            <rendered-montage-trace
                :collage-edit-helper="collageEditHelper"
                :collage-view-helper="collageViewHelper"
                :montage="montage"
                :montage-frame="montageFrame"
                :metadata="{}"
                :trace="trace"
                :transform="svgTransform"
            ></rendered-montage-trace>
        </template>
        <!-- Base -->
        <rect
            :transform="svgTransform"
            :x="bodyFrontRectRelative.x"
            :y="bodyFrontRectRelative.y + body.height - body.depth"
            :width="body.width"
            :height="body.depth"
            stroke="red"
            stroke-width="2"
            stroke-dasharray="2,1"
            fill="none"
        />
        <!-- Front -->
        <rect
            :transform="svgTransform"
            style="pointer-events: initial; cursor: grab;"
            @mousedown.left="trackBody"
            @dblclick="editBody"
            :x="bodyFrontRectRelative.x"
            :y="bodyFrontRectRelative.y"
            :width="bodyFrontRectRelative.width"
            :height="bodyFrontRectRelative.height"
            fill="url(#diagonal-hatch)"
            stroke="red"
            stroke-width="2"
            stroke-dasharray="2,1"
        />
        <!-- Top -->
        <rect
            :transform="svgTransform"
            style="pointer-events: initial; cursor: grab;"
            @mousedown.left="trackBody"
            @dblclick="editBody"
            :x="bodyFrontRectRelative.x"
            :y="bodyFrontRectRelative.y - body.depth"
            :width="body.width"
            :height="body.depth"
            fill="url(#diagonal-hatch)"
            stroke="red"
            stroke-width="2"
            stroke-dasharray="2,1"
        />
    </svg>
</div>
        `
    })
}
