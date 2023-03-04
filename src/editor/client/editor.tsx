import { assert } from "api"
import { keycode } from "api/controls"
import { json } from "api/file"
import { debug, error } from "api/system"
import { Collage as FileCollage, instanceOfCollage } from "engine/file/collage"
import { Immutable } from "engine/utils/immutable"
import { Pledge } from "engine/utils/pledge"
import { instanceOfFileData as instanceOfLevelFileData } from "engine/world/level/level-file-data"
import { useEffect, useState } from "preact/hooks"
import swal from "sweetalert"
import CodeEditor from "./code/code-editor"
import CollageEditor from "./collage/collage-editor"
import { exportJson, updatePageTitle } from "./editor-functions"
import FileBrowser from "./file-browser"
import { FileLevel } from "./file-types"
import { CheckboxInput, NumberInput } from "./input"
import LevelEditor from "./level/level-editor"
import { globalEditorPreferences } from "./preferences"
import { ServerLiaison } from "./server-liaison"
import { Followable, GlobalEditorShared } from "./shared-types"
import { showError } from "./utils/prompt"

export type EditorType = "level" | "collage" | "code"

export function detectEditorTypes(fileContents: string): readonly EditorType[] {
  try {
    const parsed = JSON.parse(fileContents)
    if (instanceOfLevelFileData(parsed)) {
      return ["level", "code"]
    }
    if (instanceOfCollage(parsed)) {
      return ["collage", "code"]
    }
  } catch (e) {
    // Do nothing.
  }
  return ["code"]
}

type FileBrowserReturnListener = {f: (filePath: string) => void}

type EditorProps = {
  readonly editorType: EditorType
  readonly server: ServerLiaison
  readonly filePath: string
  readonly setFilePath: (newFilePath: string, editorType: EditorType) => void
  readonly initialFileContents: string
}

