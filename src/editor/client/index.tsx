import "preact/debug";

import { render } from "preact";
import Editor, { detectEditorTypes, EditorType } from "./editor";
import { ProjectImagesProvider, ServerLiaison } from "./server-liaison";
import SvgPatterns from "./svg-patterns";
import { exerciseApi } from "./test";
import TestComponent from "./test-component";
import { TimeProvider } from "./time-context";
import { useEffect, useState } from "preact/hooks";
import { updatePageTitle } from "./editor-functions";
import Landing from "./landing";
import { showError } from "./utils/prompt";
import { error } from "api/system";

const editSlug = "edit"
const url = window.location.pathname
// Expecting URL of form /edit/path/to/file.ext
const urlPattern = /^\/edit(?:\/(?:([^/]+)(\/.+))?)?$/
const urlMatch = urlPattern.exec(url)
if (urlMatch === null) {
  showError(`URL ${url} didn't match expected pattern`)
  throw new Error(`URL ${url} didn't match expected pattern`)
}
const initialEditorType: EditorType | null = (urlMatch[1] as EditorType) ?? null
if (![null, "level", "collage", "code"].includes(initialEditorType)) {
  showError(`Unknown editor type: ${initialEditorType}`)
  throw new Error(`Unknown editor type: ${initialEditorType}`)
}
const initialFilePath: string | null = urlMatch[2] ?? null

Promise.resolve().then(() => exerciseApi())

window.onbeforeunload = function() {
    return true;
};

function App() {
  const server = new ServerLiaison("")

  const [loadingFile, setLoadingFile] = useState(false)
  const [editorType, setEditorType] = useState<EditorType | null>(initialEditorType)
  const [filePath, setFilePathDirect] = useState(initialFilePath)
  const [fileContents, setFileContents] = useState<string | null>(null)

  useEffect(() => {
    if (filePath) {
      openFile(filePath, editorType)
    }
  }, [])

  useEffect(() => {
    if (filePath !== null) {
      updatePageTitle(filePath)
    }
  }, [filePath])


  function setFilePathAndPageStuff(newFilePath: string, newEditorType: EditorType) {
    setEditorType(newEditorType)
    setFilePathDirect(newFilePath)
    const newUrl = `/${editSlug}/${newEditorType}${newFilePath}`
    if (newUrl !== window.location.pathname) {
      window.history.pushState(null, "", newUrl)
    }
  }

  async function openFile(newFilePath: string, explicitEditorType: EditorType | null) {
    try {
      setLoadingFile(true)
      const file = await server.api.projectFiles.readFile.fetch(server.withProject({ filePath: newFilePath }))
      const fileContents = atob(file.base64Contents)
      const newEditorType = (() => {
        if (explicitEditorType) {
          return explicitEditorType
        }
        const possibleEditorTypes = detectEditorTypes(fileContents)
        if (possibleEditorTypes.length === 0) {
          showError("Unable to find an appropriate editor for this file")
          // TODO: Remove when "text" is an actual EditorType
          return "text" as EditorType
        }
        return possibleEditorTypes[0]
      })()
      setFilePathAndPageStuff(newFilePath, newEditorType)
      setFileContents(fileContents)
    } catch (e) {
      showError(`Error opening file ${newFilePath}`)
      error(e)
    } finally {
      setLoadingFile(false)
    }
  }

  if (loadingFile) {
    return <>
      TODO: Loading Screen
    </>
  }

  if (editorType === null || filePath === null || fileContents === null) {
    return <Landing
      server={server}
      // openEditor={(editorType, filePath, fileContents) => {
      //   setEditorType(editorType)
      //   setFilePathAndPageStuff(filePath)
      //   setFileContents(fileContents)
      // }}
      openEditor={(filePath) => openFile(filePath, null)}
    ></Landing>
  }

  return <TimeProvider><ProjectImagesProvider server={server}>
    <Editor
      editorType={editorType}
      server={server}
      filePath={filePath}
      setFilePath={setFilePathAndPageStuff}
      initialFileContents={fileContents}
    />
    <SvgPatterns />
    {/* <TestComponent /> */}
  </ProjectImagesProvider></TimeProvider>
}

render(<App />, document.getElementById('app') as HTMLElement);
