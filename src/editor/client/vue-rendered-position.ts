namespace splitTime.editor.level {
    export interface VueRenderedPosition {
        position: Position
        styleObject: object
        body: splitTime.Body
        imgSrc: string
        positionLeft: number
        positionTop: number
        width: number
        height: number
        crop: math.Rect
        spriteOffset: Coordinates2D
        edit(): void
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
        };
    }
    function body(this: VueRenderedPosition): splitTime.Body {
        return loadBodyFromTemplate(this.position.obj.template);
    }
    function imgSrc(this: VueRenderedPosition): string {
        return getBodyImage(this.body);
    }
    function positionLeft(this: VueRenderedPosition): number {
        // console.log(this.position);
        // console.log(this.body);
        return this.position.obj.x - this.crop.width/2 - this.spriteOffset.x;
    }
    function positionTop(this: VueRenderedPosition): number {
        return this.position.obj.y - this.position.obj.z - this.crop.height + this.body.baseLength/2 - this.spriteOffset.y;
    }
    function width(this: VueRenderedPosition): number {
        return this.crop.width;
    }
    function height(this: VueRenderedPosition): number {
        return this.crop.height;
    }
    function crop(this: VueRenderedPosition): math.Rect {
        return getAnimationFrameCrop(this.body, this.position.obj.dir, this.position.obj.stance);
    }
    function spriteOffset(this: VueRenderedPosition): Coordinates2D {
        return getSpriteOffset(this.body);
    }

    function edit(this: VueRenderedPosition) {
        showEditorPosition(this.position);
    }
    function track(this: VueRenderedPosition) {
        if(pathInProgress) {
            return;
        }
        follower = { obj: this.position, point: null };
    }
    function toggleHighlight(this: VueRenderedPosition, highlight: boolean) {
        if(mouseDown || pathInProgress) {
            return;
        }
        this.position.metadata.highlighted = highlight;
    }


    Vue.component("rendered-position", {
        props: {
            position: Object
        },
        template: `
<div
    v-show="position.metadata.displayed"
    class="draggable position"
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
    });
}