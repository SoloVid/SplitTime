namespace splitTime.editor.level {
    interface VueRenderedPosition {
        // props
        levelEditorShared: LevelEditorShared
        position: Position
        // computed
        styleObject: object
        body: Body
        positionLeft: int
        positionTop: int
        width: int
        height: int
        crop: math.Rect
        spriteOffset: Coordinates2D
        // asyncComputed
        imgSrc: string
        // methods
        track(): void
        toggleHighlight(highlight: boolean): void
    }

    function styleObject(this: VueRenderedPosition): object {
        return {
            outline: this.position.metadata.highlighted ? "2px solid yellow" : "",
            backgroundColor: this.position.metadata.highlighted ? "yellow" : "initial",
            position: 'absolute',
            overflow: 'hidden',
            left: this.positionLeft + 'px',
            top: this.positionTop + 'px',
            width: this.width + 'px',
            height: this.height + 'px'
        }
    }

    function body(this: VueRenderedPosition): splitTime.Body {
        return loadBodyFromTemplate(this.position.obj.template)
    }
    function positionLeft(this: VueRenderedPosition): number {
        return this.position.obj.x - this.crop.width/2 - this.spriteOffset.x
    }
    function positionTop(this: VueRenderedPosition): number {
        return this.position.obj.y - this.position.obj.z - this.crop.height + this.body.baseLength/2 - this.spriteOffset.y
    }
    function width(this: VueRenderedPosition): number {
        return this.crop.width
    }
    function height(this: VueRenderedPosition): number {
        return this.crop.height
    }
    function crop(this: VueRenderedPosition): math.Rect {
        return getAnimationFrameCrop(this.body, this.position.obj.dir, this.position.obj.stance)
    }
    function spriteOffset(this: VueRenderedPosition): Coordinates2D {
        return getSpriteOffset(this.body)
    }

    function imgSrc(this: VueRenderedPosition): PromiseLike<string> {
        return getBodyImage(this.body, this.levelEditorShared.server)
    }

    function track(this: VueRenderedPosition) {
        if(this.levelEditorShared.shouldDragBePrevented()) {
            return
        }
        this.levelEditorShared.follow({
            shift: (dx, dy) => {
                this.position.obj.x += dx
                this.position.obj.y += dy
            }
        })
        this.levelEditorShared.propertiesPaneStuff = getPositionPropertiesStuff(this.position)
    }
    function toggleHighlight(this: VueRenderedPosition, highlight: boolean) {
        if(this.levelEditorShared.shouldDragBePrevented()) {
            this.position.metadata.highlighted = false
            return
        }
        this.position.metadata.highlighted = highlight
    }


    Vue.component("rendered-position", {
        props: {
            levelEditorShared: Object,
            position: Object
        },
        computed: {
            styleObject,
            body,
            positionLeft,
            positionTop,
            width,
            height,
            crop,
            spriteOffset
        },
        asyncComputed: {
            imgSrc
        },
        methods: {
            track,
            toggleHighlight
        },
        template: `
<div
    v-show="position.metadata.displayed"
    class="draggable position"
    v-on:dblclick.prevent
    v-on:mousedown.left="track"
    v-on:mouseenter="toggleHighlight(true)"
    v-on:mouseleave="toggleHighlight(false)"
    :style="styleObject"
>
    <img :src="imgSrc" :style="{ position: 'absolute', left: -crop.x + 'px', top: -crop.y + 'px' }"/>
</div>
        `
    })
}