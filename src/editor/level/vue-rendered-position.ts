namespace splitTime.editor.level {
    export interface VueRenderedPosition {
        position: any
        styleObject: any
        body: any
        imgSrc: any
        positionLeft: any
        positionTop: any
        width: any
        height: any
        crop: any
        spriteOffset: any
        edit(): any
        track(): any
        toggleHighlight(highlight: boolean): any
    }

    function styleObject(this: VueRenderedPosition): any {
        return {
            outline: this.position.isHighlighted ? "2px solid yellow" : "",
            backgroundColor: this.position.isHighlighted ? "yellow" : "initial",
            position: 'absolute',
            overflow: 'hidden',
            left: this.positionLeft + 'px',
            top: this.positionTop + 'px',
            width: this.width + 'px',
            height: this.height + 'px'
        };
    }
    function body(this: VueRenderedPosition): any {
        return loadBodyFromTemplate(this.position.template);
    }
    function imgSrc(this: VueRenderedPosition): any {
        return getBodyImage(this.body);
    }
    function positionLeft(this: VueRenderedPosition): any {
        // console.log(this.position);
        // console.log(this.body);
        return this.position.x - this.crop.xres/2 - this.spriteOffset.x;
    }
    function positionTop(this: VueRenderedPosition): any {
        return this.position.y - this.position.z - this.crop.yres + this.body.baseLength/2 - this.spriteOffset.y;
    }
    function width(this: VueRenderedPosition): any {
        return this.crop.xres;
    }
    function height(this: VueRenderedPosition): any {
        return this.crop.yres;
    }
    function crop(this: VueRenderedPosition): any {
        return getAnimationFrameCrop(this.body, this.position.dir, this.position.stance);
    }
    function spriteOffset(this: VueRenderedPosition): any {
        return getSpriteOffset(this.body);
    }

    function edit(this: VueRenderedPosition) {
        showEditorPosition(this.position);
    }
    function track(this: VueRenderedPosition) {
        if(pathInProgress) {
            return;
        }
        follower = this.position;
    }
    function toggleHighlight(this: VueRenderedPosition, highlight: boolean) {
        if(mouseDown || pathInProgress) {
            return;
        }
        this.position.isHighlighted = highlight;
    }


    Vue.component("rendered-position", {
        props: {
            position: Object
        },
        template: `
    <div
        v-show="position.displayed"
        class="draggable position"
        v-on:dblclick="edit"
        v-on:mousedown.left="track"
        v-on:mouseenter="toggleHighlight(true)"
        v-on:mouseleave="toggleHighlight(false)"
        v-bind:style="styleObject"
    >
        <img v-bind:src="imgSrc" v-bind:style="{ position: 'absolute', left: -crop.sx + 'px', top: -crop.sy + 'px' }"/>
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