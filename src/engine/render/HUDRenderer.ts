namespace SplitTime.hud {
    
    var SCREEN_WIDTH: int;
    var SCREEN_HEIGHT: int;
    
    var buffer: SLVD.Canvas;
    var snapshot: SLVD.Canvas;
    
    var renderCallbacks: any[] = [];
    
    export function getRendererCount() {
        return renderCallbacks.length;
    };
    
    export function pushRenderer(callback: any) {
        renderCallbacks.push(callback);
    };
    
    export function unshiftRenderer(callback: any) {
        renderCallbacks.unshift(callback);
    };
    
    export function removeRenderer(callback: any) {
        for(var i = renderCallbacks.length - 1; i >= 0 ; i--) {
            if(renderCallbacks[i] === callback) {
                renderCallbacks.splice(i, 1);
            }
        }
    };
    
    export function render(ctx: CanvasRenderingContext2D) {
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
    
    export function createCanvases(width: int, height: int) {
        SCREEN_WIDTH = width;
        SCREEN_HEIGHT = height;
        
        buffer = new SLVD.Canvas(width, height);
        snapshot = new SLVD.Canvas(width, height);
    };
}