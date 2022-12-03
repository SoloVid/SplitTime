import { Immutable } from "engine/utils/immutable"
import { Type } from "engine/world/level/trace/trace-misc"
import { useState } from "preact/hooks"
import { useCollageJson } from "../collage/use-collage"
import { FileLevel, FileTrace } from "../file-types"
import { ImmutableSetter } from "../preact-help"
import { Followable, GlobalEditorShared } from "../shared-types"
import { BasePath } from "../utils/immutable-helper"
import { useCollageManager } from "./collage-manager"
import { EditorEntity, EditorGroupEntity, EditorLevel, EditorTraceEntity } from "./extended-level-format"
import { Mode } from "./shared-types"

type MakeSharedStuffOptions = {
  globalStuff: GlobalEditorShared
  level: Immutable<EditorLevel>
  setLevel: ImmutableSetter<EditorLevel>
}

export function useSharedStuff(options: MakeSharedStuffOptions) {
  const {
    globalStuff,
    level,
    setLevel,
  } = options

  const collageManager = useCollageManager(globalStuff.server)
  const [activeGroup, setActiveGroup] = useState<Immutable<EditorGroupEntity> | null>(level.groups.length > 0 ? level.groups[0] : null)
  const [mode, setMode] = useState<Mode>("trace")
  const [selectedCollageId, setSelectedCollageId] = useState<string | null>(null)
  const [selectedCollage] = useCollageJson(globalStuff.server, selectedCollageId)
  const [selectedMontage, setSelectedMontage] = useState<string | null>(null)
  const [selectedMontageDirection, setSelectedMontageDirection] = useState<string | null>(null)
  // const [selectedMontageObject, setSelectedMontageObject] = useState<FileMontage | null>(null)
  const [selectedTraceType, setSelectedTraceType] = useState<string>(Type.SOLID)
  const [pathInProgress, setPathInProgress] = useState<Immutable<EditorTraceEntity> | null>(null)
  const [info, setInfo] = useState<Record<string, string | number>>({})
  const [propertiesPath, setPropertiesPath] = useState<BasePath | null>([])

  return {
    globalStuff,
    level, setLevel,
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
    propertiesPath, //setPropertiesPath,

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

    setPropertiesPanel: (thing: EditorLevel | EditorEntity | null) => {
      if (thing === null) {
        setPropertiesPath(null)
        return
      }
      if ("region" in thing) {
        setPropertiesPath([])
        return
      }

      const arr = level[thing.keyInLevel]
      const index = arr.findIndex((e) => e.metadata.editorId === thing.metadata.editorId)
      if (index >= 0) {
        setPropertiesPath([thing.keyInLevel, index, "obj"])
      }
    }
  } as const
}

export type SharedStuff = ReturnType<typeof useSharedStuff>
