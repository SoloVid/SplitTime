
// declare function loadBodyFromTemplate(templateName: string): splitTime.Body

// declare function getBodyImage(body: splitTime.Body): string

// declare function getAnimationFrameCrop(body: splitTime.Body, dir: string | splitTime.direction_t, stance: string): unknown

// declare function getSpriteOffset(body: splitTime.Body): splitTime.Coordinates2D

// declare function showEditorProp(prop: any): void

// declare let pathInProgress: boolean
// declare let mouseDown: boolean
// declare let follower: any

namespace splitTime.editor.level {
    export interface RenderedProp {
        prop: any
        body: Body
        styleObject: string
        imgSrc: string
        positionLeft: int
        positionTop: int
        width: int
        height: int
        crop: any
        spriteOffset: any
        edit(): void
        track(): void
        toggleHighlight(highlight: boolean): void
    }

    // export class Prop {
    //     isHighlighted: boolean = false
    // }

    namespace renderedProp {
        function styleObject(this: RenderedProp) {
            return {
                outline: this.prop.isHighlighted ? "2px solid yellow" : "",
                backgroundColor: this.prop.isHighlighted ? "yellow" : "initial",
                position: 'absolute',
                overflow: 'hidden',
                left: this.positionLeft + 'px',
                top: this.positionTop + 'px',
                width: this.width + 'px',
                height: this.height + 'px'
            }
        }
        
        function body(this: RenderedProp) {
            return loadBodyFromTemplate(this.prop.template);
        }
        function imgSrc(this: RenderedProp) {
            return getBodyImage(this.body);
        }
        function positionLeft(this: RenderedProp) {
            return this.prop.x - this.crop.xres/2 - this.spriteOffset.x;
        }
        function positionTop(this: RenderedProp) {
            return this.prop.y - this.prop.z - this.crop.yres + this.body.baseLength/2 - this.spriteOffset.y;
        }
        function width(this: RenderedProp) {
            return this.crop.xres;
        }
        function height(this: RenderedProp) {
            return this.crop.yres;
        }
        function crop(this: RenderedProp) {
            return getAnimationFrameCrop(this.body, this.prop.dir, this.prop.stance);
        }
        function spriteOffset(this: RenderedProp) {
            return getSpriteOffset(this.body);
        }

        function edit(this: RenderedProp): void {
            showEditorProp(this.prop);
        }
        function track(this: RenderedProp): void {
            if(pathInProgress) {
                return;
            }
            follower = this.prop;
        }
        function toggleHighlight(this: RenderedProp, highlight: boolean): void {
            if(mouseDown || pathInProgress) {
                return;
            }
            this.prop.isHighlighted = highlight;
        }

        Vue.component("rendered-prop", {
            props: {
                prop: Object
            },
            template: `
                <div
                    v-show="prop.displayed"
                    class="draggable prop"
                    v-on:dblclick="edit"
                    v-on:mousedown.left="track"
                    v-on:mouseenter="toggleHighlight(true)"
                    v-on:mouseleave="toggleHighlight(false)"
                    v-bind:style="styleObject"
                >
                    <img v-bind:src="imgSrc" v-bind:style="{ position: 'absolute', left: -crop.sx + 'px', top: -crop.sy + 'px' }"/>
                </div>
            `,
            // computed: {
            //     styleObject: styleObject,
            //     body: body,
            //     imgSrc: imgSrc,
            //     positionLeft: positionLeft,
            //     positionTop: positionTop,
            //     width: width,
            //     height: height,
            //     crop: crop,
            //     spriteOffset: spriteOffset
            // },
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

    // function loadBodyFromTemplate(templateName: string) {
    //     try {
    //         return G.BODY_TEMPLATES.getInstance(templateName);
    //     } catch(e) {
    //         return new splitTime.Body();
    //     }
    // }
    
    // function getBodyImage(body: Body) {
    //     if(body.drawable instanceof splitTime.Sprite) {
    //         return imgSrc(body.drawable.img);
    //     }
    //     return subImg;
    // }
    
    // function getAnimationFrameCrop(body: Body, dir: string | direction_t, stance: string) {
    //     if(body.drawable instanceof splitTime.Sprite) {
    //         return body.drawable.getAnimationFrameCrop(splitTime.direction.interpret(dir), stance, 0);
    //     }
    //     // FTODO: more solid default
    //     return {
    //         xres: 32,
    //         yres: 64,
    //         sx: 0,
    //         sy: 0
    //     };
    // }
    
    // function getSpriteOffset(body: Body) {
    //     if(body.drawable instanceof splitTime.Sprite) {
    //         return {
    //             x: body.drawable.baseOffX,
    //             y: body.drawable.baseOffY
    //         };
    //     }
    //     return { x: 0, y: 0 };
    // }
}
