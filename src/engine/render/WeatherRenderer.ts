namespace SplitTime {
    var COUNTER_BASE = 25600;
    // TODO: might want to use region time rather than real time
    var frameStabilizer: IntervalStabilizer;
    defer(() => {
        frameStabilizer = new SplitTime.IntervalStabilizer(SplitTime.msPerFrame, COUNTER_BASE, function() {
            return new Date().getDate();
        });
    });
    
    var SCREEN_WIDTH: int;
    var SCREEN_HEIGHT: int;
    
    var buffer: SLVD.Canvas;
    
    // TODO: add some means to update this
    var lightedThings: SplitTime.Body[] = [];
    
    export class WeatherRenderer {
        isRaining: boolean = false;
        // Number of lightning strikes per minute
        lightningFrequency: number = 0;
        isCloudy: boolean = false;
        // 0-1 invisible to fully visible
        cloudAlpha: number = 1;
        // 0-1 not dark to 100% dark
        darkness: number = 0;
        
        setLights(things: SplitTime.Body[]) {
            lightedThings = things;
        };
        
        render(ctx: CanvasRenderingContext2D) {
            var screen = SplitTime.BoardRenderer.getScreenCoordinates();
            
            var counter = frameStabilizer.getCounter();
            //Light in dark
            if(this.darkness > 0) {
                //Transparentize buffer
                buffer.context.clearRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
                
                //Put lighted things on the buffer as white radial gradients with opaque centers and transparent edges
                for(var iLight = 0; iLight < lightedThings.length; iLight++) {
                    var thing = lightedThings[iLight];
                    var xCoord = (thing.x) - screen.x;
                    var yCoord = (thing.y) - screen.y;
                    var grd = buffer.context.createRadialGradient(xCoord, yCoord, 1, xCoord, yCoord, thing.lightRadius);
                    grd.addColorStop(0, "rgba(255, 255, 255, " + (this.darkness * thing.lightIntensity) + ")");
                    grd.addColorStop(1, "rgba(255, 255, 255, 0)");
                    buffer.context.fillStyle = grd;
                    buffer.context.beginPath();
                    buffer.context.arc(xCoord, yCoord, 150, 0, 2 * Math.PI);
                    buffer.context.closePath();
                    buffer.context.fill();
                }
                
                //XOR lights placed with black overlay (the result being holes in the black)
                buffer.context.globalCompositeOperation = "xor";
                buffer.context.fillStyle = "rgba(0, 0, 0, " + this.darkness + ")";//"#000000";
                buffer.context.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
                
                //Render buffer
                ctx.drawImage(buffer.element, 0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
                
                //Return to default SplitTime.image layering
                buffer.context.globalCompositeOperation = "source-over";
            }
            //Weather
            if(this.isRaining) {
                ctx.drawImage(SplitTime.image.get("rain.png"), -((counter % 100) / 100) * SCREEN_WIDTH, ((counter % 25) / 25) * SCREEN_HEIGHT - SCREEN_HEIGHT);
            }
            if(this.isCloudy) {
                var CLOUDS_WIDTH = 2560;
                var CLOUDS_HEIGHT = 480;
                var xPixelsShift = -SLVD.mod(counter - screen.x, CLOUDS_WIDTH);
                var yPixelsShift = SLVD.mod(screen.y, CLOUDS_HEIGHT);
                ctx.globalAlpha = this.cloudAlpha;
                drawTiled(ctx, SplitTime.image.get("stormClouds.png"), xPixelsShift, yPixelsShift);
                ctx.globalAlpha = 1;
            }
            if(this.lightningFrequency > 0) {
                // TODO: tie to time rather than frames
                if(SLVD.randomInt(SplitTime.FPS * 60) <= this.lightningFrequency) {
                    ctx.fillStyle = "rgba(255, 255, 255, .75)";
                    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
                }
            }
        };
        
        /**
        * Initialize canvases that WeatherRenderer will use
        */
        static createCanvases(width: int, height: int) {
            SCREEN_WIDTH = width;
            SCREEN_HEIGHT = height;
            
            buffer = new SLVD.Canvas(width, height);
        };
    }
    
    /**
    * @param {CanvasRenderingContext2D} ctx
    * @param {HTMLImageElement} image
    * @param {number} left x in image to start tiling at
    * @param {number} top y in image to start tiling at
    */
    function drawTiled(ctx: CanvasRenderingContext2D, image: HTMLImageElement, left: number, top: number) {
        left = SLVD.mod(left, image.naturalWidth);
        top = SLVD.mod(top, image.naturalHeight);
        // Draw upper left tile
        ctx.drawImage(image, left, top, SCREEN_WIDTH, SCREEN_HEIGHT, 0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
        
        var xEnd = image.naturalWidth - left;
        if(xEnd < SCREEN_WIDTH) {
            // Draw upper right tile if needed
            ctx.drawImage(image, 0, top, SCREEN_WIDTH, SCREEN_HEIGHT, xEnd, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
        }
        
        var yEnd = image.naturalHeight - top;
        if(yEnd < SCREEN_HEIGHT) {
            // Draw lower left tile if needed
            ctx.drawImage(image, left, 0, SCREEN_WIDTH, SCREEN_HEIGHT, 0, yEnd, SCREEN_WIDTH, SCREEN_HEIGHT);
        }
        
        if(xEnd < SCREEN_WIDTH && yEnd < SCREEN_HEIGHT) {
            // Draw lower right tile if needed
            ctx.drawImage(image, 0, 0, SCREEN_WIDTH, SCREEN_HEIGHT, xEnd, yEnd, SCREEN_WIDTH, SCREEN_HEIGHT);
        }
    }
}