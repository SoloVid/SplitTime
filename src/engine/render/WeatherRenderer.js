SplitTime.WeatherRenderer = {
    isRaining: false,
    lightningFrequency: 0, // number of lightning strikes per minute
    isCloudy: false,
    darkness: 0 // 0-1
};

(function() {
	var COUNTER_BASE = 25600;
	var frameStabilizer = new SplitTime.FrameStabilizer(SplitTime.msPerFrame, COUNTER_BASE);

    var SCREEN_WIDTH;
    var SCREEN_HEIGHT;

    var buffer;
    var bufferCtx;

	// TODO: add some means to update this
	var lightedThings = [];
	
    SplitTime.WeatherRenderer.render = function(ctx) {
        var screen = SplitTime.BoardRenderer.getScreenCoordinates();
        var weather = SplitTime.WeatherRenderer;
        
    	var counter = frameStabilizer.getCounter();
        //Weather
        if(weather.isRaining) {
            ctx.drawImage(SplitTime.Image.get("rain.png"), -((counter % 100) / 100) * SCREEN_WIDTH, ((counter % 25) / 25) * SCREEN_HEIGHT - SCREEN_HEIGHT);
        }
        if(weather.isCloudy) {
            ctx.drawImage(SplitTime.Image.get("stormClouds.png"), 2560 - counter % 2560, 0, SCREEN_WIDTH, SCREEN_HEIGHT, 0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
            ctx.drawImage(SplitTime.Image.get("stormClouds.png"), 0 - counter % 2560, 0, SCREEN_WIDTH, SCREEN_HEIGHT, 0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
        }
        if(weather.lightningFrequency > 0) {
            // TODO: tie to time rather than frames
            if(SLVD.randomInt(SplitTime.FPS * 60) <= weather.lightningFrequency) {
                ctx.fillStyle = "rgba(255, 255, 255, .75)";
                ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
            }
        }
        //Light in dark
        if(weather.darkness > 0) {
            //Transparentize buffer
            bufferCtx.clearRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

            //Put lighted things on the buffer as white radial gradients with opaque centers and transparent edges
            for(var iLight = 0; iLight < lightedThings.length; iLight++) {
                var xCoord = (lightedThings[iLight].x) - screen.x;
                var yCoord = (lightedThings[iLight].y) - screen.y;
                var grd = bufferCtx.createRadialGradient(xCoord, yCoord, 1, xCoord, yCoord, 150);
                grd.addColorStop(0, "rgba(255, 255, 255, " + weather.darkness + ")");
                grd.addColorStop(1, "rgba(255, 255, 255, 0)");
                bufferCtx.fillStyle = grd;
                bufferCtx.beginPath();
                bufferCtx.arc(xCoord, yCoord, 150, 2 * Math.PI, false);
                bufferCtx.closePath();
                bufferCtx.fill();
            }

            //XOR lights placed with black overlay (the result being holes in the black)
            bufferCtx.globalCompositeOperation = "xor";
            bufferCtx.fillStyle = "rgba(0, 0, 0, " + weather.darkness + ")";//"#000000";
            bufferCtx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

            //Render buffer
            ctx.drawImage(buffer, 0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

            //Return to default SplitTime.image layering
            bufferCtx.globalCompositeOperation = "source-over";
        }
    };

    SplitTime.WeatherRenderer.createCanvases = function(width, height) {
        SCREEN_WIDTH = width;
        SCREEN_HEIGHT = height;

        buffer = document.createElement("canvas");
        buffer.setAttribute("width", SCREEN_WIDTH);
        buffer.setAttribute("height", SCREEN_HEIGHT);
        bufferCtx = buffer.getContext("2d");
    };
} ());