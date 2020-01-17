namespace SplitTime.debug {
    export var ENABLED = true; // Master switch
    export var DRAW_TRACES = true;
    
    var debugDiv: HTMLElement | null = null;
    var debugInfo: { [key: string]: DebugValue } = {};
    
    export function attachDebug(parent: HTMLElement) {
        debugDiv = document.createElement("div");
        parent.appendChild(debugDiv);
    };
    
    var DEBOUNCE = 100;
    var LIFE = 2000;
    var frameStabilizer: FrameStabilizer;
    defer(() => {
        frameStabilizer = new SplitTime.FrameStabilizer(DEBOUNCE);
    });
    
    export function setDebugValue(key: string, value: any) {
        if(!SplitTime.debug.ENABLED) {
            return;
        }
        
        if(!debugInfo[key]) {
            debugInfo[key] = new DebugValue(key);
        }
        debugInfo[key].value = value;
        debugInfo[key].timeUpdated = new Date().getDate();
    };
    
    export function update() {
        var keys = [];
        for(let key in debugInfo) {
            keys.push(key);
        }
        for(var i = 0; i < keys.length; i++) {
            let key = keys[i];
            var debugValue = debugInfo[key];
            if(new Date().getTime() - debugValue.timeUpdated > LIFE) {
                delete debugInfo[key];
            }
        }
    };
    
    export function renderHTML() {
        if(debugDiv === null || !frameStabilizer.isSignaling()) {
            return;
        }
        
        var table = "<table border='1'>";
        table += "<tr>";
        for(var key in debugInfo) {
            table += "<th>" + key + "</th>";
        }
        table += "</tr><tr>";
        for(key in debugInfo) {
            table += "<td>" + debugInfo[key].value + "</td>";
        }
        table += "</tr>";
        table += "</table>";
        
        debugDiv.innerHTML = table;
    };
    
    export function renderCanvas(ctx: CanvasRenderingContext2D) {
        var FONT_SIZE = 16;
        var SPACING = 5;
        ctx.font = FONT_SIZE + "px Arial";
        ctx.fillStyle = "#FFFFFF";
        var y = 2 * SPACING + FONT_SIZE / 2;
        for(var key in debugInfo) {
            var line = key + ": " + debugInfo[key].value;
            ctx.fillText(line, SPACING, y);
            y += FONT_SIZE + SPACING;
        }
    };
    
    class DebugValue {
        value: any = null;
        timeUpdated: number = 0;
        constructor(public readonly key: string) {
        }
    }
}
