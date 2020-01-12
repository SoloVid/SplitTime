namespace SplitTime.body {
    /**
    * @interface
    * @extends FrameNotified
    * @extends TimeNotified
    * @constructor
    */
    export interface Drawable {
        
        playerOcclusionFadeFactor: number;
        
        getCanvasRequirements(x: number, y: number, z: number): SplitTime.body.CanvasRequirements;
        
        draw(ctx: CanvasRenderingContext2D);
        
        prepareForRender();
        cleanupAfterRender();
    }
    
    export class CanvasRequirements {
        x: int;
        y: int;
        z: int;
        width: int;
        height: int;
        isCleared: boolean;
        translateOrigin: boolean;
        constructor(x: int, y: int, z: int, width: int, height: int) {
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
