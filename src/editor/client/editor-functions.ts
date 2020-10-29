namespace splitTime.editor {
    export function updatePageTitle(title: string) {
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

    export function toJson<T>(data: file.IsJsonable<T>): file.json {
        return JSON.stringify(data, null, 4)
    }
}

namespace splitTime.editor.level {
    export const DEFAULT_GROUP_HEIGHT = 64

    export function getLevelPageTitle(filePath: string, level: editor.level.Level): string {
        let title = filePath ? filePath : "untitled"
        if (level.region) {
            title += " (" + level.region + ")"
        }
        return title
    }

    export function exportLevel(levelObject: Level): splitTime.level.FileData {
        return {
            type: "action",
            region: levelObject.region,
            width: levelObject.width,
            height: levelObject.height,
            background: levelObject.background,
            backgroundOffsetX: levelObject.backgroundOffsetX,
            backgroundOffsetY: levelObject.backgroundOffsetY,
            groups: levelObject.groups.map(g => g.obj),
            traces: levelObject.traces.map(t => t.obj),
            props: levelObject.props.map(p => p.obj),
            positions: levelObject.positions.map(p => p.obj)
        }
    }

    export function exportLevelJson(levelObject: Level): file.json {
        return toJson(exportLevel(levelObject))
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
        levelObject.groups = levelFile.groups.map(g => client.withMetadata("group", g))
        levelObject.traces = levelFile.traces.map(t => client.withMetadata("trace", t))
        levelObject.props = levelFile.props.map(p => client.withMetadata("prop", p))
        levelObject.positions = levelFile.positions.map(p => client.withMetadata("position", p))
        return levelObject
    }

    export function getGroupByIndex(level: Level, groupIndex: int): splitTime.level.file_data.Group {
        if (groupIndex < 0 || groupIndex >= level.groups.length) {
            return {
                id: "",
                defaultZ: 0,
                defaultHeight: DEFAULT_GROUP_HEIGHT
            }
        }
        return level.groups[groupIndex].obj
    }

    type FileThing = splitTime.level.file_data.Trace | splitTime.level.file_data.Prop | splitTime.level.file_data.Position
    export function inGroup(level: Level, groupIndex: int, obj: FileThing): boolean {
        if (groupIndex < 0) {
            return level.groups.every(g => g.obj.id !== obj.group)
        }
        const group = level.groups[groupIndex]
        return obj.group === group.obj.id
    }

    export function addNewTrace(levelObject: Level, groupIndex: int, type: string): Trace {
        const group = getGroupByIndex(levelObject, groupIndex)
        var z = group.defaultZ
        var height = group.defaultHeight
        if(type === splitTime.trace.Type.GROUND) {
            type = splitTime.trace.Type.SOLID
            height = 0
        }
        const traceObj = {
            id: "",
            group: group.id,
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

    export function createSnapMontageMover(gridCell: Vector2D, bodySpec: file.collage.BodySpec, coords: Coordinates2D): client.GridSnapMover {
        const x = coords.x
        const y = coords.y
        const left = x - bodySpec.width / 2
        const right = left + bodySpec.width
        const top = y - bodySpec.depth / 2
        const bottom = top + bodySpec.depth
        const originalPoints = [
            new Coordinates2D(left, top),
            new Coordinates2D(right, top),
            new Coordinates2D(left, bottom),
            new Coordinates2D(right, bottom)
        ]
        return new client.GridSnapMover(gridCell, originalPoints)
    }
}
