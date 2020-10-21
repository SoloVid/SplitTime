namespace splitTime.editor {
    export function updatePageTitle(level: editor.level.Level) {
        var title = level.fileName ? level.fileName : "untitled"
        if (level.region) {
            title += " (" + level.region + ")"
        }
        document.title = title
    }
    
    export function downloadFile(fileName: string, contents: string): void {
        var pom = document.createElement('a')
        pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(contents))
        pom.setAttribute('download', fileName)

        pom.style.display = 'none'
        document.body.appendChild(pom)

        pom.click()

        document.body.removeChild(pom)
    }

    // From https://stackoverflow.com/a/26230989/4639640
    export function getCoords(elem: HTMLElement): { top: int, left: int } {
        const box = elem.getBoundingClientRect()
    
        const body = document.body
        const docEl = document.documentElement
    
        const scrollTop = window.pageYOffset || docEl.scrollTop || body.scrollTop
        const scrollLeft = window.pageXOffset || docEl.scrollLeft || body.scrollLeft
    
        const clientTop = docEl.clientTop || body.clientTop || 0
        const clientLeft = docEl.clientLeft || body.clientLeft || 0
    
        const top = box.top + scrollTop - clientTop
        const left = box.left + scrollLeft - clientLeft
    
        return { top: Math.round(top), left: Math.round(left) }
    }
}

namespace splitTime.editor.level {
    export const DEFAULT_HEIGHT = 64

    export function exportLevel(levelObject: Level): splitTime.level.FileData {
        return {
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
    }

    export function exportLevelJson(levelObject: Level): file.json {
        return JSON.stringify(exportLevel(levelObject), null, 4)
    }
    
    export function importLevel(levelText: string): Level {
        const levelFile = JSON.parse(levelText) as splitTime.level.FileData
        const levelObject = new Level()
        levelObject.region = levelFile.region
        levelObject.width = levelFile.width
        levelObject.height = levelFile.height
        levelObject.background = levelFile.background
        levelObject.backgroundOffsetX = levelFile.backgroundOffsetX
        levelObject.backgroundOffsetY = levelFile.backgroundOffsetY
        levelObject.layers = levelFile.layers.map(l => client.withMetadata("layer", l))
        levelObject.traces = levelFile.traces.map(t => client.withMetadata("trace", t))
        levelObject.props = levelFile.props.map(p => client.withMetadata("prop", p))
        levelObject.positions = levelFile.positions.map(p => client.withMetadata("position", p))
        return levelObject
    }
    
    export function addNewTrace(levelObject: Level, layerIndex: int, type: string): Trace {
        var z = levelObject.layers[layerIndex].obj.z
        var height = levelObject.layers.length > layerIndex + 1 ?
        levelObject.layers[layerIndex + 1].obj.z - z :
        DEFAULT_HEIGHT
        if(type === splitTime.trace.Type.GROUND) {
            type = splitTime.trace.Type.SOLID
            height = 0
        }
        const traceObj = {
            id: "",
            type: type,
            vertices: "",
            z: z,
            height: height,
            direction: "",
            event: "",
            level: "",
            offsetX: 0,
            offsetY: 0,
            offsetZ: 0
        }
        const trace = client.withMetadata<"trace", splitTime.level.file_data.Trace>("trace", traceObj)
        levelObject.traces.push(trace)
        return trace
    }
    
    export function safeGetColor(trace: splitTime.level.file_data.Trace, metadata: client.EditorMetadata) {
        if(metadata.highlighted) {
            return "rgba(255, 255, 0, 0.8)"
        }
        let type = trace.type
        if(type === splitTime.trace.Type.SOLID && +trace.height === 0) {
            type = splitTime.trace.Type.GROUND
        }
        for(const traceOption of client.traceOptions) {
            if(traceOption.type === type) {
                return traceOption.color
            }
        }
        return "rgba(255, 255, 255, 1)"
    }
    export function safeExtractTraceArray(levelObject: Level, traceStr: string): (Readonly<Coordinates2D> | null)[] {
        const pointSpecs = splitTime.trace.interpretPointString(traceStr)
        return splitTime.trace.convertPositions(pointSpecs, getPositionMap(levelObject))
    }

    function getPositionMap(levelObject: Level): { [id: string]: Readonly<Coordinates2D> } {
        const positionMap: { [id: string]: Readonly<Coordinates2D> } = {}
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

    export const PLACEHOLDER_WIDTH = 64
    function makePlaceholderImage(): string {
        const tempCanvas = new splitTime.Canvas(PLACEHOLDER_WIDTH, PLACEHOLDER_WIDTH)
        const ctx = tempCanvas.element.getContext("2d")
        if (!ctx) {
            throw new Error("Failed to get context for placeholder image")
        }

        ctx.fillStyle = "#CD96CD"
        ctx.fillRect(0, 0, PLACEHOLDER_WIDTH, PLACEHOLDER_WIDTH)
        return (tempCanvas.element as HTMLCanvasElement).toDataURL()
    }

    let placeholderImageUrl: string | null = null
    export function getPlaceholderImage(): string {
        if (placeholderImageUrl === null) {
            placeholderImageUrl = makePlaceholderImage()
        }
        return placeholderImageUrl
    }
}
