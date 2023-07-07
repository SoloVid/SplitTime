import { parse } from "ansicolor"
import { useEffect, useState } from "preact/hooks"
import { MultilineStringInput } from "../client/common/input"
import { onlyLeft } from "../client/utils/preact-help"
import { ConsoleDrawerState, ConsoleEntry } from "./player-state"
import stringify from "json-stringify-safe"
import { unknownToString } from "./console-text-helper"

type ConsoleDrawerProps = {
  state: ConsoleDrawerState
  setState: (modify: (oldState: ConsoleDrawerState) => ConsoleDrawerState) => void
}

export default function ConsoleDrawer({ state, setState }: ConsoleDrawerProps) {
  // const [height, setHeight] = useState(200)
  const [mouseY, setMouseY] = useState<number | null>(null)
  const [trackingResize, setTrackingResize] = useState(false)
  const [promptInput, setPromptInput] = useState("")

  useEffect(() => {
    if (!trackingResize) {
      return
    }
    const listener = (e: MouseEvent) => {
      // console.log("mouse moved")
      setMouseY((prevY) => {
        if (prevY !== null) {
          const dy = e.clientY - prevY
          setState(old => ({...old, height: old.height - dy}))
        }
        return e.clientY
      })
    }
    window.addEventListener("mousemove", listener)
    return () => window.removeEventListener("mousemove", listener)
  }, [trackingResize])

  useEffect(() => {
    if (trackingResize) {
      const listener = () => {
        setTrackingResize(false)
      }
      window.addEventListener("mouseup", listener)
      return () => window.removeEventListener("mouseup", listener)
    }
  }, [trackingResize])

  function trackResize(e: MouseEvent) {
    setMouseY(e.clientY)
    setTrackingResize(true)
  }

  function handleTextAreaKeyUp(e: KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      const expression = promptInput
      setState(old => ({
        ...old,
        entries: [
          makeEntryFromExpression(expression),
          { entryType: "in", text: expression },
          ...old.entries,
        ]
      }))
      setPromptInput("")
      // setTimeout(() => setPromptInput(""), 500)
      e.preventDefault()
    }
  }

  function makeEntryFromExpression(expression: string): ConsoleEntry {
    try {
      const result = (0, eval)(`"use strict";(${expression})`)
      return { entryType: "out", text: stringify(result, null, 2) }
    } catch (e) {
      return { entryType: "error", text: unknownToString(e) }
    }
  }

  return <div className="console-drawer" style={`height: ${state.height}px;`}>
    <div
      className="resizer"
      onMouseDown={onlyLeft(trackResize, true)}
    ></div>
    <div className="toolbar">
      <small><em>F12 for full DevTools (desktop)</em></small>
      <span
        className="icon-button"
        title="Close console drawer"
        onClick={onlyLeft(() => setState(old => ({...old, isVisible: false})))}
      >✖</span>
    </div>
    <div className="content">
      <div className="entry prompt"><MultilineStringInput value={promptInput} onChange={setPromptInput} onKeyUp={handleTextAreaKeyUp}></MultilineStringInput></div>
      {state.entries.map(entry => (<div className={`entry ${entry.entryType}`}>
        <pre>{parse(entry.text).spans.map(spanInfo => <span style={spanInfo.css}>{spanInfo.text}</span>)}</pre>
        {/* <div dangerouslySetInnerHTML={{ __html: entry.text }}></div> */}
      </div>))}
    </div>
  </div>
}
