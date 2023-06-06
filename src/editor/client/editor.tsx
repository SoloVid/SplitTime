import { json } from "api/file"
import { error } from "api/system"
import { Collage as FileCollage, instanceOfCollage } from "engine/file/collage"
import { Immutable } from "engine/utils/immutable"
import { instanceOfFileData as instanceOfLevelFileData } from "engine/world/level/level-file-data"
import { useEffect, useState } from "preact/hooks"
import swal from "sweetalert"
import CodeEditor from "./code/code-editor"
import CollageEditor from "./collage/collage-editor"
import { exportJson } from "./editor-functions"
import { FileLevel } from "./file-types"
import LevelEditor from "./level/level-editor"
import MenuBar from "./menu-bar"
import { GlobalEditorPreferencesContextProvider, globalEditorPreferences } from "./preferences/global-preferences"
import { ServerLiaison } from "./server-liaison"
import { GlobalEditorShared } from "./shared-types"
import { showError } from "./utils/prompt"
import { EditorType } from "./editor-type"


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

  // const [onDeleteCallback, setOnDeleteCallback] = useState<{f: () => void}>({f:() => { }})

  // function setOnDelete(callback: () => void): void {
  //   setOnDeleteCallback({ f: callback })
  // }

  const [code, setCode] = useState<Immutable<string> | null>(null)
  const [collage, setCollage] = useState<Immutable<FileCollage> | null>(null)
  const [level, setLevel] = useState<FileLevel | null>(null)
  // const [triggerSettings, setTriggerSettings] = useState<{ f: () => void }>({ f: () => {} })

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

  // function editSettings(): void {
  //   triggerSettings.f()
  // }

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

  return <div
    className="editor"
    style="display: flex; flex-flow: column; height: 100vh;"
  >
    <GlobalEditorPreferencesContextProvider id={filePath}>
      <MenuBar></MenuBar>
      {!!code && <CodeEditor
        key={filePath}
        code={code}
        setCode={setCode}
        style="flex-grow: 1;"
      />}
      {!!collage && <CollageEditor
        key={filePath}
        id={filePath}
        collage={collage}
        setCollage={setCollage}
        style="flex-grow: 1; overflow: hidden;"
      />}
      { !!level && <LevelEditor
        key={filePath}
        id={filePath}
        level={level}
        setLevel={setLevel}
        style="flex-grow: 1; overflow: hidden;"
      />}
    </GlobalEditorPreferencesContextProvider>
  </div>
}