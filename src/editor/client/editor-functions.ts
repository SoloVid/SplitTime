import { assert, Coordinates2D, int } from "api"
import { FileData, IsJsonable, json, Position as FilePosition, Prop as FileProp, Trace as FileTrace } from "api/file"
import { BodySpec } from "engine/file/collage"
import { Canvas } from "engine/ui/viewport/canvas"
import { Immutable } from "engine/utils/immutable"
import { Group as FileGroup } from "engine/world/level/level-file-data"
import { TraceType, TraceTypeType } from "engine/world/level/trace/trace-type"
import { convertPositions, interpretPointString } from "engine/world/level/trace/trace-points"
import { GridSnapMover } from "./grid-snap-mover"
import { EditorLevel, EditorPosition } from "./level/extended-level-format"
import { traceOptions } from "./trace-options"
import { makeDefaultTrace } from "./trace-properties"

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

export function exportJson<T>(data: IsJsonable<T, false, true>): json {
  return JSON.stringify(data, null, 2)
}

export function safeGetColor(trace: FileTrace, highlighted: boolean) {
  if(highlighted) {
    return "rgba(255, 255, 0, 0.8)"
  }
  let type = trace.type
  if(type === TraceType.RENDER) {
    return trace.color
  }
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

export function getLevelPageTitle(filePath: string, region?: string): string {
  let title = filePath ? filePath : "untitled"
  if (region) {
    title += " (" + region + ")"
  }
  return title
}

export function exportLevel(levelObject: EditorLevel): FileData {
  return {
    type: "action",
    region: levelObject.region,
    width: levelObject.width,
    height: levelObject.height,
    background: levelObject.background,
    backgroundOffsetX: levelObject.backgroundOffsetX,
    backgroundOffsetY: levelObject.backgroundOffsetY,
    groups: levelObject.groups.map(g => g),
    traces: levelObject.traces.map(t => t),
    props: levelObject.props.map(p => p),
    positions: levelObject.positions.map(p => p)
  }
}

export function getGroupById(level: Immutable<EditorLevel>, groupId: string): FileGroup {
  for (const group of level.groups) {
    if (group.id === groupId) {
      return group
    }
  }
  return {
    id: "",
    name: "",
    parent: "",
    defaultZ: 0,
    defaultHeight: DEFAULT_GROUP_HEIGHT
  }
}

type FileThing = FileTrace | FileProp | FilePosition
export function inGroup(level: EditorLevel, group: string | null, obj: FileThing): boolean {
  return checkGroupMatch(level, group, obj.group)
}
export function checkGroupMatch(level: EditorLevel, realGroup: string | null, testGroup: string): boolean {
  if (realGroup === "" || realGroup === null) {
    return level.groups.every(g => g.id !== testGroup)
  }
  return realGroup === testGroup
}

export function makeNewTrace(levelObject: EditorLevel, groupId: string, type: TraceTypeType): FileTrace {
  const group = getGroupById(levelObject, groupId)
  var z = group.defaultZ
  var height = group.defaultHeight
  if(type === TraceType.GROUND) {
    type = TraceType.SOLID
    height = 0
  }
  return {
    ...makeDefaultTrace(type),
    group: group.id,
    z: z,
    height: height,
  }
}

export function safeExtractTraceArray(levelObject: Immutable<EditorLevel>, traceStr: string): (Readonly<Coordinates2D> | null)[] {
  const pointSpecs = interpretPointString(traceStr)
  return convertPositions(pointSpecs, getPositionMap(levelObject))
}
export function safeExtractTraceArray2(positionMap: ReturnType<typeof getPositionMap>, traceStr: string): (Readonly<Coordinates2D> | null)[] {
  const pointSpecs = interpretPointString(traceStr)
  return convertPositions(pointSpecs, positionMap)
}

export function getPositionMap(levelObject: Immutable<EditorLevel>): { [id: string]: Readonly<Coordinates2D> } {
  const positionMap: { [id: string]: Readonly<Coordinates2D> } = {}
  for(const p of levelObject.positions) {
    positionMap[p.id] = p
  }
  return positionMap
}

export function findClosestPosition(levelObject: Immutable<EditorLevel>, x: number, y: number): EditorPosition | null {
  let closestDistance = Number.MAX_SAFE_INTEGER
  let closestPosition: EditorPosition | null = null

  levelObject.positions.forEach(pos => {
    const dx = pos.x - x
    const dy = pos.y - y
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
  const el = tempCanvas.element
  assert(el instanceof HTMLCanvasElement, "Canvas element should be HTML (not offscreen)")
  const ctx = el.getContext("2d")
  if (!ctx) {
    throw new Error("Failed to get context for placeholder image")
  }

  ctx.fillStyle = "#CD96CD"
  ctx.fillRect(0, 0, PLACEHOLDER_WIDTH, PLACEHOLDER_WIDTH)
  return el.toDataURL()
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
