import { makePositionPoint } from "engine/world/level/trace/trace-points"
import { int } from "globals"
import { FileLevel, FilePosition } from "../file-types"
import { ImmutableSetter } from "../preact-help"
import { Level } from "./extended-level-format"

export class PositionWrapper implements FilePosition {

  constructor(
    private readonly positionBacking: FilePosition,
    private readonly level: Level
  ) { }

  delete(): void {
    const id = this.id
    const posVertex = makePositionPoint(id)
    const coordsVertex = "(" + this.positionBacking.x + ", " + this.positionBacking.y + ")"
    for (const trace of this.level.traces) {
      while (trace.obj.vertices.indexOf(posVertex) >= 0) {
        trace.obj.vertices = trace.obj.vertices.replace(posVertex, coordsVertex)
      }
    }
    this.level.positions = this.level.positions.filter(p => p.obj.id !== id)
  }

  get id(): string {
    return this.positionBacking.id
  }
  set id(newId: string) {
    if (newId === "") {
      throw new Error("Position ID should not be blank")
    }
    if (/[^a-zA-Z0-9 _.-]/.test(newId)) {
      throw new Error("Position ID cannot contain special characters other than ' ', '_', '.', '-'")
    }

    const oldId = this.positionBacking.id
    for (const p of this.level.positions) {
      if (p.obj !== this.positionBacking && p.obj.id === newId) {
        throw new Error("Position ID " + newId + " already taken")
      }
    }
    this.positionBacking.id = newId
    const oldVertex = makePositionPoint(oldId)
    const newVertex = makePositionPoint(newId)
    for (const trace of this.level.traces) {
      while (trace.obj.vertices.indexOf(oldVertex) >= 0) {
        trace.obj.vertices = trace.obj.vertices.replace(oldVertex, newVertex)
      }
    }
  }

  get group(): string {
    return this.positionBacking.group
  }
  set group(newGroup: string) {
    this.positionBacking.group = newGroup
  }

  get collage(): string {
    return this.positionBacking.collage
  }
  set collage(newCollage: string) {
    this.positionBacking.collage = newCollage
  }

  get montage(): string {
    return this.positionBacking.montage
  }
  set montage(newMontage: string) {
    this.positionBacking.montage = newMontage
  }

  get x(): int {
    return this.positionBacking.x
  }
  set x(newX: int) {
    this.positionBacking.x = newX
  }

  get y(): int {
    return this.positionBacking.y
  }
  set y(newY: int) {
    this.positionBacking.y = newY
  }

  get z(): int {
    return this.positionBacking.z
  }
  set z(newZ: int) {
    this.positionBacking.z = newZ
  }

  get dir(): string {
    return this.positionBacking.dir
  }
  set dir(newDir: string) {
    this.positionBacking.dir = newDir
  }
}

export function onPositionDelete(setLevel: ImmutableSetter<FileLevel>, position: FilePosition) {
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

export function onPositionIdUpdate(setLevel: ImmutableSetter<FileLevel>, oldId: string, newId: string) {
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
