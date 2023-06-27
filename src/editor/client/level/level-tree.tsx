import { generateUID } from "engine/utils/misc"
import { useContext } from "preact/hooks"
import { DEFAULT_GROUP_HEIGHT } from "../editor-functions"
import { SelectInput } from "../input"
import { ImmutableSetter, onlyLeft } from "../preact-help"
import { EditorGroup, EditorLevel, ObjectMetadataMap } from "./extended-level-format"
import { getGroupsMetadataMap, makeLevelTree } from "./group-display-helper"
import { addGroup } from "./level-mutation-helpers"
import { LevelEditorPreferencesContext } from "./level-preferences"
import MenuGroup from "./menu-group"
import { setActiveGroup } from "./preference-helpers"
import RenderCounter from "../utils/render-counter"

type LevelTreeProps = {
  // levelEditorShared: SharedStuff
  level: EditorLevel
  setLevel: ImmutableSetter<EditorLevel>
  setObjectMetadataMap: ImmutableSetter<ObjectMetadataMap>
}

export default function LevelTree(props: LevelTreeProps) {
  const {
    level,
    setLevel,
    setObjectMetadataMap,
  } = props
  
  const [prefs, setPrefs] = useContext(LevelEditorPreferencesContext)

  const levelAsTree = makeLevelTree(level)
  const metadataMap = getGroupsMetadataMap(levelAsTree, prefs)

  function createGroup(): void {
    let defaultHeight = DEFAULT_GROUP_HEIGHT
    if (level.groups.length > 0) {
      defaultHeight = level.groups[level.groups.length - 1].defaultHeight
    }
    const group: EditorGroup = {
      id: generateUID(),
      name: "Group " + level.groups.length,
      parent: "",
      defaultZ: 0,
      defaultHeight: defaultHeight
    }
    addGroup(setLevel, group)
    setPrefs((before) => ({...before, propertiesPanel: {type: "group", id: group.id}}))
  }

  return <div className="level-tree">
    <RenderCounter debugLabel="LevelTree"></RenderCounter>
    <label>
      Active Group:
      <SelectInput
        className="active-group block"
        value={prefs.activeGroup ?? ""}
        onChange={(newValue) => setActiveGroup(setPrefs, newValue)}
        options={[
          ["", "<DEFAULT>"],
          ...level.groups.map((group) => [group.id, group.name || "Untitled Group"] as const)
        ]}
      />
    </label>
    <hr/>
    <MenuGroup
      level={level}
      treeNode={levelAsTree}
      metadataMap={metadataMap}
      setObjectMetadataMap={setObjectMetadataMap}
    />
    <div className="option" onClick={onlyLeft(createGroup)}>Add Group</div>
  </div>
}