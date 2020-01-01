namespace SplitTime {
    export class Sprite implements SplitTime.body.Drawable {
        img: string;
        _timeMs: number;
        _frameSignaler: IntervalStabilizer;
        ref: string;
        constructor(img: string) {
            this.img = img;
            this._timeMs = 0;
            var that = this;
            /**
            * @type {Signaler}
            * @private
            */
            this._frameSignaler = new SplitTime.IntervalStabilizer(200, 1, function() {
                return that._timeMs;
            });
        };
        
        static DEFAULT_STANCE = "default";
        
        xres = 32;
        yres = 64;
        
        baseOffX = 0;
        baseOffY = 0;
        
        omniDir = false;
        rotate = 0;
        
        opacity = 1;
        playerOcclusionFadeFactor = 0;
        stance = SplitTime.Sprite.DEFAULT_STANCE;
        requestedStance = SplitTime.Sprite.DEFAULT_STANCE;
        requestedFrameReset = false;
        frame = 0;
        dir = SplitTime.Direction.S;
        requestedDir = SplitTime.Direction.S;
        
        stances = {
            "default": {
                "S": 0,
                "N": 1,
                "E": 2,
                "W": 3,
            }
        };
        
        getImage() {
            return SplitTime.image.get(this.img);
        };
        
        getCanvasRequirements(x, y, z) {
            return new SplitTime.body.CanvasRequirements(Math.round(x), Math.round(y), Math.round(z), this.xres, this.yres);
        };
        
        defaultStance() {
            this.requestStance(SplitTime.Sprite.DEFAULT_STANCE, this.dir, true);
        };
        
        /**
        * @param {CanvasRenderingContext2D} ctx
        */
        draw(ctx) {
            // if(!this.canSee) {return;}
            
            ctx.rotate(this.rotate);
            
            //SplitTime.onBoard.bodies is displayed partially transparent depending on health (<= 50% transparent)
            //ctx.globalAlpha = (this.hp + this.strg)/(2*this.strg);
            
            this._drawSimple(ctx);
            
            // this.seeAction();
            // this.seeStatus();
            
            //ctx.rotate(-this.rotate);
            
            this.rotate = 0;
        };
        
        /**
        * @param {CanvasRenderingContext2D} ctx
        */
        _drawSimple(ctx) {
            // var
            //     // Radii of the white glow.
            //     innerRadius = 2,
            //     outerRadius = 16,
            //     // Radius of the entire circle.
            //     radius = 16;
            //
            // var gradient = ctx.createRadialGradient(0, 0, innerRadius, 0, 0, outerRadius);
            // gradient.addColorStop(0, 'rgba(0, 0, 0, .7)');
            // gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            //
            // ctx.scale(1, 0.5);
            //
            // ctx.beginPath();
            // ctx.arc(0, 0, radius, 0, 2 * Math.PI);
            //
            // ctx.fillStyle = gradient;
            // ctx.fill();
            //
            // ctx.scale(1, 2);
            // // ctx.restore();
            // // ctx.setTransform(1, 0, 0, 1, 0, 0);
            
            var tImg = this.getImage();
            
            var crop = this.getAnimationFrameCrop(this.dir, this.stance, this.frame);
            var x = -Math.round(crop.xres/2) - this.baseOffX;
            var y = -crop.yres - this.baseOffY;
            
            ctx.globalAlpha = ctx.globalAlpha * this.opacity;
            
            ctx.drawImage(tImg, crop.sx, crop.sy, crop.xres, crop.yres, x, y, crop.xres, crop.yres);
        };
        
        getAnimationFrameCrop(numDir, stance, frame) {
            var crop = {
                xres: this.xres,
                yres: this.yres,
                sx: 0,
                sy: this.yres*frame
            };
            
            var column = 0;
            var dir = SplitTime.Direction.toString(numDir);
            var simpleDir = SplitTime.Direction.simplifyToCardinal(dir);
            
            //Allow for non-complicated spritesheets with one column
            if(!this.stances) {
                return crop;
            }
            
            if(!stance || !(stance in this.stances)) {
                stance = "default";
            }
            
            var dirMap = this.stances[stance];
            if(!(dirMap instanceof Object)) {
                column = this.stances[stance];
            } else {
                //If shorten intermediate directions to cardinal if they are not specified
                if(dir in dirMap) {
                    column = dirMap[dir];
                } else if(simpleDir in dirMap) {
                    column = dirMap[simpleDir];
                } else {
                    console.warn("Stance " + stance + " missing direction " + dir);
                    column = 0;
                }
            }
            
            crop.sx = this.xres*column;
            return crop;
        };
        
        // TODO: abstract this?
        hasIdleAnimation = false;
        finalizeFrame() {
            if(isNaN(this.frame) || this.hasIdleAnimation && this.stance != this.requestedStance || this.requestedFrameReset) {
                this.frame = 0;
            } else {
                //TODO: don't rely on global time passing since we might skip frames at some point
                //i.e. ^^ instantiate a Stabilizer rather than using static method
                //Only update on frame tick
                if(this._frameSignaler.isSignaling()) {
                    var mod = this.getAnimationFramesAvailable();
                    if(!isNaN(mod) && mod > 0) {
                        this.frame++;
                        this.frame %= mod;
                    }
                }
            }
        };
        
        getAnimationFramesAvailable() {
            var calculation = Math.floor(this.getImage().height / this.yres);
            if(isNaN(calculation)) {
                if(SplitTime.debug.ENABLED) {
                    console.warn(this.img + " not loaded yet for frame count calculation for " + this.ref);
                }
                return 1;
            } else {
                return calculation;
            }
        };
        
        finalizeStance() {
            //Allow for non-complicated sprite sheets with one column
            if(!this.stances) {
                return;
            }
            
            if(!this.requestedStance || !(this.requestedStance in this.stances)) {
                this.requestedStance = "default";
            }
            this.stance = this.requestedStance;
            this.dir = this.requestedDir;
        };
        
        requestStance(stance, dir, forceReset) {
            this.requestedStance = stance;
            this.requestedDir = dir;
            this.requestedFrameReset = forceReset;
        };
        
        resetStance() {
            this.requestStance(SplitTime.Sprite.DEFAULT_STANCE, this.dir, false);
        };
        
        notifyFrameUpdate(delta) {
            this._timeMs += delta * 1000;
        };
        
        prepareForRender() {
            this.finalizeStance();
            this.finalizeFrame();
            // TODO: do things like lights
        };
        cleanupAfterRender() {
            this.resetStance();
        };
        
        /**
        * @return {SplitTime.Sprite}
        */
        clone() {
            var clone = new SplitTime.Sprite(this.img);
            clone.xres = this.xres;
            clone.yres = this.yres;
            clone.baseOffX = this.baseOffX;
            clone.baseOffY = this.baseOffY;
            clone.omniDir = this.omniDir;
            clone.rotate = this.rotate;
            clone.opacity = this.opacity;
            clone.playerOcclusionFadeFactor = this.playerOcclusionFadeFactor;
            clone.stance = this.stance;
            clone.requestedStance = this.requestedStance;
            clone.requestedFrameReset = this.requestedFrameReset;
            clone.frame = this.frame;
            clone.dir = this.dir;
            clone.requestedDir = this.requestedDir;
            clone.stances = this.stances;
            return clone;
        };
    }
}