import { json } from "api/file"
import { error } from "api/system"
// import { Collage as FileCollage, instanceOfCollage } from "engine/file/collage"
import { Immutable } from "engine/utils/immutable"
import { instanceOfFileData as instanceOfLevelFileData } from "engine/world/level/level-file-data"
import { useContext, useEffect, useState } from "preact/hooks"
import swal from "sweetalert"
// import CodeEditor from "./code/code-editor"
import CollageEditor from "./collage/collage-editor"
import { exportJson } from "./editor-functions"
import { FileCollage, FileLevel } from "./file-types"
import LevelEditor from "./level/level-editor"
import MenuBar from "./common/menu-bar"
import { GlobalEditorPreferencesContext, GlobalEditorPreferencesContextProvider, globalEditorPreferences } from "./preferences/global-preferences"
import { ServerLiaison } from "./common/server-liaison"
import { showError } from "./utils/prompt"
import { EditorType } from "./editor-type"
import YAML from "yaml"
import { UserInputsContextProvider } from "./common/user-inputs"
import EditorFrame from "./editor-frame"
import RenderCounter from "./utils/render-counter"
import { FilePopupContext } from "./file-browser/file-popup"

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

  return <EditorFrame
    editorPreferencesId={filePath}
    server={server}
  >
    <RenderCounter debugLabel="Editor"></RenderCounter>
    <EditorContent
      editorType={editorType}
      server={server}
      filePath={filePath}
      setFilePath={setFilePath}
      initialFileContents={initialFileContents}
    ></EditorContent>
  </EditorFrame>
}

type EditorContentProps = {
  readonly editorType: EditorType
  readonly server: ServerLiaison
  readonly filePath: string
  readonly setFilePath: (newFilePath: string, editorType: EditorType) => void
  readonly initialFileContents: string
}

export type SaveOptions = {
  filter?: RegExp
  nonInteractive?: boolean
}
export type DoSave = (contents: string, options?: SaveOptions) => void

function EditorContent({
  editorType,
  server,
  filePath,
  setFilePath,
  initialFileContents,
}: EditorContentProps) {
  const [globalPrefs, setGlobalPrefs] = useContext(GlobalEditorPreferencesContext)

  const [code, setCode] = useState<Immutable<string> | null>(null)
  const [collage, setCollage] = useState<Immutable<FileCollage> | null>(null)
  const [level, setLevel] = useState<FileLevel | null>(null)

  useEffect(() => {
    setCode(null)
    setLevel(null)
    setCollage(null)

    if (editorType === "code") {
      setCode(initialFileContents)
      return
    }

    const fileObject = YAML.parse(initialFileContents)
    if (editorType === "level") {
      setLevel(fileObject)
    } else if (editorType === "collage") {
      setCollage(fileObject)
    } else {
      throw new Error("Unrecognized editor type")
    }
  }, [editorType, initialFileContents])

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

  async function doSave(contents: string, savePath: string) {
    try {
      // const fileContents = exportString()
      await server.api.projectFiles.writeFile.fetch(
        server.withProject({ filePath: savePath, base64Contents: btoa(contents), allowOverwrite: true })
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

  const filePopupControls = useContext(FilePopupContext)
  function openFileSave(contents: string, options: SaveOptions = {}): void {
    // const filter = level !== null ? /\.lvl\.yml$/ : (collage !== null ? /\.clg\.yml$/ : undefined)
    getSaveFilePath(options).then((newFilePath) => {
      doSave(contents, newFilePath)
      setFilePath(newFilePath, editorType)
    }, (e) => {
      // TODO: Handle error better
      console.error(e)
    })
  }
  async function getSaveFilePath(options: SaveOptions) {
    if (options.nonInteractive) {
      return filePath
    }

    const lastSlash = filePath.lastIndexOf("/")
    const preloadDirectory = filePath.substring(0, lastSlash)
    const preloadFileName = filePath.substring(lastSlash + 1)
    return await filePopupControls.showFileSelectPopup({
      title: "Save File As",
      confirmActionText: "Save",
      root: "",
      startDirectory: preloadDirectory,
      showTextBox: true,
      filter: options.filter,
      startFileName: preloadFileName,
    })
  }

  return <>
    {/* <MenuBar
      editSettings={() => setGlobalPrefs((before) => ({...before, propertiesPath: []}))}
      openFileSave={openFileSave}
    ></MenuBar> */}
    {/* {!!code && <CodeEditor
      key={filePath}
      code={code}
      setCode={setCode}
      style="flex-grow: 1;"
    />} */}
    {!!collage && <CollageEditor
      key={filePath}
      id={filePath}
      collage={collage}
      doSave={openFileSave}
      server={server}
      setCollage={setCollage}
      style="flex: 1; overflow: hidden;"
    />}
    { !!level && <LevelEditor
      key={filePath}
      id={filePath}
      doSave={openFileSave}
      server={server}
      level={level}
      setLevel={setLevel}
      style="flex: 1; overflow: hidden;"
    />}
  </>
}
