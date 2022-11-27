import { int } from "globals"
import { FileGroup, FileLevel } from "../file-types"
import { ImmutableSetter } from "../preact-help"
import { Level } from "./extended-level-format"

export class GroupWrapper implements FileGroup {

  constructor(
    private readonly groupBacking: FileGroup,
    private readonly level: Level
  ) {}

  delete(): void {
    // TODO: implement delete
  }

  get id(): string {
    return this.groupBacking.id
  }
  set id(newId: string) {
    if (newId === "") {
      throw new Error("Group ID should not be blank")
    }

    const oldId = this.groupBacking.id
    for (const groupWithMetadata of this.level.groups) {
      const group = groupWithMetadata.obj
      if (group !== this.groupBacking && group.id === newId) {
        throw new Error("Group ID " + newId + " already taken")
      }
    }
    for (const position of this.level.positions) {
      if (position.obj.group === oldId) {
        position.obj.group = newId
      }
    }
    for (const position of this.level.props) {
      if (position.obj.group === oldId) {
        position.obj.group = newId
      }
    }
    for (const position of this.level.traces) {
      if (position.obj.group === oldId) {
        position.obj.group = newId
      }
    }
    this.groupBacking.id = newId
  }

  get parent(): string {
    return this.groupBacking.parent
  }
  set parent(p: string) {
    this.groupBacking.parent = p
  }

  get defaultZ(): int {
    return this.groupBacking.defaultZ
  }
  set defaultZ(z: int) {
    this.groupBacking.defaultZ = z
  }

  get defaultHeight(): int {
    return this.groupBacking.defaultHeight
  }
  set defaultHeight(height: int) {
    this.groupBacking.defaultHeight = height
  }
}

export function onGroupIdUpdate(setLevel: ImmutableSetter<FileLevel>, oldId: string, newId: string) {
  setLevel((before) => {
    return {
      ...before,
      positions: before.positions.map(p => {
        if (p.group !== oldId) return p
        return { ...p, group: newId }
      }),
      props: before.props.map(p => {
        if (p.group !== oldId) return p
        return { ...p, group: newId }
      }),
      traces: before.traces.map(t => {
        if (t.group !== oldId) return t
        return { ...t, group: newId }
      }),
    }
  })
}