export default function Editor({
  editorType,
  server,
  filePath,
  setFilePath,
  initialFileContents,
}: EditorProps) {
  useEffect(() => {
    window.onbeforeunload = function() {
      return true;
    }
  }, [])

  const [preferences, setPreferences] = globalEditorPreferences.use(filePath)
  const [followers, setFollowersInternal] = useState<readonly Followable[] | null>(null)
  const [previousFollowers, setPreviousFollowers] = useState<readonly Followable[] | null>(null)
  const [onDeleteCallback, setOnDeleteCallback] = useState<{f: () => void}>({f:() => { }})

  const gridCell = preferences.gridEnabled ? preferences.gridCell : { x: 1, y: 1 }

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
  const [showFileBrowser, setShowFileBrowser] = useState(false)
  const [mouse, setMouse] = useState({
    x: 0,
    y: 0,
    isDown: false
  })
  const [ctrlDown, setCtrlDown] = useState(false)
  const [code, setCode] = useState<Immutable<string> | null>(null)
  const [collage, setCollage] = useState<Immutable<FileCollage> | null>(null)
  const [level, setLevel] = useState<FileLevel | null>(null)
  const [triggerSettings, setTriggerSettings] = useState<{ f: () => void }>({ f: () => {} })

  const globalEditorStuff: GlobalEditorShared = {
    gridEnabled: preferences.gridEnabled,
    gridCell,
    scale: preferences.zoom / 100,
    server,
    userInputs: {
      mouse,
      ctrlDown,
    },
    openFileSelect,
    setFollowers,
    setOnDelete,
    setOnSettings(callback) {
      setTriggerSettings({f: callback})
    },
  }

  useEffect(() => {
    setCode(null)
    setLevel(null)
    setCollage(null)

    if (editorType === "code") {
      setCode(initialFileContents)
      return
    }

    const fileObject = JSON.parse(initialFileContents)
    if (editorType === "level") {
      setLevel(fileObject)
    } else if (editorType === "collage") {
      setCollage(fileObject)
    } else {
      throw new Error("Unrecognized editor type")
    }
  }, [editorType, initialFileContents])

  function editSettings(): void {
    triggerSettings.f()
  }

  function exportString(): json {
    if (editorType === "code" && code) {
      return code.replace(/\r\n/g, "\n")
    } else if (editorType === "level" && level) {
      return exportJson(level)
    } else if (editorType === "collage" && collage) {
      return exportJson(collage)
    } else {
      throw new Error("What are you trying to export?")
    }
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
  }

  function handleMouseUp(event: MouseEvent): void {
    setMouse({
      ...mouse,
      isDown: false
    })
    if (followers !== null) {
      setFollowers(null)
    }
  }

  function handleKeyDown(event: KeyboardEvent): void {
    if (event.which === keycode.S) {
      if (event.ctrlKey || ctrlDown) {
        doSave(filePath)
      }
      event.preventDefault()
    }

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
        onDeleteCallback.f()
        break;
      case keycode.CTRL:
      case keycode.SHIFT:
        setCtrlDown(true)
        break
      case keycode.LEFT:
        moveFollowers(-gridCell.x * globalEditorStuff.scale, 0)
        break
      case keycode.UP:
        moveFollowers(0, -gridCell.y * globalEditorStuff.scale)
        break
      case keycode.RIGHT:
        moveFollowers(gridCell.x * globalEditorStuff.scale, 0)
        break
      case keycode.DOWN:
        moveFollowers(0, gridCell.y * globalEditorStuff.scale)
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

  async function onServerFileSelected(newFilePath: string): Promise<void> {
    setShowFileBrowser(false)
    if (!newFilePath) {
      return
    }
    assert(fileBrowserReturnListener !== null, "Who is waiting for file browser?")
    fileBrowserReturnListener.f(newFilePath)
    setFileBrowserReturnListener(null)
  }

  async function doSave(savePath: string) {
    try {
      const fileContents = exportString()
      await server.api.projectFiles.writeFile.fetch(
        server.withProject({ filePath: savePath, base64Contents: btoa(fileContents), allowOverwrite: true })
      )
      await swal({
        title: "Saved!",
        timer: 200,
        buttons: false as any,
      })
    } catch (e) {
      error(e)
      showError("Error saving file")
    }
  }

  function openMainEdit(): void {
    window.open(`/edit`)
  }

  function openFileSave(): void {
    const lastSlash = filePath.lastIndexOf("/")
    const preloadDirectory = filePath.substring(0, lastSlash)
    const preloadFileName = filePath.substring(lastSlash + 1)
    setFileBrowserReturnListener({ f: async newFilePath => {
      doSave(newFilePath)
      setFilePath(newFilePath, editorType)
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
    setFileBrowserReturnListener({f: newFilePath => pledge.resolve(newFilePath)})
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
      <a onClick={openMainEdit}>Menu</a>
      <a onClick={openFileSave}>Save</a>
      {(collage || level) && <>
        <a onClick={editSettings}>Edit Settings</a>
        <label className="margin-right">
          Grid:
          <CheckboxInput value={preferences.gridEnabled} onChange={(b) => setPreferences((p) => ({...p, gridEnabled: b}))} />
        </label>
        {preferences.gridEnabled && <>
          <label className="margin-right">
            x:
            <NumberInput
              value={gridCell.x}
              onChange={(x) => setPreferences((p) => ({...p, gridCell: {...p.gridCell, x: x}}))}
              style="width: 48px;"
            />
          </label>
          <label className="margin-right">
            y:
            <NumberInput
              value={gridCell.y}
              onChange={(y) => setPreferences((p) => ({...p, gridCell: {...p.gridCell, y: y}}))}
              style="width: 48px;"
            />
          </label>
        </>}
        <label className="margin-right">
            Zoom:
            <NumberInput
              step={10}
              value={preferences.zoom}
              onChange={(z) => setPreferences((p) => ({...p, zoom: z}))}
              style="width: 48px;"
            />%
        </label>
      </>}
    </div>
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
    {!!code && <CodeEditor
      key={filePath}
      editorGlobalStuff={globalEditorStuff}
      code={code}
      setCode={setCode}
      style="flex-grow: 1;"
    />}
    {!!collage && <CollageEditor
      key={filePath}
      editorGlobalStuff={globalEditorStuff}
      collage={collage}
      setCollage={setCollage}
      style="flex-grow: 1; overflow: hidden;"
    />}
    { !!level && <LevelEditor
      key={filePath}
      id={filePath}
      editorGlobalStuff={globalEditorStuff}
      level={level}
      setLevel={setLevel}
      style="flex-grow: 1; overflow: hidden;"
    />}
  </div>
}