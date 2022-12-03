import { assert } from "api"
import { keycode } from "api/controls"
import { json } from "api/file"
import { debug } from "api/system"
import { Collage as FileCollage, instanceOfCollage } from "engine/file/collage"
import { Immutable } from "engine/utils/immutable"
import { Pledge } from "engine/utils/pledge"
import { instanceOfFileData } from "engine/world/level/level-file-data"
import { useEffect, useState } from "preact/hooks"
import CollageEditor from "./collage/collage-editor"
import { exportJson, importLevel, updatePageTitle } from "./editor-functions"
import FileBrowser from "./file-browser"
import { FileLevel } from "./file-types"
import { CheckboxInput, NumberInput } from "./input"
import LevelEditor from "./level/level-editor"
import { ServerLiaison } from "./server-liaison"
import { Followable, GlobalEditorShared } from "./shared-types"

const UNDO_STACK_SIZE = 1000

type FileBrowserReturnListener = {f: (filePath: string) => void}

type EditorProps = {
  readonly server: ServerLiaison
}

export default function Editor({ server }: EditorProps) {
  const [gridEnabled, setGridEnabled] = useState(false)
  const [explicitGridCell, setExplicitGridCell] = useState({ x: 32, y: 32 })
  const [followers, setFollowersInternal] = useState<readonly Followable[] | null>(null)
  const [previousFollowers, setPreviousFollowers] = useState<readonly Followable[] | null>(null)
  const [onDeleteCallback, setOnDeleteCallback] = useState<{f: () => void}>({f:() => { }})
  const [undoStack, setUndoStack] = useState<readonly string[]>([])
  const [redoStack, setRedoStack] = useState<readonly string[]>([])

  const gridCell = gridEnabled ? explicitGridCell : { x: 1, y: 1 }

  function createUndoPoint(): void {
    if (!level && !collage) {
      return
    }
    const currentState = exportString()
    // Don't push if this is a duplicate state
    if (undoStack[undoStack.length - 1] === currentState) {
      return
    }
    const newUndoStack = [...undoStack, currentState]
    if (newUndoStack.length > UNDO_STACK_SIZE) {
      newUndoStack.shift()
    }
    setUndoStack(newUndoStack)
    setRedoStack([])
  }

  function undo(): void {
    const currentState = exportString()
    let state: string = currentState
    const newUndoStack = [...undoStack]
    while (state === currentState) {
      if (newUndoStack.length === 0) {
        debug("Can't undo; already at earliest")
        return
      }
      state = newUndoStack.pop() as string
    }
    setUndoStack(newUndoStack)
    setRedoStack([...redoStack, currentState])
    importString(state)
  }

  function redo(): void {
    const currentState = exportString()
    let state: string = currentState
    const newRedoStack = [...redoStack]
    while (state === currentState) {
      if (newRedoStack.length === 0) {
        debug("Can't redo; already at latest")
        return
      }
      state = newRedoStack.pop() as string
    }
    setRedoStack(newRedoStack)
    setUndoStack([...undoStack, currentState])
    importString(state)
  }

  function setFollowers(newFollowers: null | readonly Followable[]): void {
    setPreviousFollowers(followers)
    setFollowersInternal(newFollowers)
  }

  function setOnDelete(callback: () => void): void {
    setOnDeleteCallback({ f: callback })
  }

  const [fileBrowserConfirmActionText, setFileBrowserConfirmActionText] = useState("Select")
  const [fileBrowserReturnListener, setFileBrowserReturnListener] = useState(null as null | FileBrowserReturnListener)
  const [fileBrowserRoot, setFileBrowserRoot] = useState("")
  const [fileBrowserShowTextBox, setFileBrowserShowTextBox] = useState(false)
  const [fileBrowserStartDirectory, setFileBrowserStartDirectory] = useState("")
  const [fileBrowserStartFileName, setFileBrowserStartFileName] = useState("")
  const [fileBrowserTitle, setFileBrowserTitle] = useState("Select File")
  const [lastServerFile, setLastServerFile] = useState<string | null>(null)
  const [showFileBrowser, setShowFileBrowser] = useState(false)
  const [showNewDialog, setShowNewDialog] = useState(false)
  const [mouse, setMouse] = useState({
    x: 0,
    y: 0,
    isDown: false
  })
  const [ctrlDown, setCtrlDown] = useState(false)
  const [collage, setCollage] = useState<Immutable<FileCollage> | null>(null)
  const [level, setLevel] = useState<FileLevel | null>(null)
  const [triggerSettings, setTriggerSettings] = useState<{ f: () => void }>({ f: () => {} })

  const globalEditorStuff: GlobalEditorShared = {
    gridEnabled,
    gridCell,
    server,
    userInputs: {
      mouse,
      ctrlDown,
    },
    createUndoPoint,
    openFileSelect,
    setFollowers,
    setOnDelete,
    setOnSettings(callback) {
      setTriggerSettings({f: callback})
    },
  }

  function createCollage() {
    setShowNewDialog(false)
    if (collage) {
      if (!confirm("Are you sure you want to clear the current collage and create a new one?")) {
        return
      }
    }

    setCollage({
      image: "",
      frames: [],
      montages: [],
      defaultMontageId: ""
    })

    updatePageTitle("collage untitled")
  }

  function createLevel() {
    setShowNewDialog(false)
    if (level && level.groups.length > 0) {
      if (!confirm("Are you sure you want to clear the current level and create a new one?")) {
        return
      }
    }

    setLevel({
      type: "action",
      region: "",
      width: 640,
      height: 480,
      background: "",
      backgroundOffsetX: 0,
      backgroundOffsetY: 0,
      groups: [],
      traces: [],
      props: [],
      positions: [],
    })
    updatePageTitle("level untitled")
  }

  function editSettings(): void {
    triggerSettings.f()
  }

  function exportString(): json {
    if (level) {
      return exportJson(level)
    } else if (collage) {
      return exportJson(collage)
    } else {
      throw new Error("What are you trying to export?")
    }
  }

  function importString(file: json): void {
    setLevel(null)
    setCollage(null)
    // Promise.resolve().then(() => {
    const fileObject = JSON.parse(file)
    if (instanceOfFileData(fileObject)) {
      setLevel(importLevel(file))
    } else if (instanceOfCollage(fileObject)) {
      setCollage(fileObject)
    } else {
      throw new Error("Unrecognized file type")
    }
    // })
  }

  function moveFollowers(dx: number, dy: number, fallbackToPrevious: boolean = true): void {
    let toMove = followers
    if (fallbackToPrevious && toMove === null) {
      toMove = previousFollowers
    }
    if (toMove === null) {
      toMove = []
    }
    for (const t of toMove) {
      t.shift(dx, dy)
    }
  }

  function handleMouseMove(event: MouseEvent): void {
    setMouse((before) => {
      const newX = Math.round(event.pageX)
      const newY = Math.round(event.pageY)
      const oldX = before.x
      const oldY = before.y
      const dx = newX - oldX
      const dy = newY - oldY
      moveFollowers(dx, dy, false)
      return {
        ...before,
        x: newX,
        y: newY,
      }
    })
    // TODO: prevent default?
  }

  function handleMouseDown(event: MouseEvent): void {
    setMouse({
      ...mouse,
      isDown: true
    })
    createUndoPoint()
  }

  function handleMouseUp(event: MouseEvent): void {
    setMouse({
      ...mouse,
      isDown: false
    })
    if (followers !== null) {
      setFollowers(null)
    }
    createUndoPoint()
  }

  function handleKeyDown(event: KeyboardEvent): void {
    // TODO: resolve types
    const element = event.target as any
    switch (element.tagName.toLowerCase()) {
      case "input":
      case "textarea":
        return
    }
    const ctrlKey = event.ctrlKey || event.metaKey

    var specialKey = true
    switch (event.which) {
      case keycode.DEL:
        createUndoPoint()
        onDeleteCallback.f()
        createUndoPoint()
        break;
      case keycode.Z:
        if (ctrlKey) {
          undo()
        }
        break;
      case keycode.Y:
        if (ctrlKey) {
          redo()
        }
        break;
      case keycode.CTRL:
      case keycode.SHIFT:
        setCtrlDown(true)
        break
      case keycode.LEFT:
        moveFollowers(-gridCell.x, 0)
        break
      case keycode.UP:
        moveFollowers(0, -gridCell.y)
        break
      case keycode.RIGHT:
        moveFollowers(gridCell.x, 0)
        break
      case keycode.DOWN:
        moveFollowers(0, gridCell.y)
        break
      default:
        specialKey = false
    }

    if (specialKey) {
      event.preventDefault()
    }
  }

  function handleKeyUp(event: KeyboardEvent): void {
    if (event.which == keycode.SHIFT || event.which === keycode.CTRL) {
      setCtrlDown(false)
    } else if (event.which == keycode.ESC) {
      if (level !== null) {
        debug("export of level JSON:")
        debug(level)
      } else if (collage !== null) {
        debug("export of collage JSON:")
        debug(collage)
      } else {
        debug("nothing to export")
      }
    }
  }

  async function onServerFileSelected(filePath: string): Promise<void> {
    setShowFileBrowser(false)
    if (!filePath) {
      return
    }
    assert(fileBrowserReturnListener !== null, "Who is waiting for file browser?")
    fileBrowserReturnListener.f(filePath)
    setFileBrowserReturnListener(null)
  }

  function openFileOpen(): void {
    setFileBrowserReturnListener({ f: async filePath => {
      setLastServerFile(filePath)
      const response = await server.api.projectFiles.readFile.fetch(
        server.withProject({ filePath }))
      const contents = atob(response.base64Contents)
      try {
        importString(contents)
        updatePageTitle(filePath)
      } catch (e: unknown) {
        alert("Editing this file type is not supported. Is it possible your data is corrupted?")
      }
    } })
    setFileBrowserTitle("Open File")
    setFileBrowserConfirmActionText("Open")
    setFileBrowserRoot("")
    setFileBrowserStartDirectory("")
    setFileBrowserShowTextBox(false)
    setShowFileBrowser(true)
  }

  function openFileSave(): void {
    let preloadDirectory = ""
    let preloadFileName = ""
    if (lastServerFile !== null) {
      const lastSlash = lastServerFile.lastIndexOf("/")
      preloadDirectory = lastServerFile.substring(0, lastSlash)
      preloadFileName = lastServerFile.substring(lastSlash + 1)
    }
    setFileBrowserReturnListener({ f: async filePath => {
      setLastServerFile(filePath)
      const fileContents = exportString()
      await server.api.projectFiles.writeFile.fetch(
        server.withProject({ filePath, base64Contents: btoa(fileContents) })
      )
      updatePageTitle(filePath)
    } })
    setFileBrowserTitle("Save File As")
    setFileBrowserConfirmActionText("Save")
    setFileBrowserRoot("")
    setFileBrowserStartDirectory(preloadDirectory)
    setFileBrowserShowTextBox(true)
    setFileBrowserStartFileName(preloadFileName)
    setShowFileBrowser(true)
  }

  function openFileSelect(rootDirectory: string): PromiseLike<string> {
    const pledge = new Pledge()
    setFileBrowserReturnListener({f: filePath => pledge.resolve(filePath)})
    setFileBrowserTitle("Select File")
    setFileBrowserConfirmActionText("Select")
    setFileBrowserRoot(rootDirectory)
    setFileBrowserStartDirectory(rootDirectory)
    setFileBrowserShowTextBox(false)
    setShowFileBrowser(true)
    return pledge
  }

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  })

  return <div
    onMouseMove={handleMouseMove}
    onMouseDown={handleMouseDown}
    onMouseUp={handleMouseUp}
    className="editor"
    style="display: flex; flex-flow: column; height: 100vh;"
  >
    <div className="menu-bar">
      <a onClick={() => setShowNewDialog(true)}>New</a>
      <a onClick={openFileOpen}>Open</a>
      <a onClick={openFileSave}>Save</a>
      <a onClick={editSettings}>Edit Settings</a>
      <label>
        Grid:
        <CheckboxInput value={gridEnabled} onChange={setGridEnabled} />
      </label>
      {gridEnabled && <label>
        x:
        <NumberInput value={gridCell.x} onChange={(newValue) => setExplicitGridCell({...gridCell, x: newValue})} style="width: 48px;"/>
      </label>}
      {gridEnabled && <label>
        y:
        <NumberInput value={gridCell.y} onChange={(newValue) => setExplicitGridCell({...gridCell, y: newValue})} style="width: 48px;"/>
      </label>}
    </div>
    {showNewDialog && <div className="modal-backdrop">
      <div className="modal-body">
        <p><strong>What do you want to create?</strong></p>
        <div>
          <a className="btn" onClick={createLevel}>New Level</a>
          <a className="btn" onClick={createCollage}>New Collage</a>
          <a className="btn" onClick={() => setShowNewDialog(false)}>Cancel</a>
        </div>
      </div>
    </div>}
    {showFileBrowser && <div className="modal-backdrop">
      <div className="modal-body">
        <FileBrowser
              confirmActionText={fileBrowserConfirmActionText}
              initialDirectory={fileBrowserStartDirectory}
              initialFileName={fileBrowserStartFileName}
              rootDirectory={fileBrowserRoot}
              server={server}
              showTextBox={fileBrowserShowTextBox}
              title={fileBrowserTitle}
              onFileSelected={onServerFileSelected}
          />
      </div>
    </div>}
    {!!collage && <CollageEditor
      key={lastServerFile}
      editorGlobalStuff={globalEditorStuff}
      collage={collage}
      setCollage={setCollage}
      style="flex-grow: 1; overflow: hidden;"
    />}
    { !!level && <LevelEditor
      key={lastServerFile}
      editorGlobalStuff={globalEditorStuff}
      level={level}
      setLevel={setLevel}
      style="flex-grow: 1; overflow: hidden;"
    />}
  </div>
}