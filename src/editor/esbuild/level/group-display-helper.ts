import { checkGroupMatch, inGroup } from "../editor-functions"
import { EditorGroupEntity, EditorLevel, EditorPositionEntity, EditorPropEntity, EditorTraceEntity } from "./extended-level-format"

// export function useGroupDisplayHelper(
//   level: FileLevel,
//   group: FileGroup | undefined
// ) {
//   const groupId = group?.id || ""

//   const subGroups = useMemo(() => {
//     return level.groups.filter(group => checkGroupMatch(level, groupId, group.parent))
//   }, [level, groupId])
//   const traces = useMemo(() => {
//     return level.traces.filter(trace => inGroup(level, groupId, trace))
//   }, [level, groupId])
//   const props = useMemo(() => {
//     return level.props.filter(prop => inGroup(level, groupId, prop))
//   }, [level, groupId])
//   const positions = useMemo(() => {
//     return level.positions.filter(pos => inGroup(level, groupId, pos))
//   }, [level, group])
export class GroupDisplayHelper {
  private readonly memoized = makeMemoPad()

  constructor(
    private readonly level: EditorLevel,
    private readonly group: EditorGroupEntity | undefined
  ) {}

  get groupId(): string {
    return this.group?.obj.id || ""
  }

  get subGroups(): readonly EditorGroupEntity[] {
    return this.memoized("subGroups", () => this.level.groups.filter(group => checkGroupMatch(this.level, this.groupId, group.obj.parent)))
  }
  get traces(): readonly EditorTraceEntity[] {
    return this.memoized("traces", () => this.level.traces.filter(trace => inGroup(this.level, this.groupId, trace.obj)))
  }
  get props(): readonly EditorPropEntity[] {
    return this.memoized("props", () => this.level.props.filter(prop => inGroup(this.level, this.groupId, prop.obj)))
  }
  get positions(): readonly EditorPositionEntity[] {
    return this.memoized("positions", () => this.level.positions.filter(pos => inGroup(this.level, this.groupId, pos.obj)))
  }
  get allDisplayed(): boolean {
    return this.allSubGroupsDisplayed && this.allTracesDisplayed && this.allPropsDisplayed && this.allPositionsDisplayed
  }
  get allSubGroupsDisplayed(): boolean {
    return this.memoized("subGroupHelpersDisplayed", () => this.subGroupHelpers.every(g => {
      return g.allDisplayed
    }))
  }
  get allTracesDisplayed(): boolean {
    return this.memoized("tracesDisplayed", () => this.traces.every(trace => {
      return trace.metadata.displayed
    }))
  }
  get allPropsDisplayed(): boolean {
    return this.memoized("propsDisplayed", () => this.props.every(prop => {
      return prop.metadata.displayed
    }))
  }
  get allPositionsDisplayed(): boolean {
    return this.memoized("positionsDisplayed", () => this.positions.every(pos => {
      return pos.metadata.displayed
    }))
  }

  private get subGroupHelpers(): readonly GroupDisplayHelper[] {
    return this.memoized("subGroupHelpers", () => this.level.groups
      .filter(group => checkGroupMatch(this.level, this.groupId, group.obj.parent))
      .map(g => new GroupDisplayHelper(this.level, g))
    )
  }

  private setAllDisplayed(displayed: boolean): void {
    this.subGroupHelpers.forEach(group => {
      group.setAllDisplayed(displayed)
    })
    this.traces.forEach(trace => {
      trace.setMetadata((before) => ({...before, displayed: !before.displayed}))
    })
    this.props.forEach(prop => {
      prop.setMetadata((before) => ({...before, displayed: !before.displayed}))
    })
    this.positions.forEach(pos => {
      pos.setMetadata((before) => ({...before, displayed: !before.displayed}))
    })
  }
  toggleAllDisplayed(): void {
    const displayed = this.allDisplayed
    this.setAllDisplayed(displayed)
  }
}

function makeMemoPad() {
  const backing: Record<string, unknown> = {}
  return <T>(id: string, makeIt: () => T): T => {
    if (!(id in backing)) {
      backing[id] = makeIt()
    }
    return backing[id] as T
  }
}
