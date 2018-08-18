dependsOn("/time/FrameStabilizer.js");

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
 * 0-1 not dark to 100% dark
 * @type {number}
 */
SplitTime.WeatherRenderer.prototype.darkness = 0; // 0-1

var COUNTER_BASE = 25600;
var frameStabilizer = new SplitTime.FrameStabilizer(SplitTime.msPerFrame, COUNTER_BASE);

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
    //Weather
    if(this.isRaining) {
        ctx.drawImage(SplitTime.Image.get("rain.png"), -((counter % 100) / 100) * SCREEN_WIDTH, ((counter % 25) / 25) * SCREEN_HEIGHT - SCREEN_HEIGHT);
    }
    if(this.isCloudy) {
        ctx.drawImage(SplitTime.Image.get("stormClouds.png"), 2560 - counter % 2560, 0, SCREEN_WIDTH, SCREEN_HEIGHT, 0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
        ctx.drawImage(SplitTime.Image.get("stormClouds.png"), 0 - counter % 2560, 0, SCREEN_WIDTH, SCREEN_HEIGHT, 0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    }
    if(this.lightningFrequency > 0) {
        // TODO: tie to time rather than frames
        if(SLVD.randomInt(SplitTime.FPS * 60) <= this.lightningFrequency) {
            ctx.fillStyle = "rgba(255, 255, 255, .75)";
            ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
        }
    }
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
