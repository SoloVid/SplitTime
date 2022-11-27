import { Body } from "engine/world/body/body"
import { getDefaultTopLeft } from "engine/graphics/frame"
import { Montage } from "engine/graphics/montage"
import { calculateTotalArea, Rect } from "engine/math/rect"
import { Immutable } from "engine/utils/immutable"
import { GraphBody, GraphDrawable } from "engine/world/body/body-rendering-graph"
import { CanvasRequirements } from "engine/world/body/render/drawable"
import { Coordinates2D } from "engine/world/level/level-location"
import { useState } from "preact/hooks"
import { defaultBodySpec } from "../collage/collage-helper"
import { PLACEHOLDER_WIDTH, safeExtractTraceArray } from "../editor-functions"
import { FileLevel, FilePosition, FileProp, FileTrace } from "../file-types"
import { ImmutableSetter } from "../preact-help"
import { EditorMetadata } from "../shared-types"
import { CollageManager } from "./collage-manager"
import { Level, Position, Prop, Trace } from "./extended-level-format"

type TemplateEditorEntity<Type, ObjectType> = {
  type: Type
  index: number
  obj: Immutable<ObjectType>
  setObj: ImmutableSetter<ObjectType>
  metadata: Immutable<EditorMetadata>
  setMetadata: ImmutableSetter<EditorMetadata>
}

type EditorPositionEntity = TemplateEditorEntity<"position", FilePosition>
type EditorPropEntity = TemplateEditorEntity<"prop", FileProp>
type EditorTraceEntity = TemplateEditorEntity<"trace", FileTrace>

export type EditorEntity = EditorPositionEntity | EditorPropEntity | EditorTraceEntity

// From https://stackoverflow.com/a/43001581/4639640
type Writeable<T> = { -readonly [P in keyof T]: T[P] }

export function useEntityBodyManager(
  level: Immutable<FileLevel>,
  collageManager: CollageManager,
) {
  const [placeholderDrawable] = useState(() => {
    const topLeft = getDefaultTopLeft(defaultBodySpec, Rect.make(0, 0, PLACEHOLDER_WIDTH, PLACEHOLDER_WIDTH))
    const drawArea = Rect.make(topLeft.x, topLeft.y, PLACEHOLDER_WIDTH, PLACEHOLDER_WIDTH)
    return {
      getCanvasRequirements(): CanvasRequirements {
        return new CanvasRequirements(drawArea.copy())
      }
    }
  })

  // In the Vue implementation, I had some sort of caching implementation.
  // When I tried to translate it (commented out code in this file),
  // it hung up the UI, so I've removed it for now.
  // const [editorIdToBody, setEditorIdToBody] = useState<Immutable<{ [editorId: string]: GraphBody }>>({})

  return {
    getUpdatedBody(editorEntity: EditorEntity): Immutable<GraphBody> | null {
      const editorId = editorEntity.metadata.editorId
      const body = new Body()
      // const body = {...(editorIdToBody[editorId] ?? new Body())}
      try {
        if (editorEntity.type === "trace") {
          if (!applyTrace(body, editorEntity.obj)) {
            return null
          }
        } else {
          const p = editorEntity.obj
          body.x = p.x
          body.y = p.y
          body.z = p.z
          if (p.collage === "") {
            applyPlaceholder(body)
          } else {
            try {
              if (!applyProposition(body, p)) {
                return null
              }
            } catch (e: unknown) {
              applyPlaceholder(body)
            }
          }
        }
        return body
      } finally {
        // setEditorIdToBody({
        //   ...editorIdToBody,
        //   [editorId]: body,
        // })
      }
    }
  }

  function applyTrace(body: Writeable<GraphBody>, fileTrace: FileTrace): boolean {
    const tracePoints = safeExtractTraceArray(level, fileTrace.vertices)
    const nonNullPoints = tracePoints.filter((p): p is Readonly<Coordinates2D> => p !== null)
    const coordsAggregate = nonNullPoints.reduce((result, v) => {
      return {
        count: result.count + 1,
        sumCoords: new Coordinates2D(result.sumCoords.x + v.x, result.sumCoords.y + v.y)
      }
    }, { count: 0, sumCoords: new Coordinates2D() })
    if (coordsAggregate.count === 0) {
      return false
    }
    
    body.x = Math.round(coordsAggregate.sumCoords.x / coordsAggregate.count)
    body.y = Math.round(coordsAggregate.sumCoords.y / coordsAggregate.count)
    body.z = fileTrace.z
    const area = calculateTotalArea(nonNullPoints.map(p => new Coordinates2D(p.x - body.x, p.y - body.y)))
    body.width = area.width - (area.width % 2)
    body.depth = area.height - (area.height % 2)
    body.height = fileTrace.height
    area.y -= fileTrace.height
    area.height += fileTrace.height
    const drawable = {
      getCanvasRequirements(): CanvasRequirements {
        return new CanvasRequirements(area)
      }
    }
    body.drawables = [drawable]

      return true
  }

  function applyProposition(body: Writeable<GraphBody>, p: FileProp | FilePosition): boolean {
    const collage = collageManager.getRealCollage(p.collage)
    const drawable = collageManager.getSimpleGraphDrawable(p.collage, p.montage, p.dir)
    if (!collage || !drawable) {
      return false
    }
    let montage: Montage
    try {
      montage = collage.getMontage(p.montage, p.dir)
    } catch (e: unknown) {
      montage = collage.getDefaultMontage(p.dir)
    }
    body.drawables = [drawable]
    body.width = montage.bodySpec.width
    body.depth = montage.bodySpec.depth
    body.height = montage.bodySpec.height
    return true
  }

  function applyPlaceholder(body: Writeable<GraphBody>): void {
    body.width = defaultBodySpec.width
    body.depth = defaultBodySpec.depth
    body.height = defaultBodySpec.height
    // const topLeft = getDefaultTopLeft(collage.defaultBodySpec, math.Rect.make(0, 0, PLACEHOLDER_WIDTH, PLACEHOLDER_WIDTH))
    // const drawArea = Rect.make(topLeft.x, topLeft.y, PLACEHOLDER_WIDTH, PLACEHOLDER_WIDTH)
    // const drawable = {
    //   getCanvasRequirements(): CanvasRequirements {
    //     return new CanvasRequirements(drawArea)
    //   }
    // }
    body.drawables = [placeholderDrawable]
  }
}

export type EntityBodyManager = ReturnType<typeof useEntityBodyManager>
