import { debug } from "engine/utils/logger"
import { useState } from "preact/hooks"
import { CheckboxInput } from "../input"
import { ImmutableSetter, makeClassNames, onlyLeft, preventDefault } from "../preact-help"
import { EditorEntity, EditorGroupEntity, EditorPositionEntity, EditorPropEntity, EditorTraceEntity, GraphicalEditorEntity } from "./extended-level-format"
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

  const collapsed = group?.metadata.collapsed ?? true
  const setCollapsed: ImmutableSetter<boolean> = (modify) => {
    if (group) {
      group.setMetadata((before) => ({...before, collapsed: modify(before.collapsed)}))
    }
  }
  const displayHelper = new GroupDisplayHelper(
    level,
    group
  )

  const subGroups = displayHelper.subGroups
  const traces = displayHelper.traces
  const props = displayHelper.props
  const positions = displayHelper.positions

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
  function makeEntityTreeItem<T extends GraphicalEditorEntity>(o: EntityTreeItemOptions<T>) {
    return <div className={o.className}
      onMouseEnter={() => o.entity.setMetadata(before => ({...before, highlighted: true}))}
      onMouseLeave={() => o.entity.setMetadata(before => ({...before, highlighted: false}))}
    >
      <i className={`fas fa-${o.icon}`}></i>
      <CheckboxInput
        value={o.entity.metadata.displayed}
        onChange={(newValue) => o.entity.setMetadata(before => ({...before, displayed: newValue}))}
      />
      <span onClick={onlyLeft(() => {
        o.editEntity(o.entity)
        levelEditorShared.setActiveGroup(group ?? null)
      })} className="pointer">
        <span>{o.entity.obj.id || `${o.titlePrefix} ${o.index}`}</span>
      </span>
    </div>
  }

  return <div className="menu-group">
    {!!group && <>
      <span onClick={() => setCollapsed((before) => !before)} onMouseDown={preventDefault} className="pointer">
        {collapsed && <i className="fas fa-caret-right"></i>}
        {!collapsed && <i className="fas fa-caret-down"></i>}
      </span>
      {displayHelper.realChildCount > 0 && <input type="checkbox"
        checked={displayHelper.allDisplayed}
        onClick={onlyLeft(toggleAllDisplayed)}
      />}
      <span className={makeClassNames({ highlighted: (levelEditorShared.activeGroup ?? null) === group })}>
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
    </div>}
  </div>
}