import { Coordinates2D } from "api"
import { Trace as FileTrace } from "api/file"
import { Collage, Frame, Montage } from "engine/file/collage"
import { Collage as RealCollage, makeCollageFromFile } from "engine/graphics/collage"
import { Immutable } from "engine/utils/immutable"
import { TraceType } from "engine/world/level/trace/trace-type"
import { useContext, useMemo, useState } from "preact/hooks"
import { ServerLiaison } from "../common/server-liaison"
import { Followable, UserInputsContext } from "../common/user-inputs"
import { FileCollage, FileFrame, FileMontage, FileMontageFrame } from "../file-types"
import { GlobalEditorPreferences, GlobalEditorPreferencesContext } from "../preferences/global-preferences"
import { convertZoomToScale } from "../preferences/scale"
import { GridSnapMover } from "../utils/grid-snap-mover"
import { BasePath } from "../utils/immutable-helper"
import { ImmutableSetter } from "../utils/preact-help"
import { MIN_FRAME_LEN } from "./shared-types"
import { CollageEditorPreferencesPair } from "./collage-preferences"
import { makeTrackFrameFunction } from "./track-frame"

type MakeSharedStuffOptions = {
  readonly server: ServerLiaison
  readonly collage: Immutable<Collage>
  readonly setCollageNull: ImmutableSetter<Collage | null>
}

export function makeSharedStuff({ server, collage, setCollageNull }: MakeSharedStuffOptions) {
  const userInputs = useContext(UserInputsContext)
  const [traceInProgress, setTraceInProgress] = useState<FileTrace | null>(null)

  const setCollage: ImmutableSetter<Collage> = (transform => {
    setCollageNull(before => {
      if (before === null) {
        return null
      }
      return transform(before)
    })
  })

  return {
    traceInProgress, setTraceInProgress,

  } as const
}

type CollageEditorControlsInputs = {
  globalPrefs: GlobalEditorPreferences
  setCollage: ImmutableSetter<FileCollage>
  setCollagePrefs: CollageEditorPreferencesPair[1]
  setTraceIdInProgress: ImmutableSetter<string | null>
}

export function useCollageEditorControls({
  globalPrefs,
  setCollage,
  setCollagePrefs,
  setTraceIdInProgress,
}: CollageEditorControlsInputs) {

  const selectFrame = useMemo(() => (frame: FileFrame, skipPropertiesPanel: boolean = false): void => {
    setCollagePrefs((before) => ({
      ...before,
      frameSelected: frame.id,
      propertiesPanel: skipPropertiesPanel ? before.propertiesPanel : {
        type: "frame",
        id: frame.id,
      },
    }))
  }, [setCollagePrefs])

  const selectMontage = useMemo(() => (montage: FileMontage, skipPropertiesPanel: boolean = false): void => {
    setTraceIdInProgress(() => null)
    setCollagePrefs((before) => ({
      ...before,
      montageSelected: montage.id,
      propertiesPanel: skipPropertiesPanel ? before.propertiesPanel : {
        type: "montage",
        id: montage.id,
      }
    }))
  }, [setCollagePrefs, setTraceIdInProgress])

  const selectMontageFrame = useMemo(() => (collage: Immutable<FileCollage>, montageFrame: Immutable<FileMontageFrame>, skipPropertiesPanel: boolean = false): void => {
    const frame = collage.frames.find(f => f.name === montageFrame.frame)
    const montage = collage.montages.find(m => m.frames.some(mf => mf.id === montageFrame.id))
    setCollagePrefs((before) => ({
      ...before,
      frameSelected: frame ? frame.id : null,
      montageSelected: montage ? montage.id : null,
      propertiesPanel: skipPropertiesPanel ? before.propertiesPanel : {
        type: "montage-frame",
        id: montageFrame.id,
      }
    }))
  }, [setCollagePrefs])

  const trackFrame = useMemo(() => makeTrackFrameFunction({
    globalPrefs,
    setCollage,
    setCollagePrefs,
    setTraceIdInProgress: (id) => setTraceIdInProgress(() => id),
  }), [globalPrefs, setCollage, setCollagePrefs, setTraceIdInProgress])

  return useMemo(() => ({
    selectFrame,
    selectMontage,
    selectMontageFrame,
    trackFrame,
  }), [selectMontage, trackFrame])
}

export type CollageEditorControls = ReturnType<typeof useCollageEditorControls>
