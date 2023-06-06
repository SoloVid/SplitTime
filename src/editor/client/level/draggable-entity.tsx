import { BodySpec } from "engine/file/collage"
import { useContext } from "preact/hooks"
import { createSnapMontageMover } from "../editor-functions"
import { onlyLeft } from "../preact-help"
import { GlobalEditorPreferencesContext } from "../preferences/global-preferences"
import { EditorPosition, EditorProp, EditorTrace } from "./extended-level-format"
import { LevelFollowerContext } from "./level-follower"
import { LevelEditorPreferences, LevelEditorPreferencesContext } from "./level-preferences"
import { UserInputs2 } from "../user-inputs"
import { Immutable } from "engine/utils/immutable"

export type DraggableEntityProps = {
  children: any
  type: "prop" | "position"
  entity: EditorProp | EditorPosition
  bodySpec: BodySpec
  scale: number
  preventDrag: boolean
}

export default function DraggableEntity({
  children,
  type,
  entity,
  bodySpec,
  scale,
  preventDrag,
}: DraggableEntityProps) {

  const [globalPrefs] = useContext(GlobalEditorPreferencesContext)
  const [levelPrefs, setLevelPrefs] = useContext(LevelEditorPreferencesContext)
  const levelFollower = useContext(LevelFollowerContext)

  function track(): void {
    if(preventDrag || !levelFollower) {
      return
    }
    const snappedMover = createSnapMontageMover(globalPrefs.gridCell, bodySpec, entity)
    const originalX = entity.x
    const originalY = entity.y
    levelFollower.trackMoveInLevel((dx, dy, levelBefore) => {
      const dxScaled = dx / scale
      const dyScaled = dy / scale
      snappedMover.applyDelta(dxScaled, dyScaled)
      const snappedDelta = snappedMover.getSnappedDelta()
      return {
        ...levelBefore,
        [`${type}s`]: levelBefore[`${type}s`].filter((e) => {
          if (e.id !== entity.id) {
            return e
          }
          return {
            ...e,
            x: originalX + snappedDelta.x,
            y: originalY + snappedDelta.y,
          }
        })
      }
    })
    setLevelPrefs((before) => ({
      ...before,
      propertiesPanel: {
        type: type,
        id: entity.id,
      }
    }))
  }

  return <>
    <div
      className="draggable"
      onMouseDown={onlyLeft(track, true)}
    >
      {children}
    </div>
  </>
}

export function shouldDragStartBePrevented(userInputs: UserInputs2, pathInProgress: Immutable<EditorTrace> | null) {
  return userInputs.mouse.isDown || pathInProgress !== null
}
