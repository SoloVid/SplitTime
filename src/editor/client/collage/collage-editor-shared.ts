import { Immutable } from "engine/utils/immutable"
import { useMemo } from "preact/hooks"
import { FileCollage, FileFrame, FileMontage, FileMontageFrame } from "../file-types"
import { GlobalEditorPreferences } from "../preferences/global-preferences"
import { ImmutableSetter } from "../utils/preact-help"
import { CollageEditorPreferencesPair } from "./collage-preferences"
import { makeTrackFrameFunction } from "./track-frame"

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
      montageFrameSelected: null,
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
      montageFrameSelected: null,
      propertiesPanel: skipPropertiesPanel ? before.propertiesPanel : {
        type: "montage",
        id: montage.id,
      }
    }))
  }, [setCollagePrefs, setTraceIdInProgress])

  const selectMontageFrame = useMemo(() => (collage: Immutable<FileCollage>, montageFrame: Immutable<FileMontageFrame>, skipPropertiesPanel: boolean = false): void => {
    const frame = collage.frames.find(f => f.id === montageFrame.frame)
    const montage = collage.montages.find(m => m.frames.some(mf => mf.id === montageFrame.id))
    setCollagePrefs((before) => ({
      ...before,
      frameSelected: frame ? frame.id : null,
      montageSelected: montage ? montage.id : null,
      montageFrameSelected: montageFrame.id,
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
