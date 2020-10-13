namespace splitTime.editor.level {
    export function setMode(name: string) { mode = name; }
    
    export function exportLevel(): string {
        var levelCopy = JSON.parse(JSON.stringify(levelObject));
        for(var iLayer = 0; iLayer < levelCopy.layers.length; iLayer++) {
            var layer = levelCopy.layers[iLayer];
            removeEditorProperties(layer);
        }
        for(var iTrace = 0; iTrace < levelCopy.traces.length; iTrace++) {
            removeEditorProperties(levelCopy.traces[iTrace]);
        }
        for(var iPos = 0; iPos < levelCopy.positions.length; iPos++) {
            removeEditorProperties(levelCopy.positions[iPos]);
        }
        for(var iProp = 0; iProp < levelCopy.props.length; iProp++) {
            removeEditorProperties(levelCopy.props[iProp]);
        }
        return JSON.stringify(levelCopy, null, 4);
    }
    
    export function importLevel(levelText: string): void {
        levelObject = JSON.parse(levelText);
        for(var iLayer = 0; iLayer < levelObject.layers.length; iLayer++) {
            var layer = levelObject.layers[iLayer];
            addEditorProperties(layer);
        }
        for(var iTrace = 0; iTrace < levelObject.traces.length; iTrace++) {
            addEditorProperties(levelObject.traces[iTrace]);
        }
        for(var iPos = 0; iPos < levelObject.positions.length; iPos++) {
            addEditorProperties(levelObject.positions[iPos]);
        }
        for(var iProp = 0; iProp < levelObject.props.length; iProp++) {
            addEditorProperties(levelObject.props[iProp]);
        }
        vueApp.level = levelObject;
    }
    
    export function addEditorProperties(object: any) {
        object.displayed = true;
        object.isHighlighted = false;
    }
    
    export function removeEditorProperties(object: any) {
        delete object.displayed;
        delete object.isHighlighted;
    }
    
    var DEFAULT_HEIGHT = 64;
    
    export function addNewLayer() {
        var assumedRelativeZ = DEFAULT_HEIGHT;
        if(levelObject.layers.length > 1) {
            assumedRelativeZ = Math.abs(levelObject.layers[1].z - levelObject.layers[0].z);
        }
        var z = 0;
        if(levelObject.layers.length > 0) {
            var previousLayer = levelObject.layers[levelObject.layers.length - 1];
            z = previousLayer.z + assumedRelativeZ;
        }
        levelObject.layers.push({
            displayed: true,
            id: "",
            z: z
        });
    }
    
    export function addNewTrace(layerIndex: int, type: string) {
        var z = levelObject.layers[layerIndex].z;
        var height = levelObject.layers.length > layerIndex + 1 ?
        levelObject.layers[layerIndex + 1].z - z :
        DEFAULT_HEIGHT;
        if(type === splitTime.trace.Type.GROUND) {
            type = splitTime.trace.Type.SOLID;
            height = 0;
        }
        var trace = {
            type: type,
            vertices: "",
            z: z,
            height: height
        };
        addEditorProperties(trace);
        levelObject.traces.push(trace);
        return trace;
    }
    
    export function imgSrc(fileName: string) {
        if(!fileName) {
            return "";
        }
        return projectPath + splitTime.IMAGE_DIR + "/" + fileName;
    }
    
    export function safeGetColor(trace: any) {
        if(trace.isHighlighted) {
            return "rgba(255, 255, 0, 0.8)";
        }
        var type = trace.type;
        if(type === splitTime.trace.Type.SOLID && +trace.height === 0) {
            type = splitTime.trace.Type.GROUND;
        }
        for(var i = 0; i < vueApp.traceOptions.length; i++) {
            if(vueApp.traceOptions[i].type === type) {
                return vueApp.traceOptions[i].color;
            }
        }
        return "rgba(255, 255, 255, 1)";
    }
    export function safeExtractTraceArray(traceStr: string) {
        var normalizedTraceStr = normalizeTraceStr(traceStr);
        return splitTime.trace.interpretPointString(normalizedTraceStr);
    }
    
    export function normalizeTraceStr(traceStr: string) {
        return traceStr.replace(/\(pos:(.+?)\)/g, function(match, posId) {
            var position = null;
            for(var i = 0; i < levelObject.positions.length; i++) {
                if(levelObject.positions[i].id === posId) {
                    position = levelObject.positions[i];
                }
            }
            
            if(!position) {
                console.warn("Position (" + posId + ") undefined in trace string \"" + traceStr + "\"");
                return "";
            }
            
            return "(" + position.x + ", " + position.y + ")";
        });
    }
    
    export function findClosestPosition(x: number, y: number): any {
        var closestDistance = Number.MAX_SAFE_INTEGER;
        var closestPosition = null;
        
        levelObject.positions.forEach(function(pos: any) {
            var dx = pos.x - x;
            var dy = pos.y - y;
            var dist = Math.sqrt((dx * dx) + (dy * dy));
            if(dist < closestDistance) {
                closestDistance = dist;
                closestPosition = pos;
            }
        });
        
        return closestPosition;
    }
    
    export function moveFollower(dx: number, dy: number) {
        var toMove = follower || lastFollower;
        if(!toMove) {
            return;
        }
        if(toMove.trace !== undefined) {
            var trace = toMove.trace;
            var regex = /\((-?[\d]+),\s*(-?[\d]+)\)/g;
            if (toMove.point) {
                regex = new RegExp("\\((" + toMove.point.x + "),\\s*(" + toMove.point.y + ")\\)", "g");
                toMove.point = {
                    x: toMove.point.x + dx,
                    y: toMove.point.y + dy,
                    z: toMove.point.z,
                };
            }
            var pointString = trace.vertices;
            trace.vertices = pointString.replace(regex, function(match: any, p1: any, p2: any) {
                var newX = Number(p1) + dx;
                var newY = Number(p2) + dy;
                return "(" + newX + ", " + newY + ")";
            });
        } else {
            toMove.x += dx;
            toMove.y += dy;
        }
    }
    
    export function updatePageTitle() {
        var title = fileName ? fileName : "untitled";
        if (levelObject.region) {
            title += " (" + levelObject.region + ")";
        }
        document.title = title;
    }
    
    export function clickFileChooser() {
        $("#fileChooser").click();
    }
    
    export function downloadFile() {
        var jsonText = exportLevel();
        
        fileName = prompt("File name?", fileName) || "";
        if(!fileName) {
            return;
        }
        if(!fileName.endsWith(".json")) {
            fileName += ".json";
        }
        
        updatePageTitle();
        
        var pom = document.createElement('a');
        pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(jsonText));
        pom.setAttribute('download', fileName);
        
        pom.style.display = 'none';
        document.body.appendChild(pom);
        
        pom.click();
        
        document.body.removeChild(pom);
    }
    
    export function getPixelsPerPixel() {
        return levelObject.type === "TRPG" ? 32 : 1;
    }
    
    export function createLevel(type: string) {
        if(levelObject.layers.length > 0) {
            if(!confirm("Are you sure you want to clear the current level and create a new one?")) {
                return;
            }
        }
        
        if(!type) {
            // type = prompt("Type: (action/overworld)");
            type = "action";
        }
        
        levelObject = {
            region: "",
            width: 640,
            height: 480,
            background: "",
            backgroundOffsetX: 0,
            backgroundOffsetY: 0,
            type: type,
            layers: [],
            traces: [],
            positions: [],
            props: []
        };
        
        vueApp.level = levelObject;
        vueApp.createLayer();
        
        $("#editorTools").show();
        
        updatePageTitle();
    }
    
    export function createObject(type: string) {
        var layerIndex = vueApp.activeLayer;
        var z = levelObject.layers[layerIndex].z;
        var x = mouseLevelX;
        var y = mouseLevelY + z;
        
        var object = {
            id: "",
            template: "",
            x: x,
            y: y,
            z: z,
            dir: 3,
            stance: "default"
        };
        
        addEditorProperties(object);
        
        if(type == "position") {
            levelObject.positions.push(object);
            showEditorPosition(object);
        } else if(type == "prop") {
            levelObject.props.push(object);
            showEditorProp(object);
        }
    }
    
    export function loadBodyFromTemplate(templateName: string) {
        try {
            return G.BODY_TEMPLATES.getInstance(templateName);
        } catch(e) {
            return new splitTime.Body();
        }
    }
    
    export function getBodyImage(body: any) {
        if(body.drawable instanceof splitTime.Sprite) {
            return imgSrc(body.drawable.img);
        }
        return subImg;
    }
    
    export function getAnimationFrameCrop(body: splitTime.Body, dir: string | splitTime.direction_t, stance: string) {
        if(body.drawable instanceof splitTime.Sprite) {
            return body.drawable.getAnimationFrameCrop(splitTime.direction.interpret(dir), stance, 0);
        }
        // FTODO: more solid default
        return {
            xres: 32,
            yres: 64,
            sx: 0,
            sy: 0
        };
    }
    
    export function getSpriteOffset(body: any) {
        if(body.drawable instanceof splitTime.Sprite) {
            return {
                x: body.drawable.baseOffX,
                y: body.drawable.baseOffY
            };
        }
        return { x: 0, y: 0 };
    }
}
