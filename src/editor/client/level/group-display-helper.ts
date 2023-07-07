import { Immutable } from "engine/utils/immutable"
import { EditorGroup, EditorLevel, EditorPosition, EditorProp, EditorTrace } from "./extended-level-format"
import { LevelEditorPreferences } from "./level-preferences"
import { ImmutableSetter } from "../utils/preact-help"

export type LevelTreeGroupNode = {
  group: EditorGroup | null
  subGroups: NonRootLevelTreeGroupNode[]
  traces: EditorTrace[]
  props: EditorProp[]
  positions: EditorPosition[]
}
export type RootLevelTreeGroupNode = LevelTreeGroupNode & {
  group: null
}
export type NonRootLevelTreeGroupNode = LevelTreeGroupNode & {
  group: EditorGroup
}

export function makeLevelTree(level: EditorLevel): Immutable<RootLevelTreeGroupNode> {
  const groupMap: Record<string, NonRootLevelTreeGroupNode> = {}
  const defaultGroup: RootLevelTreeGroupNode = {
    group: null,
    subGroups: [],
    traces: [],
    props: [],
    positions: [],
  }
  // groupMap[""] = defaultGroup
  for (const g of level.groups) {
    groupMap[g.id] = {
      group: g,
      subGroups: [],
      traces: [],
      props: [],
      positions: [],
    }
  }
  for (const g of level.groups) {
    const parent = (g.parent in groupMap) ? groupMap[g.parent] : defaultGroup
    parent.subGroups.push(groupMap[g.id])
  }
  for (const t of level.traces) {
    const parent = (t.group in groupMap) ? groupMap[t.group] : defaultGroup
    parent.traces.push(t)
  }
  for (const p of level.props) {
    const parent = (p.group in groupMap) ? groupMap[p.group] : defaultGroup
    parent.props.push(p)
  }
  for (const p of level.positions) {
    const parent = (p.group in groupMap) ? groupMap[p.group] : defaultGroup
    parent.positions.push(p)
  }
  return defaultGroup
}

export type GroupMetadata = {
  id: string
  childCount: number
  allChildrenDisplayed: boolean
}

type GroupMetadataTreed = GroupMetadata & {
  subGroupMetadatas: GroupMetadataTreed[]
}

function getGroupMetadata(group: Immutable<LevelTreeGroupNode>, prefs: LevelEditorPreferences): GroupMetadataTreed {
  const childCount = group.subGroups.length + group.traces.length + group.positions.length + group.props.length
  // console.log(group, group.subGroups)
  const subGroupMetadatas = group.subGroups.map(g => getGroupMetadata(g, prefs))
  return {
    id: group.group?.id ?? "",
    childCount: childCount,
    allChildrenDisplayed: group.traces.every(t => !prefs.hidden.includes(t.id)) &&
      group.props.every(p => !prefs.hidden.includes(p.id)) &&
      group.positions.every(p => !prefs.hidden.includes(p.id)) &&
      subGroupMetadatas.every(g => g.allChildrenDisplayed),
    subGroupMetadatas: subGroupMetadatas,
  }
}

function flattenMetadatas(tree: Immutable<GroupMetadataTreed>): Record<string, Immutable<GroupMetadata>> {
  // const map = { [tree.id]: tree }
  return tree.subGroupMetadatas.map(gm => flattenMetadatas(gm)).reduce((soFar, subMap) => {
    return {
      ...soFar,
      ...subMap,
    }
  }, { [tree.id]: tree })
  // return [tree, tree.subGroupMetadatas.map(gm => flattenMetadatas(gm))].flat(100)
}

export function getGroupsMetadataMap(root: Immutable<LevelTreeGroupNode>, prefs: LevelEditorPreferences): Record<string, Immutable<GroupMetadata>> {
  const tree = getGroupMetadata(root, prefs)
  return flattenMetadatas(tree)
}

function getAllChildObjectIds(node: Immutable<LevelTreeGroupNode>): readonly string[] {
  return [
    ...node.traces.map(e => e.id),
    ...node.props.map(e => e.id),
    ...node.positions.map(e => e.id),
    ...node.subGroups.map(e => getAllChildObjectIds(e)).flat(1),
  ]
}

export function setAllDisplayed(setPrefs: ImmutableSetter<LevelEditorPreferences>, node: Immutable<LevelTreeGroupNode>, displayed: boolean) {
  const childIds = getAllChildObjectIds(node)
  setPrefs((before) => {
    const less = before.hidden.filter(id => !childIds.includes(id))
    if (displayed) {
      return {...before, hidden: less}
    }
    return {...before, hidden: [...less, ...childIds]}
  })
}
