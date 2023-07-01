import { Immutable } from "engine/utils/immutable"
import { debug } from "engine/utils/logger"
import { useContext } from "preact/hooks"
import { CheckboxInput } from "../input"
import { ImmutableSetter, makeClassNames, onlyLeft, preventDefault } from "../preact-help"
import { useJsonableMemo } from "../utils/use-jsonable-memo"
import { EditorLevel, EditorPosition, EditorProp, EditorTrace, ObjectMetadataMap } from "./extended-level-format"
import { GroupMetadata, LevelTreeGroupNode, setAllDisplayed } from "./group-display-helper"
import { LevelEditorPreferencesContext } from "./level-preferences"
import { setActiveGroup } from "./preference-helpers"
import { POSITION_ICON, PROP_ICON, TRACE_ICON } from "./shared-types"

type MenuGroupProps = {
  level: Immutable<EditorLevel>
  // undefined for top level
  // group?: Immutable<EditorGroup> | undefined
  treeNode: Immutable<LevelTreeGroupNode>
  metadataMap: Record<string, Immutable<GroupMetadata>>
  setObjectMetadataMap: ImmutableSetter<ObjectMetadataMap>
}

export default function MenuGroup({
  // levelEditorShared,
  level,
  // group,
  treeNode,
  metadataMap,
  setObjectMetadataMap,
}: MenuGroupProps) {
  const group = treeNode.group
  const groupId = group ? group.id : ""
  const [prefs, setPrefs] = useContext(LevelEditorPreferencesContext)

  const collapsed = prefs.collapsedGroups.includes(groupId)
  const setCollapsed: ImmutableSetter<boolean> = (modify) => {
    if (!group) {
      return
    }
    const after = modify(collapsed)
    if (after) {
      setPrefs((before) => ({...before, collapsedGroups: [...before.collapsedGroups, group.id]}))
    } else {
      setPrefs((before) => ({...before, collapsedGroups: before.collapsedGroups.filter(id => id !== group.id)}))
    }
  }

  const subGroups = treeNode.subGroups
  const traces = treeNode.traces
  const props = treeNode.props
  const positions = treeNode.positions
  const myMetadata = useJsonableMemo(() => metadataMap[groupId], [metadataMap, groupId])

  function edit(): void {
    setActiveGroup(setPrefs, groupId)
    if (!group) {
      debug("Group can't be edited because it is default")
      return
    }
    setPrefs((before) => ({...before, propertiesPanel: { type: "group", id: groupId }}))
  }
  function editTrace(trace: EditorTrace): void {
    setPrefs((before) => ({...before, propertiesPanel: { type: "trace", id: trace.id }}))
  }
  function editProp(prop: EditorProp): void {
    setPrefs((before) => ({...before, propertiesPanel: { type: "prop", id: prop.id }}))
  }
  function editPosition(position: EditorPosition): void {
    setPrefs((before) => ({...before, propertiesPanel: { type: "position", id: position.id }}))
  }
  function toggleAllDisplayed(): void {
    setAllDisplayed(setPrefs, treeNode, !myMetadata.allChildrenDisplayed)
  }

  type EntityTreeItemOptions<T> = {
    entity: T
    index: number
    className: string
    icon: string
    editEntity: (entity: T) => void
    titlePrefix: string
  }
  function makeEntityTreeItem<T extends EditorTrace | EditorProp | EditorPosition>(o: EntityTreeItemOptions<T>) {
    return <div className={o.className}
      onMouseEnter={() => setObjectMetadataMap((before) => ({...before, [o.entity.id]: {...before[o.entity.id], mouseOver: true}}))}
      onMouseLeave={() => setObjectMetadataMap((before) => ({...before, [o.entity.id]: {...before[o.entity.id], mouseOver: false}}))}
    >
      <i className={`fas fa-${o.icon}`}></i>
      <CheckboxInput
        value={!prefs.hidden.includes(o.entity.id)}
        onChange={(newValue) => setPrefs((before) => {
          if (newValue) {
            return {...before, hidden: before.hidden.filter(id => id !== o.entity.id)}
          }
          return {...before, hidden: [...before.hidden, o.entity.id]}
        })}
      />
      <span onClick={onlyLeft(() => {
        o.editEntity(o.entity)
        setActiveGroup(setPrefs, groupId)
      })} className="pointer">
        <span>{o.entity.name || `${o.titlePrefix} ${o.index}`}</span>
      </span>
    </div>
  }

  return <div className="menu-group">
    {!!group && <>
      <span onClick={() => setCollapsed((before) => !before)} onMouseDown={preventDefault} className="pointer">
        {collapsed && <i className="fas fa-caret-right"></i>}
        {!collapsed && <i className="fas fa-caret-down"></i>}
      </span>
      {myMetadata.childCount > 0 && <input type="checkbox"
        checked={myMetadata.allChildrenDisplayed}
        onClick={onlyLeft(toggleAllDisplayed)}
      />}
      <span className={makeClassNames({ highlighted: (prefs.activeGroup ?? "") === groupId })}>
        {!!group && <>
          <strong onClick={edit} className="pointer">
            <span>{group.name || `Untitled Group (${group.id})`}</span>
          </strong>
        </>}
      </span>
    </>}
    {(!collapsed || !group) && <div className={makeClassNames({ 'menu-group-body': true, indent: !!group })}>
      {(subGroups.length === 0 && traces.length === 0 && props.length === 0 && positions.length === 0) && <em>
        Empty
      </em>}
      {subGroups.map((subGroup) => (
        <MenuGroup
          level={level}
          treeNode={subGroup}
          metadataMap={metadataMap}
          setObjectMetadataMap={setObjectMetadataMap}
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