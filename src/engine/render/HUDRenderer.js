SplitTime.HUD = {};

(function() {
    var SCREEN_WIDTH;
    var SCREEN_HEIGHT;

    var buffer;
    var bufferCtx;
    var snapshot;
    var snapshotCtx;

    var renderCallbacks = [];

    SplitTime.HUD.pushRenderer = function(callback) {
        renderCallbacks.push(callback);
    };

    SplitTime.HUD.unshiftRenderer = function(callback) {
        renderCallbacks.unshift(callback);
    };

    SplitTime.HUD.removeRenderer = function(callback) {
        for(var i = renderCallbacks.length - 1; i >= 0 ; i--) {
            if(renderCallbacks[i] === callback) {
                renderCallbacks.splice(i, 1);
            }
        }
    };

    SplitTime.HUD.render = function(ctx) {
        for(var i = 0; i < renderCallbacks.length; i++) {
            var renderer = renderCallbacks[i];
            if(typeof renderer === "function") {
                renderer(ctx);
            } else if(typeof renderer.render === "function") {
                renderer.render(ctx);
            } else {
                console.warn("Removing invalid renderer", renderer);
                SplitTime.HUD.removeRenderer(renderer);
                i--;
            }
        }
    };

    SplitTime.HUD.createCanvases = function(width, height) {
        SCREEN_WIDTH = width;
        SCREEN_HEIGHT = height;

        buffer = document.createElement("canvas");
        buffer.setAttribute("width", SCREEN_WIDTH);
        buffer.setAttribute("height", SCREEN_HEIGHT);
        bufferCtx = buffer.getContext("2d");

        snapshot = document.createElement("canvas");
        snapshot.setAttribute("width", SCREEN_WIDTH);
        snapshot.setAttribute("height", SCREEN_HEIGHT);
        snapshotCtx = snapshot.getContext("2d");
    };
} ());