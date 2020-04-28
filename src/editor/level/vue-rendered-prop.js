Vue.component("rendered-prop", {
    props: ["prop"],
    template: "#rendered-prop-template",
    computed: {
        styleObject: function() {
            return {
                outline: this.prop.isHighlighted ? "2px solid yellow" : "",
                backgroundColor: this.prop.isHighlighted ? "yellow" : "initial",
                position: 'absolute',
                overflow: 'hidden',
                left: this.positionLeft + 'px',
                top: this.positionTop + 'px',
                width: this.width + 'px',
                height: this.height + 'px'
            };
        },
    	body: function() {
    		return loadBodyFromTemplate(this.prop.template);
		},
    	imgSrc: function() {
            return getBodyImage(this.body);
		},
    	positionLeft: function() {
            return this.prop.x - this.crop.xres/2 - this.spriteOffset.x;
		},
		positionTop: function() {
            return this.prop.y - this.prop.z - this.crop.yres + this.body.baseLength/2 - this.spriteOffset.y;
		},
		width: function() {
			return this.crop.xres;
		},
		height: function() {
			return this.crop.yres;
		},
		crop: function() {
            return getAnimationFrameCrop(this.body, this.prop.dir, this.prop.stance);
        },
        spriteOffset: function() {
            return getSpriteOffset(this.body);
        }
	},
    methods: {
        edit: function() {
            showEditorProp(this.prop);
        },
        track: function() {
            if(pathInProgress) {
                return;
            }
            follower = this.prop;
        },
        toggleHighlight: function(highlight) {
            if(mouseDown || pathInProgress) {
                return;
            }
            this.prop.isHighlighted = highlight;
        }
    }
});
