import { debug } from "engine/utils/logger"
import { useMemo, useState } from "preact/hooks"
import { checkGroupMatch, inGroup } from "../editor-functions"
import { FileGroup } from "../file-types"
import { CheckboxInput } from "../input"
import { makeClassNames, onlyLeft, preventDefault } from "../preact-help"
import { EditorEntity, EditorGroupEntity, EditorPositionEntity, EditorPropEntity, EditorTraceEntity } from "./extended-level-format"
import { GroupDisplayHelper } from "./group-display-helper"
import { SharedStuff } from "./level-editor-shared"
import { POSITION_ICON, PROP_ICON, TRACE_ICON } from "./shared-types"

type MenuGroupProps = {
  levelEditorShared: SharedStuff
  // undefined for top level
  group?: EditorGroupEntity | undefined
}

export default function MenuGroup({
  levelEditorShared,
  group,
}: MenuGroupProps) {
  const level = levelEditorShared.level

  // interface VueMenuGroup {
  //   // props
  //   levelEditorShared: LevelEditorShared
  //   level: Level
  //   group: Group | undefined
  //   // data
  //   collapsed: boolean
  //   displayHelper: GroupDisplayHelper
  //   // computed
  //   groupId: string
  //   subGroups: Group[]
  //   traces: Trace[]
  //   props: Prop[]
  //   positions: Position[]
  //   allDisplayed: boolean
  //   // methods
  //   edit(): void
  //   editTrace(trace: Trace): void
  //   editProp(prop: Prop): void
  //   editPosition(position: Position): void
  //   toggleAllDisplayed(): void
  // }

  const [collapsed, setCollapsed] = useState(true)
  const displayHelper = new GroupDisplayHelper(
    level,
    group
  )

  // const groupId = group === undefined ? "" : group.obj.id

  const subGroups = displayHelper.subGroups
  const traces = displayHelper.traces
  const props = displayHelper.props
  const positions = displayHelper.positions

  // const subGroups = useMemo(
  //   () => level.groups.filter(group => checkGroupMatch(level, groupId, group.obj.parent)),
  //   [level, groupId]
  // )
  // const traces = useMemo(
  //   () => level.traces.filter(trace => inGroup(level, groupId, trace.obj)),
  //   [group, groupId]
  // )
  // const props = useMemo(
  //   () => level.props.filter(prop => inGroup(level, groupId, prop.obj)),
  //   []
  // )
  // const positions = useMemo(
  //   () => level.positions.filter(pos => inGroup(level, groupId, pos.obj)),
  //   []
  // )
  // const allDisplayed = useMemo(
  //   () => this.allSubGroupsDisplayed && this.allTracesDisplayed && this.allPropsDisplayed && this.allPositionsDisplayed,
  //   []
  // )

  function edit(): void {
    levelEditorShared.setActiveGroup(group ?? null)
    if (!group) {
      debug("Group can't be edited because it is default")
      return
    }
    levelEditorShared.setPropertiesPanel(group)
  }
  function editTrace(trace: EditorTraceEntity): void {
    levelEditorShared.setPropertiesPanel(trace)
  }
  function editProp(prop: EditorPropEntity): void {
    levelEditorShared.setPropertiesPanel(prop)
  }
  function editPosition(position: EditorPositionEntity): void {
    levelEditorShared.setPropertiesPanel(position)
  }
  function toggleAllDisplayed(): void {
    displayHelper.toggleAllDisplayed()
  }

  type EntityTreeItemOptions<T> = {
    entity: T
    index: number
    className: string
    icon: string
    editEntity: (entity: T) => void
    titlePrefix: string
  }
  function makeEntityTreeItem<T extends EditorEntity>(o: EntityTreeItemOptions<T>) {
    return <div className={o.className}
      onMouseEnter={() => o.entity.setMetadata(before => ({...before, highlighted: true}))}
      onMouseLeave={() => o.entity.setMetadata(before => ({...before, highlighted: false}))}
    >
      <i className={`fas fa-${o.icon}`}></i>
      <CheckboxInput
        value={o.entity.metadata.displayed}
        onChange={(newValue) => o.entity.setMetadata(before => ({...before, displayed: newValue}))}
      />
      <span onClick={onlyLeft(() => o.editEntity(o.entity))} className="pointer">
        <span>{o.entity.obj.id || `${o.titlePrefix} ${o.index}`}</span>
      </span>
    </div>
  }

  return <div className="menu-group">
    {!!group && <>
      <span onClick={(before) => setCollapsed(!before)} onMouseDown={preventDefault} className="pointer">
        {collapsed && <i className="fas fa-caret-right"></i>}
        {!collapsed && <i className="fas fa-caret-down"></i>}
      </span>
      <input type="checkbox"
        checked={displayHelper.allDisplayed}
        onClick={onlyLeft(toggleAllDisplayed)}
      />
      <span className={makeClassNames({ highlighted: (levelEditorShared.activeGroup ?? null) === (group ?? null) })}>
        {!!group && <>
          <strong onClick={edit} className="pointer">
            <span>{group.obj.id || "Untitled Group"}</span>
          </strong>
        </>}
        {!group && <>
          <strong><em>Homeless</em></strong>
        </>}
      </span>
    </>}
    {(!collapsed || !group) && <div className={makeClassNames({ 'menu-group-body': true, indent: !!group })}>
      {(subGroups.length === 0 && traces.length === 0 && props.length === 0 && positions.length === 0) && <em>
        Empty
      </em>}
      {subGroups.map((subGroup) => (
        <MenuGroup
          levelEditorShared={levelEditorShared}
          group={subGroup}
        />
      ))}
      {traces.map((trace, i) => makeEntityTreeItem({
        className: "trace",
        entity: trace,
        index: i,
        icon: TRACE_ICON,
        editEntity: editTrace,
        titlePrefix: "Trace",
      }))}
      {props.map((prop, i) => makeEntityTreeItem({
        className: "prop",
        entity: prop,
        index: i,
        icon: PROP_ICON,
        editEntity: editProp,
        titlePrefix: "Prop",
      }))}
      {positions.map((position, i) => makeEntityTreeItem({
        className: "position",
        entity: position,
        index: i,
        icon: POSITION_ICON,
        editEntity: editPosition,
        titlePrefix: "Position",
      }))}
      {/* <div className="trace"
        onMouseEnter={() => trace.setMetadata(before => ({...before, highlighted: true}))}
        onMouseLeave={() => trace.setMetadata(before => ({...before, highlighted: false}))}
      >
        <i className={`fas fa-${TRACE_ICON}`}></i>
        <CheckboxInput
          value={trace.metadata.displayed}
          onChange={(newValue) => trace.metadata.displayed = newValue}
        />
        <span onClick={onlyLeft(() => editTrace(trace))} className="pointer">
          <span>{trace.obj.id || `Trace ${traceIndex}`}</span>
        </span>
      </div> */}
      {/* {props.map((prop, propIndex) => (
        <div className="prop"
          onMouseEnter={() => prop.metadata.highlighted = true}
          onMouseLeave={() => prop.metadata.highlighted = false}
        >
          <i className={`fas fa-${PROP_ICON}`}></i>
          <CheckboxInput
            value={prop.metadata.displayed}
            onChange={(newValue) => prop.metadata.displayed = newValue}
          />
          <span onClick={onlyLeft(() => editProp(prop))} className="pointer">
            <span>{prop.obj.id || `Prop ${propIndex}`}</span>
          </span>
        </div>
      ))} */}
      {/* {positions.map((position, positionIndex) => (
        <div className="position"
          onMouseEnter={() => position.metadata.highlighted = true}
          onMouseLeave={() => position.metadata.highlighted = false}
        >
          <i className={`fas fa-${POSITION_ICON}`}></i>
          <CheckboxInput
            value={position.metadata.displayed}
            onChange={(newValue) => position.metadata.displayed = newValue}
          />
          <span onClick={onlyLeft(() => editPosition(position))} className="pointer">
            <span>{position.obj.id || `Position ${positionIndex}`}</span>
          </span>
        </div>
      ))} */}
    </div>}
  </div>
}