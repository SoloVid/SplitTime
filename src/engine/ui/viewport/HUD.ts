namespace SplitTime.ui {

    type render_func = (ctx: CanvasRenderingContext2D) => void;
    type renderer = render_func | { render: render_func }

    export class HUD {
        private renderCallbacks: renderer[] = [];
        
        getRendererCount() {
            return this.renderCallbacks.length;
        };
        
        pushRenderer(callback: renderer) {
            this.renderCallbacks.push(callback);
        };
        
        unshiftRenderer(callback: renderer) {
            this.renderCallbacks.unshift(callback);
        };
        
        removeRenderer(callback: renderer) {
            for(var i = this.renderCallbacks.length - 1; i >= 0 ; i--) {
                if(this.renderCallbacks[i] === callback) {
                    this.renderCallbacks.splice(i, 1);
                }
            }
        };
        
        render(ctx: CanvasRenderingContext2D) {
            for(var i = 0; i < this.renderCallbacks.length; i++) {
                var renderer = this.renderCallbacks[i];
                if(typeof renderer === "function") {
                    renderer(ctx);
                } else if(typeof renderer.render === "function") {
                    renderer.render(ctx);
                }
            }
        };
    }
}