namespace splitTime.editor.level {

    const NOT_READY = "NOT_READY"
    const NOT_AVAILABLE = "NOT_AVAILABLE"

    /** Shared component for either prop or position */
    interface VueRenderedProposition {
        // props
        levelEditorShared: LevelEditorShared
        p: Prop | Position
        // computed
        body: file.collage.BodySpec
        collage: Collage | typeof NOT_READY | typeof NOT_AVAILABLE
        frame: splitTime.collage.Frame
        framePosition: Coordinates2D
        imgSrc: string
        montage: splitTime.collage.Montage
        positionLeft: int
        positionTop: int
        styleObject: object
        // methods
        toggleHighlight(highlight: boolean): void
        track(): void
    }
    
    function body(this: VueRenderedProposition): file.collage.BodySpec {
        return this.montage.bodySpec
    }

    function frame(this: VueRenderedProposition): splitTime.collage.Frame {
        return this.montage.getFrameAt(this.levelEditorShared.time)
    }

    function framePosition(this: VueRenderedProposition): Coordinates2D {
        const box = this.frame.getTargetBox(this.body)
        box.x += this.p.obj.x
        box.y += this.p.obj.y - this.p.obj.z
        return box
    }

    function montage(this: VueRenderedProposition): splitTime.collage.Montage {
        const tempFrame = new splitTime.collage.Frame(
            math.Rect.make(0, 0, PLACEHOLDER_WIDTH, PLACEHOLDER_WIDTH),
            new Coordinates2D(),
            1
        )
        const tempBodySpec: file.collage.BodySpec = {
            width: 32,
            depth: 32,
            height: 32
        }
        const tempMontage = new splitTime.collage.Montage("", null, [tempFrame], tempBodySpec, [], "", 0)
        if (this.collage === NOT_READY || this.collage == NOT_AVAILABLE) {
            return tempMontage
        }
        try {
            if (this.p.obj.montage === "") {
                return this.collage.getDefaultMontage(this.p.obj.dir)
            }
            return this.collage.getMontage(this.p.obj.montage, this.p.obj.dir)
        } catch (e: unknown) {
            return tempMontage
        }
    }

    function positionLeft(this: VueRenderedProposition): number {
        return this.framePosition.x
    }
    function positionTop(this: VueRenderedProposition): number {
        return this.framePosition.y
    }

    function styleObject(this: VueRenderedProposition): object {
        const level = this.levelEditorShared.level
        return {
            outline: this.p.metadata.highlighted ? "2px solid yellow" : "",
            backgroundColor: this.p.metadata.highlighted ? "yellow" : "initial",
            position: 'absolute',
            overflow: 'hidden',
            left: this.positionLeft + 'px',
            top: this.positionTop + 'px',
            width: this.frame.box.width + 'px',
            height: this.frame.box.height + 'px',
            "pointer-events": inGroup(level, this.levelEditorShared.activeGroup, this.p.obj) ? "initial" : "none"
        }
    }

    function collage(this: VueRenderedProposition): Collage | typeof NOT_READY | typeof NOT_AVAILABLE {
        if (this.p.obj.collage === "") {
            return NOT_AVAILABLE
        }
        try {
            const c = this.levelEditorShared.collageManager.getRealCollage(this.p.obj.collage)
            return c || NOT_READY
        } catch (e: unknown) {
            return NOT_AVAILABLE
        }
    }

    function imgSrc(this: VueRenderedProposition): string {
        const c = this.collage
        if (c === NOT_READY) {
            return ""
        }
        if (c === NOT_AVAILABLE) {
            return getPlaceholderImage()
        }
        return this.levelEditorShared.server.imgSrc(c.image)
    }

    function toggleHighlight(this: VueRenderedProposition, highlight: boolean): void {
        if(this.levelEditorShared.shouldDragBePrevented()) {
            this.p.metadata.highlighted = false
            return
        }
        this.p.metadata.highlighted = highlight
    }

    function track(this: VueRenderedProposition): void {
        if(this.levelEditorShared.shouldDragBePrevented()) {
            return
        }
        const x = this.p.obj.x
        const y = this.p.obj.y
        const snappedMover = createSnapMontageMover(this.levelEditorShared.gridCell, this.montage.bodySpec, this.p.obj)
        this.levelEditorShared.follow({
            shift: (dx, dy) => {
                snappedMover.applyDelta(dx, dy)
                const snappedDelta = snappedMover.getSnappedDelta()
                this.p.obj.x = x + snappedDelta.x
                this.p.obj.y = y + snappedDelta.y
            }
        })
        const p = this.p
        if (p.type === "prop") {
            this.levelEditorShared.editProperties(getPropPropertiesStuff(this.levelEditorShared.level, p.obj))
        } else {
            this.levelEditorShared.editProperties(getPositionPropertiesStuff(this.levelEditorShared.level, p.obj))
        }
    }

    Vue.component("rendered-proposition", {
        props: {
            levelEditorShared: Object,
            p: Object
        },
        computed: {
            body,
            collage,
            frame,
            framePosition,
            imgSrc,
            montage,
            positionLeft,
            positionTop,
            styleObject
        },
        asyncComputed: {
        },
        methods: {
            toggleHighlight,
            track
        },
        template: `
<div
    v-show="p.metadata.displayed"
    class="draggable"
    @dblclick.prevent
    @mousedown.left="track"
    @mousemove="toggleHighlight(true)"
    @mouseleave="toggleHighlight(false)"
    :style="styleObject"
>
    <img :src="imgSrc" :style="{ position: 'absolute', left: -frame.box.x + 'px', top: -frame.box.y + 'px' }"/>
</div>
        `
    })
}
