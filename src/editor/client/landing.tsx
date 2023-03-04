import { instanceOfCollage } from "engine/file/collage";
import { instanceOfFileData as instanceOfLevelFileData } from "engine/world/level/level-file-data";
import { useEffect, useState } from "preact/hooks";
import { EditorType } from "./editor";
import FileBrowser from "./file-browser";
import { ServerLiaison } from "./server-liaison";
import { showError } from "./utils/prompt";

type LandingProps = {
  readonly server: ServerLiaison
  // readonly filePath: string | null
  // readonly setFilePath: (newFilePath: string) => void
  // readonly openEditor: (editorType: EditorType, filePath: string, fileContents: string) => void
  readonly openEditor: (filePath: string) => PromiseLike<void>
}

export default function Landing({
  server,
  openEditor,
}: LandingProps) {


  // async function openFile(path: string) {
  //   setLoadingFile(true)
  //   const file = await server.api.projectFiles.readFile.fetch(server.withProject({ filePath: path }))
  //   const fileContents = atob(file.base64Contents)
  //   const possibleEditorTypes = detectEditorTypes(fileContents)
  //   if (possibleEditorTypes.length === 0) {
  //     showError("Unable to find an appropriate editor for this file")
  //     return
  //   }
  //   openEditor(possibleEditorTypes[0], path, fileContents)
  // }

  return <>
    <FileBrowser
          confirmActionText="Open"
          initialDirectory=""
          initialFileName=""
          rootDirectory=""
          server={server}
          showTextBox={false}
          title={"Select File"}
          onFileSelected={openEditor}
      />
  </>
}
