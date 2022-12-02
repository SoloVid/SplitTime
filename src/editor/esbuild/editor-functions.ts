import { Coordinates2D, int } from "api"
import { FileData, IsJsonable, json, Position as FilePosition, Prop as FileProp, Trace as FileTrace } from "api/file"
import { BodySpec } from "engine/file/collage"
import { Canvas } from "engine/ui/viewport/canvas"
import { Immutable } from "engine/utils/immutable"
import { Group as FileGroup } from "engine/world/level/level-file-data"
import { makeTrace } from "engine/world/level/level-file-data-helpers"
import { Type as TraceType } from "engine/world/level/trace/trace-misc"
import { convertPositions, interpretPointString } from "engine/world/level/trace/trace-points"
import { FileLevel } from "./file-types"
import { GridSnapMover } from "./grid-snap-mover"
import { EditorLevel, EditorPositionEntity } from "./level/extended-level-format"
import { EditorMetadata } from "./shared-types"
import { traceOptions } from "./trace-options"

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

export function exportCollageJson<T>(data: IsJsonable<T>): json {
    return JSON.stringify(data, null, 4)
}

export function safeGetColor(trace: FileTrace, metadata: EditorMetadata) {
    if(metadata.highlighted) {
        return "rgba(255, 255, 0, 0.8)"
    }
    let type = trace.type
    if(type === TraceType.SOLID && +trace.height === 0) {
        type = TraceType.GROUND
    }
    for(const traceOption of traceOptions) {
        if(traceOption.type === type) {
            return traceOption.color
        }
    }
    return "rgba(255, 255, 255, 1)"
}

export const DEFAULT_GROUP_HEIGHT = 64

export function getLevelPageTitle(filePath: string, level: Level): string {
    let title = filePath ? filePath : "untitled"
    if (level.region) {
        title += " (" + level.region + ")"
    }
    return title
}

export function exportLevel(levelObject: Level): FileData {
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

export function exportLevelJson(levelObject: FileLevel): json {
    // TODO: Where is export?
    return "{}"
    // return toJson(exportLevel(levelObject))
}

export function importLevel(levelText: string): FileLevel {
    const levelFile = JSON.parse(levelText) as FileData
    return levelFile
    // const levelObject = new Level()
    // levelObject.region = levelFile.region
    // levelObject.width = levelFile.width
    // levelObject.height = levelFile.height
    // levelObject.background = levelFile.background
    // levelObject.backgroundOffsetX = levelFile.backgroundOffsetX
    // levelObject.backgroundOffsetY = levelFile.backgroundOffsetY
    // levelObject.groups = levelFile.groups.map(g => withMetadata("group", g))
    // levelObject.traces = levelFile.traces.map(t => withMetadata("trace", t))
    // levelObject.props = levelFile.props.map(p => withMetadata("prop", p))
    // levelObject.positions = levelFile.positions.map(p => withMetadata("position", p))
    // return levelObject
}

export function getGroupById(level: Immutable<EditorLevel>, groupId: string): FileGroup {
    for (const group of level.groups) {
        if (group.obj.id === groupId) {
            return group.obj
        }
    }
    return {
        id: "",
        parent: "",
        defaultZ: 0,
        defaultHeight: DEFAULT_GROUP_HEIGHT
    }
}

type FileThing = FileTrace | FileProp | FilePosition
export function inGroup(level: EditorLevel, group: string, obj: FileThing): boolean {
    return checkGroupMatch(level, group, obj.group)
}
export function checkGroupMatch(level: EditorLevel, realGroup: string, testGroup: string): boolean {
    if (realGroup === "") {
        return level.groups.every(g => g.obj.id !== testGroup)
    }
    return realGroup === testGroup
}

export function makeNewTrace(levelObject: EditorLevel, groupId: string, type: string): FileTrace {
    const group = getGroupById(levelObject, groupId)
    var z = group.defaultZ
    var height = group.defaultHeight
    if(type === TraceType.GROUND) {
        type = TraceType.SOLID
        height = 0
    }
    return makeTrace({
        group: group.id,
        type: type,
        z: z,
        height: height,
    })
}

export function safeExtractTraceArray(levelObject: Immutable<EditorLevel>, traceStr: string): (Readonly<Coordinates2D> | null)[] {
    const pointSpecs = interpretPointString(traceStr)
    return convertPositions(pointSpecs, getPositionMap(levelObject))
}

function getPositionMap(levelObject: Immutable<EditorLevel>): { [id: string]: Readonly<Coordinates2D> } {
    const positionMap: { [id: string]: Readonly<Coordinates2D> } = {}
    for(const p of levelObject.positions) {
        positionMap[p.obj.id] = p.obj
    }
    return positionMap
}

export function findClosestPosition(levelObject: Immutable<EditorLevel>, x: number, y: number): EditorPositionEntity | null {
    let closestDistance = Number.MAX_SAFE_INTEGER
    let closestPosition: EditorPositionEntity | null = null

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
    const tempCanvas = new Canvas(PLACEHOLDER_WIDTH, PLACEHOLDER_WIDTH)
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

export function createSnapMontageMover(gridCell: Coordinates2D, bodySpec: BodySpec, coords: Coordinates2D): GridSnapMover {
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
    return new GridSnapMover(gridCell, originalPoints)
}
