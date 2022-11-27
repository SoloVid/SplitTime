import { Immutable } from "engine/utils/immutable"
import { Type } from "engine/world/level/trace/trace-misc"
import { useState } from "preact/hooks"
import { useCollageJson } from "../collage/use-collage"
import { FileCollage, FileLevel, FileMontage, FileTrace } from "../file-types"
import { ImmutableSetter } from "../preact-help"
import { EditorMetadata, Followable, GlobalEditorShared } from "../shared-types"
import { BasePath } from "../utils/immutable-helper"
import { useCollageManager } from "./collage-manager"
import { LevelEditorState } from "./level-editor-state"
import { Mode } from "./shared-types"

type MakeSharedStuffOptions = {
  globalStuff: GlobalEditorShared
  level: Immutable<FileLevel>
  setLevel: ImmutableSetter<FileLevel>
}

export function useSharedStuff(options: MakeSharedStuffOptions) {
  const {
    globalStuff,
    level,
    setLevel,
  } = options

  const [editorState, setEditorState] = useState<LevelEditorState>({
    groups: level.groups.map(g => new EditorMetadata()),
    traces: level.traces.map(g => new EditorMetadata()),
    props: level.props.map(g => new EditorMetadata()),
    positions: level.positions.map(g => new EditorMetadata()),
  })

  const collageManager = useCollageManager(globalStuff.server)
  const [activeGroup, setActiveGroup] = useState<string>(level.groups.length > 0 ? level.groups[0].id : "")
  const [mode, setMode] = useState<Mode>("trace")
  const [selectedCollageId, setSelectedCollageId] = useState<string | null>(null)
  const [selectedCollage] = useCollageJson(globalStuff.server, selectedCollageId)
  const [selectedMontage, setSelectedMontage] = useState<string | null>(null)
  const [selectedMontageDirection, setSelectedMontageDirection] = useState<string | null>(null)
  // const [selectedMontageObject, setSelectedMontageObject] = useState<FileMontage | null>(null)
  const [selectedTraceType, setSelectedTraceType] = useState<string>(Type.SOLID)
  const [pathInProgress, setPathInProgress] = useState<FileTrace | null>(null)
  const [info, setInfo] = useState<Record<string, string | number>>({})
  const [propertiesPath, setPropertiesPath] = useState<BasePath | null>([])

  return {
    globalStuff,
    level, setLevel,
    editorState, setEditorState,
    collageManager,
    activeGroup, setActiveGroup,
    mode, setMode,
    selectedCollage, selectedCollageId, //setSelectedCollageId,
    selectedMontage, setSelectedMontage,
    selectedMontageDirection, setSelectedMontageDirection,
    // selectedMontageObject, setSelectedMontageObject,
    selectedTraceType, setSelectedTraceType,
    pathInProgress, setPathInProgress,
    info, setInfo,
    propertiesPath, setPropertiesPath,

    shouldDragBePrevented(): boolean {
      return globalStuff.userInputs.mouse.isDown || pathInProgress !== null
    },

    selectCollage(collageId: string) {
      setSelectedCollageId(collageId)
      setSelectedMontage(null)
      setSelectedMontageDirection(null)
    },

    follow(follower: Followable): void {
      globalStuff.setFollowers([follower])
    },

    // editProperties(propertiesSpec: ObjectProperties): void {
    //   this.propertiesPaneStuff = propertiesSpec
    //   const doDelete = propertiesSpec.doDelete
    //   if (!doDelete) {
    //     this.editor.editorGlobalStuff.setOnDelete(() => {})
    //     return
    //   }
    //   const fullDoDelete = () => {
    //     this.propertiesPaneStuff = null
    //     doDelete()
    //     this.editor.editorGlobalStuff.setOnDelete(() => {})
    //   }
    //   propertiesSpec.doDelete = fullDoDelete
    //   this.editor.editorGlobalStuff.setOnDelete(fullDoDelete)
    // },
  } as const
}

export type SharedStuff = ReturnType<typeof useSharedStuff>
