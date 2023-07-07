import { BodySpec } from "engine/file/collage"
import { useContext } from "preact/hooks"
import { createSnapMontageMover } from "../editor-functions"
import { onlyLeft } from "../utils/preact-help"
import { GlobalEditorPreferencesContext } from "../preferences/global-preferences"
import { EditorPosition, EditorProp, EditorTrace } from "./extended-level-format"
import { LevelFollowerContext } from "./level-follower"
import { LevelEditorPreferences, LevelEditorPreferencesContext } from "./level-preferences"
import { UserInputs2 } from "../common/user-inputs"
import { Immutable } from "engine/utils/immutable"
import { coalescePreferencesGridCell } from "../preferences/grid"

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
    console.log("track?")
    if(preventDrag || !levelFollower) {
      console.log("nope", preventDrag, levelFollower)
      return
    }
    const gridCell = coalescePreferencesGridCell(globalPrefs)
    const snappedMover = createSnapMontageMover(gridCell, bodySpec, entity)
    const originalX = entity.x
    const originalY = entity.y
    levelFollower.trackMoveInLevel((dx, dy, levelBefore) => {
      const dxScaled = dx / scale
      const dyScaled = dy / scale
      snappedMover.applyDelta(dxScaled, dyScaled)
      const snappedDelta = snappedMover.getSnappedDelta()
      return {
        ...levelBefore,
        [`${type}s`]: levelBefore[`${type}s`].map((e, i) => {
          if (e.id !== entity.id) {
            return e
          }
          console.log("found modification point", i)
          const newThing = {
            ...e,
            x: originalX + snappedDelta.x,
            y: originalY + snappedDelta.y,
          }
          console.log("now", newThing)
          return newThing
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
