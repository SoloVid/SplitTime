import { DEFAULT_GROUP_HEIGHT } from "../editor-functions"
import { SelectInput } from "../input"
import { onlyLeft } from "../preact-help"
import { levelEditorPreferences } from "../preferences"
import { SharedStuff } from "./level-editor-shared"
import MenuGroup from "./menu-group"

type LevelTreeProps = {
  levelEditorShared: SharedStuff
}

export default function LevelTree(props: LevelTreeProps) {
  const {
    levelEditorShared,
  } = props

  const level = levelEditorShared.level
  const prefs = levelEditorPreferences.use(levelEditorShared.id)

  function createGroup(): void {
    let defaultHeight = DEFAULT_GROUP_HEIGHT
    if (level.groups.length > 0) {
      defaultHeight = level.groups[level.groups.length - 1].obj.defaultHeight
    }
    const group = {
      id: "Group " + level.groups.length,
      parent: "",
      defaultZ: 0,
      defaultHeight: defaultHeight
    }
    const newEntity = level.addGroup(group)
    levelEditorShared.setPropertiesPanel(newEntity)
  }

  function setActiveGroup(newEditorId: string) {
    const newGroup = level.groups.find(g => g.metadata.editorId === newEditorId)
    levelEditorShared.setActiveGroup(newGroup ?? null)
  }

  return <div className="level-tree">
    <label>
      Active Group:
      <SelectInput
        className="active-group block"
        value={levelEditorShared.activeGroup?.metadata.editorId ?? ""}
        onChange={(newValue) => setActiveGroup(newValue)}
        options={[
          ["", "<DEFAULT>"],
          ...level.groups.map((group) => [group.metadata.editorId, group.obj.id || "Untitled Group"] as const)
        ]}
      />
    </label>
    <hr/>
    <MenuGroup
      levelEditorShared={levelEditorShared}
    />
    <div className="option" onClick={onlyLeft(createGroup)}>Add Group</div>
  </div>
}