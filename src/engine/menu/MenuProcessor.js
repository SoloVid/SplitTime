SplitTime.MenuProcessor = {};

(function() {
    var COUNTER_BASE = 25600;
    var frameStabilizer = new SplitTime.FrameStabilizer(SplitTime.msPerFrame, COUNTER_BASE);

    var SCREEN_WIDTH;
    var SCREEN_HEIGHT;

    var buffer;
    var bufferCtx;

    SplitTime.MenuProcessor.createCanvases = function(width, height) {
        SCREEN_WIDTH = width;
        SCREEN_HEIGHT = height;

        buffer = document.createElement("canvas");
        buffer.setAttribute("width", SCREEN_WIDTH);
        buffer.setAttribute("height", SCREEN_HEIGHT);
        bufferCtx = buffer.getContext("2d");
    };
} ());