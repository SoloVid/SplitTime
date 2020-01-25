namespace SplitTime {
    let nextRef = 10;

    export class Sprite implements SplitTime.body.Drawable {
        private img: string;
        private _timeMs: number;
        private _frameSignaler: Signaler;
        ref: int;
        constructor(img: string) {
            this.img = img;
            this._timeMs = 0;
            this._frameSignaler = new SplitTime.IntervalStabilizer(200, 1, () => {
                return this._timeMs;
            });
            this.ref = nextRef++;
        };
        
        static DEFAULT_STANCE = "default";

        private autoReset: boolean = true;
        
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
        
        stances: { [x: string]: ({ "S": number; "N": number; "E": number; "W": number; }) | number; } = {
            [Sprite.DEFAULT_STANCE]: {
                "S": 0,
                "N": 1,
                "E": 2,
                "W": 3,
            }
        };
        
        private getImage(): HTMLImageElement {
            return ASSETS.images.get(this.img);
        };
        
        getCanvasRequirements(x: number, y: number, z: number) {
            return new SplitTime.body.CanvasRequirements(Math.round(x), Math.round(y), Math.round(z), this.xres, this.yres);
        };
        
        draw(ctx: CanvasRenderingContext2D) {
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
        
        _drawSimple(ctx: CanvasRenderingContext2D) {
            var tImg = this.getImage();
            
            var crop = this.getAnimationFrameCrop(this.dir, this.stance, this.frame);
            var x = -Math.round(crop.xres/2) - this.baseOffX;
            var y = -crop.yres - this.baseOffY;
            
            ctx.globalAlpha = ctx.globalAlpha * this.opacity;
            
            ctx.drawImage(tImg, crop.sx, crop.sy, crop.xres, crop.yres, x, y, crop.xres, crop.yres);
        };
        
        getAnimationFrameCrop(numDir: number, stance: string, frame: int) {
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
                column = dirMap;
            } else {
                //If shorten intermediate directions to cardinal if they are not specified
                if(dir in dirMap) {
                    column = (dirMap as any)[dir];
                } else if(simpleDir && simpleDir in dirMap) {
                    column = (dirMap as any)[simpleDir];
                } else {
                    Logger.warn("Stance " + stance + " missing direction " + dir);
                    column = 0;
                }
            }
            
            crop.sx = this.xres*column;
            return crop;
        };
        
        finalizeFrame() {
            if(this.stance != this.requestedStance || this.requestedFrameReset) {
                this.frame = 0;
            } else {
                //Only update on frame tick
                if(this._frameSignaler.isSignaling()) {
                    var mod = this.getAnimationFramesAvailable();
                    if(mod > 0) {
                        this.frame++;
                        this.frame %= mod;
                    } else {
                        this.frame = 0;
                    }
                }
            }
        };
        
        getAnimationFramesAvailable(): int {
            var calculation = Math.floor(this.getImage().height / this.yres);
            if(isNaN(calculation)) {
                if(SplitTime.debug.ENABLED) {
                    SplitTime.Logger.warn(this.img + " not loaded yet for frame count calculation for " + this.ref);
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
        
        requestStance(stance: string, dir: number, forceReset = false, hold: boolean = false) {
            this.requestedStance = stance;
            this.requestedDir = dir;
            this.requestedFrameReset = forceReset;
            this.autoReset = !hold;
        };
        
        private resetStance() {
            this.requestStance(SplitTime.Sprite.DEFAULT_STANCE, this.dir, true);
        };
        
        notifyFrameUpdate(delta: number) {
            // Don't care about real time
        };
        
        notifyTimeAdvance(delta: number) {
            this._timeMs += delta * 1000;
        };
        
        prepareForRender() {
            this.finalizeStance();
            this.finalizeFrame();
        };
        cleanupAfterRender() {
            if(this.autoReset) {
                this.resetStance();
            }
        };
        
        clone(): SplitTime.Sprite {
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