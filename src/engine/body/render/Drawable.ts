namespace SplitTime.body {
    /**
    * @interface
    * @extends FrameNotified
    * @constructor
    */
    export class Drawable {
        
        playerOcclusionFadeFactor = 0;
        
        /**
        * @param {number} x
        * @param {number} y
        * @param {number} z
        * @return {SplitTime.body.CanvasRequirements}
        */
        getCanvasRequirements(x, y, z) {
            return new SplitTime.body.CanvasRequirements(Math.round(x), Math.round(y), Math.round(z), 640, 480);
        };
        
        /**
        * @param {CanvasRenderingContext2D} ctx
        */
        draw(ctx) {
            
        };
        
        prepareForRender() {
            
        };
        cleanupAfterRender() {
            
        };
    }
    
    /**
    * @param {int} x
    * @param {int} y
    * @param {int} z
    * @param {int} width
    * @param {int} height
    * @constructor
    */
    export class CanvasRequirements {
        x: number;
        y: number;
        z: number;
        width: number;
        height: number;
        isCleared: boolean;
        translateOrigin: boolean;
        constructor(x, y, z, width, height) {
            // Level location for center of canvas
            this.x = x;
            this.y = y;
            this.z = z;
            this.width = width;
            this.height = height;
            this.isCleared = false;
            this.translateOrigin = true;
        };
    }
}
