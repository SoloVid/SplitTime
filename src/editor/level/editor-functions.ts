namespace splitTime.editor.level {
    export function setMode(name: string) { mode = name; }
    
    export function exportLevel(): string {
        const levelFile: splitTime.level.FileData = {
            fileName: levelObject.fileName,
            type: "action",
            region: levelObject.region,
            width: levelObject.width,
            height: levelObject.height,
            background: levelObject.background,
            backgroundOffsetX: levelObject.backgroundOffsetX,
            backgroundOffsetY: levelObject.backgroundOffsetY,
            layers: levelObject.layers.map(l => l.obj),
            traces: levelObject.traces.map(t => t.obj),
            props: levelObject.props.map(p => p.obj),
            positions: levelObject.positions.map(p => p.obj)
        }
        return JSON.stringify(levelFile, null, 4);
    }
    
    export function importLevel(levelText: string): void {
        const levelFile = JSON.parse(levelText) as splitTime.level.FileData
        levelObject.fileName = levelFile.fileName
        levelObject.region = levelFile.region
        levelObject.width = levelFile.width
        levelObject.height = levelFile.height
        levelObject.background = levelFile.background
        levelObject.backgroundOffsetX = levelFile.backgroundOffsetX
        levelObject.backgroundOffsetY = levelFile.backgroundOffsetY
        levelObject.layers = levelFile.layers.map(l => withMetadata("layer", l))
        levelObject.traces = levelFile.traces.map(t => withMetadata("trace", t))
        levelObject.props = levelFile.props.map(p => withMetadata("prop", p))
        levelObject.positions = levelFile.positions.map(p => withMetadata("position", p))
        vueApp.level = levelObject;
    }
    
    var DEFAULT_HEIGHT = 64;
    
    export function addNewLayer() {
        var assumedRelativeZ = DEFAULT_HEIGHT;
        if(levelObject.layers.length > 1) {
            assumedRelativeZ = Math.abs(levelObject.layers[1].obj.z - levelObject.layers[0].obj.z);
        }
        var z = 0;
        if(levelObject.layers.length > 0) {
            var previousLayer = levelObject.layers[levelObject.layers.length - 1];
            z = previousLayer.obj.z + assumedRelativeZ;
        }
        levelObject.layers.push(withMetadata("layer", {
            id: "",
            z: z
        }))
    }
    
    export function addNewTrace(layerIndex: int, type: string) {
        var z = levelObject.layers[layerIndex].obj.z;
        var height = levelObject.layers.length > layerIndex + 1 ?
        levelObject.layers[layerIndex + 1].obj.z - z :
        DEFAULT_HEIGHT;
        if(type === splitTime.trace.Type.GROUND) {
            type = splitTime.trace.Type.SOLID;
            height = 0;
        }
        var trace = {
            id: "",
            type: type,
            vertices: "",
            z: z,
            height: height,
            direction: "",
            event: "",
            level: "",
            offsetX: "",
            offsetY: "",
            offsetZ: ""
        };
        levelObject.traces.push(withMetadata("trace", trace));
        return trace;
    }
    
    export function imgSrc(fileName: string) {
        if(!fileName) {
            return "";
        }
        return projectPath + splitTime.IMAGE_DIR + "/" + fileName;
    }
    
    export function safeGetColor(trace: Trace) {
        if(trace.metadata.highlighted) {
            return "rgba(255, 255, 0, 0.8)";
        }
        let type = trace.obj.type;
        if(type === splitTime.trace.Type.SOLID && +trace.obj.height === 0) {
            type = splitTime.trace.Type.GROUND;
        }
        for(var i = 0; i < vueApp.traceOptions.length; i++) {
            if(vueApp.traceOptions[i].type === type) {
                return vueApp.traceOptions[i].color;
            }
        }
        return "rgba(255, 255, 255, 1)";
    }
    export function safeExtractTraceArray(traceStr: string): (ReadonlyCoordinates2D | null)[] {
        const pointSpecs = splitTime.trace.interpretPointString(traceStr)
        return splitTime.trace.convertPositions(pointSpecs, getPositionMap())
    }

    function getPositionMap(): { [id: string]: ReadonlyCoordinates2D } {
        const positionMap: { [id: string]: ReadonlyCoordinates2D } = {}
        for(const p of levelObject.positions) {
            positionMap[p.obj.id] = p.obj
        }
        return positionMap
    }

    export function findClosestPosition(x: number, y: number): Position | null {
        let closestDistance = Number.MAX_SAFE_INTEGER
        let closestPosition: Position | null = null

        levelObject.positions.forEach(pos => {
            const dx = pos.obj.x - x
            const dy = pos.obj.y - y
            const dist = Math.sqrt((dx * dx) + (dy * dy))
            if(dist < closestDistance) {
                closestDistance = dist
                closestPosition = pos
            }
        })

        return closestPosition
    }
    
    export function moveFollower(dx: number, dy: number) {
        var toMove = follower || lastFollower;
        if(!toMove) {
            return;
        }
        if(toMove.obj.type === "trace") {
            var trace = toMove.obj;
            var regex = /\((-?[\d]+),\s*(-?[\d]+)\)/g;
            if (toMove.point) {
                regex = new RegExp("\\((" + toMove.point.x + "),\\s*(" + toMove.point.y + ")\\)", "g");
                toMove.point = {
                    x: toMove.point.x + dx,
                    y: toMove.point.y + dy
                };
            }
            var pointString = trace.obj.vertices;
            trace.obj.vertices = pointString.replace(regex, function(match, p1, p2) {
                var newX = Number(p1) + dx;
                var newY = Number(p2) + dy;
                return "(" + newX + ", " + newY + ")";
            });
        } else {
            toMove.obj.obj.x += dx;
            toMove.obj.obj.y += dy;
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
        return 1
    }
    
    export function createLevel() {
        if(levelObject.layers.length > 0) {
            if(!confirm("Are you sure you want to clear the current level and create a new one?")) {
                return;
            }
        }

        levelObject = new Level()
        
        vueApp.level = levelObject;
        vueApp.createLayer();
        
        $("#editorTools").show();
        
        updatePageTitle();
    }
    
    export function createObject(type: string) {
        if(type == "position") {
            return createPosition()
        } else if(type == "prop") {
            return createProp()
        }
    }
    
    export function createPosition() {
        var layerIndex = vueApp.activeLayer;
        var z = levelObject.layers[layerIndex].obj.z;
        var x = mouseLevelX;
        var y = mouseLevelY + z;
        
        var object = {
            id: "",
            template: "",
            x: x,
            y: y,
            z: z,
            dir: "S",
            stance: "default"
        }
        const newThing = withMetadata<"position", splitTime.level.file_data.Position>("position", object)
        levelObject.positions.push(newThing);
        showEditorPosition(newThing);
    }
    
    export function createProp() {
        var layerIndex = vueApp.activeLayer;
        var z = levelObject.layers[layerIndex].obj.z;
        var x = mouseLevelX;
        var y = mouseLevelY + z;
        
        var object = {
            id: "",
            template: "",
            x: x,
            y: y,
            z: z,
            dir: "S",
            stance: "default",
            playerOcclusionFadeFactor: 0
        }

        const newThing = withMetadata<"prop", splitTime.level.file_data.Prop>("prop", object)
        levelObject.props.push(newThing);
        showEditorProp(newThing);
    }
    
    export function loadBodyFromTemplate(templateName: string) {
        try {
            return G.BODY_TEMPLATES.getInstance(templateName);
        } catch(e) {
            return new splitTime.Body();
        }
    }
    
    export function getBodyImage(body: splitTime.Body) {
        if(body.drawable instanceof splitTime.Sprite) {
            return imgSrc(body.drawable.img);
        }
        return subImg;
    }
    
    export function getAnimationFrameCrop(body: splitTime.Body, dir: string | splitTime.direction_t, stance: string): math.Rect {
        if(body.drawable instanceof splitTime.Sprite) {
            return body.drawable.getAnimationFrameCrop(splitTime.direction.interpret(dir), stance, 0)
        }
        // FTODO: more solid default
        return math.Rect.make(0, 0, 32, 64)
    }
    
    export function getSpriteOffset(body: splitTime.Body): Coordinates2D {
        if(body.drawable instanceof splitTime.Sprite) {
            return {
                x: body.drawable.baseOffX,
                y: body.drawable.baseOffY
            };
        }
        return { x: 0, y: 0 };
    }
}
