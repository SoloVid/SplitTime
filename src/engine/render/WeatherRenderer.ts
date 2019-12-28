dependsOn("/time/IntervalStabilizer.js");
dependsOn("/SLVD/SLVD.js");

SplitTime.WeatherRenderer = function() {};

/** @type {boolean} */
SplitTime.WeatherRenderer.prototype.isRaining = false;
/**
 * Number of lightning strikes per minute
 * @type {number}
 */
SplitTime.WeatherRenderer.prototype.lightningFrequency = 0; //
/** @type {boolean} */
SplitTime.WeatherRenderer.prototype.isCloudy = false;
/**
 * 0-1 invisible to fully visible
 * @type {number}
 */
SplitTime.WeatherRenderer.prototype.cloudAlpha = 1;
/**
 * 0-1 not dark to 100% dark
 * @type {number}
 */
SplitTime.WeatherRenderer.prototype.darkness = 0; // 0-1

var COUNTER_BASE = 25600;
// TODO: might want to use region time rather than real time
var frameStabilizer = new SplitTime.IntervalStabilizer(SplitTime.msPerFrame, COUNTER_BASE, function() {
    return new Date();
});

/** @type {int} */
var SCREEN_WIDTH;
/** @type {int} */
var SCREEN_HEIGHT;

/** @type {HTMLCanvasElement} */
var buffer;
/** @type {CanvasRenderingContext2D} */
var bufferCtx;

// TODO: add some means to update this
/** @type {SplitTime.Body[]} */
var lightedThings = [];

/**
 * @param {SplitTime.Body[]} things
 */
SplitTime.WeatherRenderer.prototype.setLights = function(things) {
    lightedThings = things;
};

/**
 * @param {CanvasRenderingContext2D} ctx
 */
SplitTime.WeatherRenderer.prototype.render = function(ctx) {
    var screen = SplitTime.BoardRenderer.getScreenCoordinates();

    var counter = frameStabilizer.getCounter();
    //Light in dark
    if(this.darkness > 0) {
        //Transparentize buffer
        bufferCtx.clearRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

        //Put lighted things on the buffer as white radial gradients with opaque centers and transparent edges
        for(var iLight = 0; iLight < lightedThings.length; iLight++) {
            var thing = lightedThings[iLight];
            var xCoord = (thing.x) - screen.x;
            var yCoord = (thing.y) - screen.y;
            var grd = bufferCtx.createRadialGradient(xCoord, yCoord, 1, xCoord, yCoord, thing.lightRadius);
            grd.addColorStop(0, "rgba(255, 255, 255, " + (this.darkness * thing.lightIntensity) + ")");
            grd.addColorStop(1, "rgba(255, 255, 255, 0)");
            bufferCtx.fillStyle = grd;
            bufferCtx.beginPath();
            bufferCtx.arc(xCoord, yCoord, 150, 0, 2 * Math.PI);
            bufferCtx.closePath();
            bufferCtx.fill();
        }

        //XOR lights placed with black overlay (the result being holes in the black)
        bufferCtx.globalCompositeOperation = "xor";
        bufferCtx.fillStyle = "rgba(0, 0, 0, " + this.darkness + ")";//"#000000";
        bufferCtx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

        //Render buffer
        ctx.drawImage(buffer, 0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

        //Return to default SplitTime.image layering
        bufferCtx.globalCompositeOperation = "source-over";
    }
    //Weather
    if(this.isRaining) {
        ctx.drawImage(SplitTime.Image.get("rain.png"), -((counter % 100) / 100) * SCREEN_WIDTH, ((counter % 25) / 25) * SCREEN_HEIGHT - SCREEN_HEIGHT);
    }
    if(this.isCloudy) {
        var CLOUDS_WIDTH = 2560;
        var CLOUDS_HEIGHT = 480;
        var xPixelsShift = -SLVD.mod(counter - screen.x, CLOUDS_WIDTH);
        var yPixelsShift = SLVD.mod(screen.y, CLOUDS_HEIGHT);
        ctx.globalAlpha = this.cloudAlpha;
        drawTiled(ctx, SplitTime.Image.get("stormClouds.png"), xPixelsShift, yPixelsShift);
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
 * @param {int} width
 * @param {int} height
 */
SplitTime.WeatherRenderer.createCanvases = function(width, height) {
    SCREEN_WIDTH = width;
    SCREEN_HEIGHT = height;

    buffer = document.createElement("canvas");
    buffer.setAttribute("width", SCREEN_WIDTH);
    buffer.setAttribute("height", SCREEN_HEIGHT);
    bufferCtx = buffer.getContext("2d");
};

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {HTMLImageElement} image
 * @param {number} left x in image to start tiling at
 * @param {number} top y in image to start tiling at
 */
function drawTiled(ctx, image, left, top) {
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
