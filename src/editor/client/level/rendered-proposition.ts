namespace splitTime.editor.level {
    /** Shared component for either prop or position */
    interface VueRenderedProposition {
        // props
        cssClass: string | { [className: string]: boolean }
        levelEditorShared: LevelEditorShared
        p: Prop | Position
        // computed
        body: file.collage.BodySpec
        combinedCssClass: (string | { [className: string]: boolean })[]
        frame: splitTime.collage.Frame
        framePosition: Coordinates2D
        imgSrc: string
        montage: splitTime.collage.Montage
        positionLeft: int
        positionTop: int
        styleObject: object
        // asyncComputed
        collage: Collage
        // methods
        toggleHighlight(highlight: boolean): void
        track(): void
    }
    
    function body(this: VueRenderedProposition): file.collage.BodySpec {
        return this.montage.bodySpec
    }

    function combinedCssClass(this: VueRenderedProposition): (string | { [className: string]: boolean })[] {
        return ["draggable", this.cssClass]
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

    function imgSrc(this: VueRenderedProposition): string {
        if (this.p.obj.collage === "") {
            return getPlaceholderImage()
        }
        return this.collage.image
    }

    function montage(this: VueRenderedProposition): splitTime.collage.Montage {
        if (this.p.obj.montage === "") {
            return this.collage.getDefaultMontage(this.p.obj.dir)
        }
        return this.collage.getMontage(this.p.obj.montage, this.p.obj.dir)
    }

    function positionLeft(this: VueRenderedProposition): number {
        return this.framePosition.x
    }
    function positionTop(this: VueRenderedProposition): number {
        return this.framePosition.y
    }

    function styleObject(this: VueRenderedProposition): object {
        return {
            outline: this.p.metadata.highlighted ? "2px solid yellow" : "",
            backgroundColor: this.p.metadata.highlighted ? "yellow" : "initial",
            position: 'absolute',
            overflow: 'hidden',
            left: this.positionLeft + 'px',
            top: this.positionTop + 'px',
            width: this.frame.box.width + 'px',
            height: this.frame.box.height + 'px'
        }
    }

    async function collage(this: VueRenderedProposition): Promise<Collage> {
        const s = this.levelEditorShared.server
        const collageJson = await s.api.collageJson.fetch(s.withProject({ collageId: this.p.obj.collage }))
        return splitTime.collage.makeCollageFromFile(collageJson)
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
        const bodySpec = this.montage.bodySpec
        const left = x - bodySpec.width / 2
        const right = left + bodySpec.width
        const top = y - bodySpec.depth / 2
        const bottom = top + bodySpec.depth
        const originalPoints = [
            new Coordinates2D(left, top),
            new Coordinates2D(right, top),
            new Coordinates2D(left, bottom),
            new Coordinates2D(right, bottom)
        ]
        const snappedMover = new client.GridSnapMover(this.levelEditorShared.gridCell, originalPoints)
        this.levelEditorShared.follow({
            shift: (dx, dy) => {
                snappedMover.applyDelta(dx, dy)
                const snappedDelta = snappedMover.getSnappedDelta()
                this.p.obj.x = x + snappedDelta.x
                this.p.obj.y = y + snappedDelta.y
            }
        })
        const obj = this.p.obj
        if ("playerOcclusionFadeFactor" in obj) {
            this.levelEditorShared.propertiesPaneStuff = getPropPropertiesStuff(obj)
        } else {
            this.levelEditorShared.propertiesPaneStuff = getPositionPropertiesStuff(obj)
        }
    }

    Vue.component("rendered-proposition", {
        props: {
            cssClass: Object,
            levelEditorShared: Object,
            p: Object
        },
        computed: {
            body,
            combinedCssClass,
            frame,
            framePosition,
            imgSrc,
            montage,
            positionLeft,
            positionTop,
            styleObject
        },
        asyncComputed: {
            collage: {
                get: collage,
                // TODO: better default
                default: {}
            }
        },
        methods: {
            toggleHighlight,
            track
        },
        template: `
<div
    v-show="prop.metadata.displayed"
    :class="cssClassCombined"
    v-on:dblclick.prevent
    v-on:mousedown.left="track"
    v-on:mouseenter="toggleHighlight(true)"
    v-on:mouseleave="toggleHighlight(false)"
    :style="styleObject"
>
    <img :src="imgSrc" :style="{ position: 'absolute', left: -frame.box.x + 'px', top: -frame.box.y + 'px' }"/>
</div>
        `
    })
}
