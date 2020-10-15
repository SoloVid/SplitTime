namespace splitTime.editor.level {
    export const DEFAULT_HEIGHT = 64;

    export function exportLevel(levelObject: Level): string {
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
    
    export function importLevel(levelText: string): Level {
        const levelFile = JSON.parse(levelText) as splitTime.level.FileData
        const levelObject = new Level()
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
        return levelObject
    }
    
    export function addNewTrace(levelObject: Level, layerIndex: int, type: string) {
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
        for(var i = 0; i < traceOptions.length; i++) {
            if(traceOptions[i].type === type) {
                return traceOptions[i].color;
            }
        }
        return "rgba(255, 255, 255, 1)";
    }
    export function safeExtractTraceArray(levelObject: Level, traceStr: string): (ReadonlyCoordinates2D | null)[] {
        const pointSpecs = splitTime.trace.interpretPointString(traceStr)
        return splitTime.trace.convertPositions(pointSpecs, getPositionMap(levelObject))
    }

    function getPositionMap(levelObject: Level): { [id: string]: ReadonlyCoordinates2D } {
        const positionMap: { [id: string]: ReadonlyCoordinates2D } = {}
        for(const p of levelObject.positions) {
            positionMap[p.obj.id] = p.obj
        }
        return positionMap
    }

    export function findClosestPosition(levelObject: Level, x: number, y: number): Position | null {
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

    export function updatePageTitle(level: Level) {
        var title = level.fileName ? level.fileName : "untitled";
        if (level.region) {
            title += " (" + level.region + ")";
        }
        document.title = title;
    }
    
    export function downloadFile(fileName: string, contents: string): void {
        var pom = document.createElement('a');
        pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(contents));
        pom.setAttribute('download', fileName);

        pom.style.display = 'none';
        document.body.appendChild(pom);

        pom.click();

        document.body.removeChild(pom);
    }

    export function loadBodyFromTemplate(templateName: string) {
        try {
            return G.BODY_TEMPLATES.getInstance(templateName);
        } catch(e) {
            return new splitTime.Body();
        }
    }
    
    function makePlaceholderImage(): string {
        const tempCanvas = new splitTime.Canvas(256, 256)
        const ctx = tempCanvas.element.getContext("2d");
        if (!ctx) {
            throw new Error("Failed to get context for placeholder image")
        }

        const width = 32
        const height = 64
        ctx.fillStyle = "#CD96CD";
        ctx.fillRect(5, 5, width - 10, height - 10);
        return (tempCanvas.element as HTMLCanvasElement).toDataURL();
    }

    let placeholderImageUrl: string | null = null
    export function getBodyImage(body: splitTime.Body) {
        if(body.drawable instanceof splitTime.Sprite) {
            return imgSrc(body.drawable.img);
        }
        if (placeholderImageUrl === null) {
            placeholderImageUrl = makePlaceholderImage()
        }
        return placeholderImageUrl;
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
