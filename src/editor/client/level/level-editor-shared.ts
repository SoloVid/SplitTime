import { Immutable } from "engine/utils/immutable"
import { TraceType } from "engine/world/level/trace/trace-type"
import { useState } from "preact/hooks"
import { useCollageJson } from "../collage/use-collage"
import { levelEditorPreferences } from "../preferences/preferences"
import { Followable, GlobalEditorShared } from "../shared-types"
import { BasePath } from "../utils/immutable-helper"
import { useCollageManager } from "./collage-manager"
import { EditorEntity, EditorGroupEntity, EditorLevel, EditorTraceEntity } from "./extended-level-format"
import { Mode } from "./shared-types"

type MakeSharedStuffOptions = {
  globalStuff: GlobalEditorShared
  level: Immutable<EditorLevel>
  id: string
}

export function useSharedStuff(options: MakeSharedStuffOptions) {
  const {
    globalStuff,
    level,
    id,
  } = options

  const [preferences, setPreferences] = levelEditorPreferences.use(id)

  const collageManager = useCollageManager(globalStuff.server)
  const [activeGroup, setActiveGroupInternal] = useState<Immutable<EditorGroupEntity> | null>(level.groups.find(g => g.obj.id === preferences.activeGroup) ?? (level.groups.length > 0 ? level.groups[0] : null))
  const [selectedCollage] = useCollageJson(globalStuff.server, preferences.collageSelected)
  const [selectedTraceType, setSelectedTraceType] = useState<(typeof TraceType)[keyof typeof TraceType]>(TraceType.SOLID)
  const [pathInProgress, setPathInProgress] = useState<Immutable<EditorTraceEntity> | null>(null)
  const [info, setInfo] = useState<Record<string, string | number>>({})
  const [propertiesPath, setPropertiesPath] = useState<BasePath | null>([])

  return {
    // globalStuff,
    // level,
    // id,
    // collageManager,
    // activeGroup,
    // mode: preferences.mode,
    // selectedCollage, selectedCollageId: preferences.collageSelected,
    // selectedMontage: preferences.montageSelected,
    // selectedMontageDirection: preferences.montageDirectionSelected,
    // selectedTraceType, setSelectedTraceType,
    // pathInProgress, setPathInProgress,
    // info, setInfo,
    // propertiesPath,

    // setMode(newMode: Mode) {
    //   setPreferences((before) => ({
    //     ...before,
    //     mode: newMode,
    //   }))
    // },

    // shouldDragBePrevented(): boolean {
    //   return globalStuff.userInputs.mouse.isDown || pathInProgress !== null
    // },

    // selectCollage(collageId: string) {
    //   setPreferences((before) => ({
    //     ...before,
    //     collageSelected: collageId,
    //   }))
    //   this.setSelectedMontage(null)
    //   this.setSelectedMontageDirection(null)
    // },

    // setSelectedMontage(newMontage: string | null) {
    //   setPreferences((before) => ({...before, montageSelected: newMontage}))
    // },
    // setSelectedMontageDirection(newMontageDirection: string | null) {
    //   setPreferences((before) => ({...before, montageDirectionSelected: newMontageDirection}))
    // },

    // setActiveGroup(newGroup: Immutable<EditorGroupEntity> | null) {
    //   setPreferences((before) => ({...before, activeGroup: newGroup === null ? null : newGroup.obj.id}))
    //   setActiveGroupInternal(newGroup)
    // },

    // follow(follower: Followable): void {
    //   globalStuff.setFollowers([follower])
    // },

    // setPropertiesPanel: (thing: EditorLevel | EditorEntity | null) => {
    //   if (thing === null) {
    //     setPropertiesPath(null)
    //     return
    //   }
    //   if ("region" in thing) {
    //     setPropertiesPath([])
    //     return
    //   }

    //   const arr = level[thing.keyInLevel]
    //   const index = arr.findIndex((e) => e.metadata.editorId === thing.metadata.editorId)
    //   if (index >= 0) {
    //     setPropertiesPath([thing.keyInLevel, index, "obj"])
    //   }
    // }
  } as const
}

export type SharedStuff = ReturnType<typeof useSharedStuff>
