namespace splitTime.editor.level {
    interface RenderedProp {
        // props
        levelEditorShared: LevelEditorShared
        prop: Prop
        // computed
        body: Body
        styleObject: object
        positionLeft: int
        positionTop: int
        width: int
        height: int
        crop: math.Rect
        spriteOffset: Coordinates2D
        // asyncComputed
        imgSrc: string
        // methods
        edit(): void
        track(): void
        toggleHighlight(highlight: boolean): void
    }
    
    function styleObject(this: RenderedProp): object {
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
    
    function body(this: RenderedProp): splitTime.Body {
        return loadBodyFromTemplate(this.prop.obj.template)
    }
    function positionLeft(this: RenderedProp): number {
        return this.prop.obj.x - this.crop.width/2 - this.spriteOffset.x
    }
    function positionTop(this: RenderedProp): number {
        return this.prop.obj.y - this.prop.obj.z - this.crop.height + this.body.baseLength/2 - this.spriteOffset.y
    }
    function width(this: RenderedProp): number {
        return this.crop.width
    }
    function height(this: RenderedProp): number {
        return this.crop.height
    }
    function crop(this: RenderedProp): math.Rect {
        return getAnimationFrameCrop(this.body, this.prop.obj.dir, this.prop.obj.stance)
    }
    function spriteOffset(this: RenderedProp): Coordinates2D {
        return getSpriteOffset(this.body)
    }

    function imgSrc(this: RenderedProp): PromiseLike<string> {
        return getBodyImage(this.body, this.levelEditorShared.server)
    }

    function edit(this: RenderedProp): void {
        this.levelEditorShared.propertiesPaneStuff = getPropPropertiesStuff(this.prop)
    }
    function track(this: RenderedProp): void {
        if(this.levelEditorShared.shouldDragBePrevented()) {
            return
        }
        this.levelEditorShared.follow({
            shift: (dx, dy) => {
                this.prop.obj.x += dx
                this.prop.obj.y += dy
            }
        })
    }
    function toggleHighlight(this: RenderedProp, highlight: boolean): void {
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
            edit,
            track,
            toggleHighlight
        },
        template: `
<div
    v-show="prop.metadata.displayed"
    class="draggable prop"
    v-on:dblclick.prevent="edit"
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
