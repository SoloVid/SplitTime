namespace splitTime.editor.level {
    interface VueRenderedProp {
        // props
        levelEditorShared: LevelEditorShared
        prop: Prop
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
    
    function styleObject(this: VueRenderedProp): object {
        return {
            outline: this.prop.metadata.highlighted ? "2px solid yellow" : "",
            backgroundColor: this.prop.metadata.highlighted ? "yellow" : "initial",
            position: 'absolute',
            overflow: 'hidden',
            left: this.positionLeft + 'px',
            top: this.positionTop + 'px',
            width: this.width + 'px',
            height: this.height + 'px'
        }
    }

    function body(this: VueRenderedProp): splitTime.Body {
        return loadBodyFromTemplate(this.prop.obj.template)
    }
    function positionLeft(this: VueRenderedProp): number {
        return this.prop.obj.x - this.crop.width/2 - this.spriteOffset.x
    }
    function positionTop(this: VueRenderedProp): number {
        return this.prop.obj.y - this.prop.obj.z - this.crop.height + this.body.baseLength/2 - this.spriteOffset.y
    }
    function width(this: VueRenderedProp): number {
        return this.crop.width
    }
    function height(this: VueRenderedProp): number {
        return this.crop.height
    }
    function crop(this: VueRenderedProp): math.Rect {
        return getAnimationFrameCrop(this.body, this.prop.obj.dir, this.prop.obj.stance)
    }
    function spriteOffset(this: VueRenderedProp): Coordinates2D {
        return getSpriteOffset(this.body)
    }

    function imgSrc(this: VueRenderedProp): PromiseLike<string> {
        return getBodyImage(this.body, this.levelEditorShared.server)
    }

    function track(this: VueRenderedProp): void {
        if(this.levelEditorShared.shouldDragBePrevented()) {
            return
        }
        this.levelEditorShared.follow({
            shift: (dx, dy) => {
                this.prop.obj.x += dx
                this.prop.obj.y += dy
            }
        })
        this.levelEditorShared.propertiesPaneStuff = getPropPropertiesStuff(this.prop)
    }
    function toggleHighlight(this: VueRenderedProp, highlight: boolean): void {
        if(this.levelEditorShared.shouldDragBePrevented()) {
            this.prop.metadata.highlighted = false
            return
        }
        this.prop.metadata.highlighted = highlight
    }
    
    Vue.component("rendered-prop", {
        props: {
            levelEditorShared: Object,
            prop: Object
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
    v-show="prop.metadata.displayed"
    class="draggable prop"
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
