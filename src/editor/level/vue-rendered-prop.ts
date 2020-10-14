namespace splitTime.editor.level {
    export interface RenderedProp {
        prop: Prop
        body: Body
        styleObject: object
        imgSrc: string
        positionLeft: int
        positionTop: int
        width: int
        height: int
        crop: math.Rect
        spriteOffset: Coordinates2D
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
        return loadBodyFromTemplate(this.prop.obj.template);
    }
    function imgSrc(this: RenderedProp): string {
        return getBodyImage(this.body);
    }
    function positionLeft(this: RenderedProp): number {
        return this.prop.obj.x - this.crop.width/2 - this.spriteOffset.x;
    }
    function positionTop(this: RenderedProp): number {
        return this.prop.obj.y - this.prop.obj.z - this.crop.height + this.body.baseLength/2 - this.spriteOffset.y;
    }
    function width(this: RenderedProp): number {
        return this.crop.width;
    }
    function height(this: RenderedProp): number {
        return this.crop.height;
    }
    function crop(this: RenderedProp): math.Rect {
        return getAnimationFrameCrop(this.body, this.prop.obj.dir, this.prop.obj.stance);
    }
    function spriteOffset(this: RenderedProp): Coordinates2D {
        return getSpriteOffset(this.body);
    }
    
    function edit(this: RenderedProp): void {
        showEditorProp(this.prop);
    }
    function track(this: RenderedProp): void {
        if(pathInProgress) {
            return;
        }
        follower = { obj: this.prop, point: null };
    }
    function toggleHighlight(this: RenderedProp, highlight: boolean): void {
        if(mouseDown || pathInProgress) {
            return;
        }
        this.prop.metadata.highlighted = highlight;
    }
    
    Vue.component("rendered-prop", {
        props: {
            prop: Object
        },
        template: `
<div
    v-show="prop.metadata.displayed"
    class="draggable prop"
    v-on:dblclick="edit"
    v-on:mousedown.left="track"
    v-on:mouseenter="toggleHighlight(true)"
    v-on:mouseleave="toggleHighlight(false)"
    v-bind:style="styleObject"
>
    <img v-bind:src="imgSrc" v-bind:style="{ position: 'absolute', left: -crop.x + 'px', top: -crop.y + 'px' }"/>
</div>
        `,
        computed: {
            styleObject,
            body,
            imgSrc,
            positionLeft,
            positionTop,
            width,
            height,
            crop,
            spriteOffset
        },
        methods: {
            edit,
            track,
            toggleHighlight
        }
    })
}
