import { makePositionPoint } from "engine/world/level/trace/trace-points"
import { FilePosition } from "../file-types"
import { ImmutableSetter } from "../preact-help"
import { EditorLevel } from "./extended-level-format"

export function onPositionDelete(setLevel: ImmutableSetter<EditorLevel>, position: FilePosition) {
  setLevel((before) => {
    const posVertex = makePositionPoint(position.id)
    const coordsVertex = "(" + position.x + ", " + position.y + ")"

    return {
      ...before,
      traces: before.traces.map(t => {
        let newVertices = t.vertices
        while (newVertices.indexOf(posVertex) >= 0) {
          newVertices = newVertices.replace(posVertex, coordsVertex)
        }
        return {
          ...t,
          vertices: newVertices,
        }
      })
    }
  })
}

export function onPositionIdUpdate(setLevel: ImmutableSetter<EditorLevel>, oldId: string, newId: string) {
  setLevel((before) => {
    const oldVertex = makePositionPoint(oldId)
    const newVertex = makePositionPoint(newId)

    return {
      ...before,
      traces: before.traces.map(t => {
        let newVertices = t.vertices
        while (newVertices.indexOf(oldVertex) >= 0) {
          newVertices = newVertices.replace(oldVertex, newVertex)
        }
        return {
          ...t,
          vertices: newVertices,
        }
      })
    }
  })
}
