namespace SplitTime.hud {
    
    /** @type {int} */
    var SCREEN_WIDTH;
    /** @type {int} */
    var SCREEN_HEIGHT;
    
    /** @type {HTMLCanvasElement} */
    var buffer;
    /** @type {CanvasRenderingContext2D} */
    var bufferCtx;
    /** @type {HTMLCanvasElement} */
    var snapshot;
    /** @type {CanvasRenderingContext2D} */
    var snapshotCtx;
    
    var renderCallbacks = [];
    
    export function getRendererCount() {
        return renderCallbacks.length;
    };
    
    export function pushRenderer(callback) {
        renderCallbacks.push(callback);
    };
    
    export function unshiftRenderer(callback) {
        renderCallbacks.unshift(callback);
    };
    
    export function removeRenderer(callback) {
        for(var i = renderCallbacks.length - 1; i >= 0 ; i--) {
            if(renderCallbacks[i] === callback) {
                renderCallbacks.splice(i, 1);
            }
        }
    };
    
    /**
    * @param {CanvasRenderingContext2D} ctx
    */
    export function render(ctx) {
        for(var i = 0; i < renderCallbacks.length; i++) {
            var renderer = renderCallbacks[i];
            if(typeof renderer === "function") {
                renderer(ctx);
            } else if(typeof renderer.render === "function") {
                renderer.render(ctx);
            } else {
                console.warn("Removing invalid renderer", renderer);
                SplitTime.hud.removeRenderer(renderer);
                i--;
            }
        }
    };
    
    export function createCanvases(width, height) {
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
}