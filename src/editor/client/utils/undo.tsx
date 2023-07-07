import * as keycode from "engine/ui/controls/keycode"
import { IsJsonable } from "engine/file/json"
import { Immutable } from "engine/utils/immutable"
import { debug } from "engine/utils/logger"
import { useEffect, useState } from "preact/hooks"
import { exportJson } from "../editor-functions"
import { ImmutableSetter, TaggedImmutableSetter } from "./preact-help"
import { useKeyListener } from "./use-key-listener"

type Options<Hydrated, Dehydrated> = {
  // value: Hydrated
  // setValue: ImmutableSetter<Hydrated>
  dehydrate: (hydrated: Immutable<Hydrated>) => IsJsonable<Dehydrated, false, true>
  hydrate: (dehydrated: Dehydrated) => Immutable<Hydrated>
}

const UNDO_STACK_SIZE = 1000

type ReturnTuple<Hydrated> = [value: Immutable<Hydrated>, setValue: TaggedImmutableSetter<Hydrated>]

type State<Hydrated> = {
  value: Immutable<Hydrated>
  undoStack: readonly (readonly [tag: string | null, time: number, snapshot: string])[]
  redoStack: readonly string[]
}

export function useUndoStackState<Hydrated, Dehydrated>(
  initialState: () => Immutable<Hydrated>,
  options: Options<Hydrated, Dehydrated>
): ReturnTuple<Hydrated> {
  const [state, setState] = useState<State<Hydrated>>(() => {
    const initialValue = initialState()
    return {
      value: initialValue,
      undoStack: [[null, performance.now(), dehydrateValue(initialValue)]],
      redoStack: [],
    }
  })

  useKeyListener("keydown", handleKeyDown)

  function handleKeyDown(event: KeyboardEvent): void {
    // TODO: resolve types
    const element = event.target as any
    switch (element.tagName.toLowerCase()) {
      case "input":
      case "textarea":
        return
    }
    const ctrlKey = event.ctrlKey || event.metaKey

    switch (event.which) {
      case keycode.Z:
        if (ctrlKey) {
          undo()
          event.preventDefault()
        }
        break
      case keycode.Y:
        if (ctrlKey) {
          redo()
          event.preventDefault()
        }
        break
    }

  }

  function dehydrateValue(value: Immutable<Hydrated>) {
    return exportJson(options.dehydrate(value))
  }

  function hydrateString(newValue: string) {
    return options.hydrate(JSON.parse(newValue) as Dehydrated)
  }

  const sameTimeThresholdMs = 100
  const multipleSnapshotsForSameThingThresholdMs = 5000
  function createUndoPoint(tag: string | null, transform: (before: Immutable<Hydrated>) => Immutable<Hydrated>): void {
    setState((before) => {
      const now = performance.now()
      const newValue = transform(before.value)
      // console.log("createUndoPoint()", tag, before.undoStack.length)
      const currentSnapshot = dehydrateValue(newValue)
      if (before.undoStack.length > 0) {
        const [previousTag, previousTime, previousSnapshot] = before.undoStack[before.undoStack.length - 1]
        // Don't push if this is a duplicate state
        if (previousSnapshot === currentSnapshot) {
          return {
            ...before,
            value: newValue,
          }
        }
        // Overwrite if the tag is the same or time is same
        const msSincePrevious = now - previousTime
        if (msSincePrevious < sameTimeThresholdMs || (previousTag !== null && previousTag === tag && msSincePrevious < multipleSnapshotsForSameThingThresholdMs)) {
          const newUndoStack = [...before.undoStack]
          newUndoStack[newUndoStack.length - 1] = [tag, now, currentSnapshot]
          return {
            ...before,
            value: newValue,
            undoStack: newUndoStack
          }
        }
      }
      // console.log("for real")
      const newUndoStack = [...before.undoStack, [tag, now, currentSnapshot] as const]
      if (newUndoStack.length > UNDO_STACK_SIZE) {
        newUndoStack.shift()
      }
      return {
        value: newValue,
        undoStack: newUndoStack,
        redoStack: [],
      }
    })
  }

  function undo(): void {
    setState((before) => {
      // console.log("undo()", before.undoStack.length)
      const currentSnapshot = dehydrateValue(before.value)
      let lastUndoFrame: null | [string, number, string] = null
      let snapshot: string = currentSnapshot
      const newUndoStack = [...before.undoStack]
      while (snapshot === currentSnapshot) {
        if (newUndoStack.length === 0) {
          debug("Can't undo; already at earliest")
          return before
        }
        lastUndoFrame = newUndoStack.pop() as [string, number, string]
        [,,snapshot] = lastUndoFrame
      }
      if (lastUndoFrame !== null) {
        newUndoStack.push(lastUndoFrame)
      }
      return {
        value: hydrateString(snapshot),
        undoStack: newUndoStack,
        redoStack: [...before.redoStack, currentSnapshot],
      }
    })
  }

  function redo(): void {
    setState((before) => {
      // console.log("redo()", before.undoStack.length)
      const currentSnapshot = dehydrateValue(before.value)
      let snapshot: string = currentSnapshot
      const newRedoStack = [...before.redoStack]
      while (snapshot === currentSnapshot) {
        if (newRedoStack.length === 0) {
          debug("Can't redo; already at latest")
          return before
        }
        snapshot = newRedoStack.pop() as string
      }
      let newUndoStack = before.undoStack
      if (newUndoStack.length === 0 || newUndoStack[newUndoStack.length - 1][2] !== currentSnapshot) {
        newUndoStack = [...before.undoStack, [null, performance.now(), currentSnapshot]]
      }
      return {
        value: hydrateString(snapshot),
        undoStack: newUndoStack,
        redoStack: newRedoStack,
      }
    })
  }

  const publicSetValue: TaggedImmutableSetter<Hydrated> = (tag, transform) => {
    createUndoPoint(tag, transform)
  }

  return [state.value, publicSetValue]
}
