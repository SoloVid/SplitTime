Vue.component("rendered-position", {
    props: ["position"],
    template: "#rendered-position-template",
    computed: {
        styleObject: function() {
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
        },
        body: function() {
            return loadBodyFromTemplate(this.position.template);
        },
        imgSrc: function() {
            return getBodyImage(this.body);
        },
        positionLeft: function() {
            // console.log(this.position);
            // console.log(this.body);
            return this.position.x - this.crop.xres/2 - this.spriteOffset.x;
        },
        positionTop: function() {
            return this.position.y - this.position.z - this.crop.yres + this.body.baseLength/2 - this.spriteOffset.y;
        },
        width: function() {
            return this.crop.xres;
        },
        height: function() {
            return this.crop.yres;
        },
        crop: function() {
            return getAnimationFrameCrop(this.body, this.position.dir, this.position.stance);
        },
        spriteOffset: function() {
            return getSpriteOffset(this.body);
        }
    },
    methods: {
        edit: function() {
            showEditorPosition(this.position);
        },
        track: function() {
            if(pathInProgress) {
                return;
            }
            follower = this.position;
        },
        toggleHighlight: function(highlight) {
            if(mouseDown || pathInProgress) {
                return;
            }
            this.position.isHighlighted = highlight;
        }
    }
});
