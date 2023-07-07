// import "preact/debug";

import { render } from "preact";
import Editor from "./editor";
import { ProjectImagesProvider, ServerLiaison } from "./common/server-liaison";
import SvgPatterns from "./common/svg-patterns";
import { exerciseApi } from "./test";
import TestComponent from "./test-component";
import { TimeProvider } from "./time-context";
import { useEffect, useMemo, useState } from "preact/hooks";
import { updatePageTitle } from "./editor-functions";
import Landing from "./landing";
import { showError } from "./utils/prompt";
import { error } from "api/system";
import { prefixRawProjectFiles } from "editor/server/constants";
import { EditorType, detectEditorTypes } from "./editor-type";

const editSlug = "edit"

Promise.resolve().then(() => exerciseApi())

function App() {
  const server = new ServerLiaison("")

  const [loadingFile, setLoadingFile] = useState(true)
  const [editorType, setEditorType] = useState<EditorType | null>(null)
  const [filePath, setFilePathDirect] = useState<string | null>(null)
  const [fileContents, setFileContents] = useState<string | null>(null)

  function initFromUrl() {
    const url = window.location.pathname
    // Expecting URL of form /edit/editor-type/path/to/file.ext
    const urlPattern = /^\/edit(?:\/(?:([^/]+)(\/.+))?)?$/
    const urlMatch = urlPattern.exec(url)
    if (urlMatch === null) {
      showError(`URL ${url} didn't match expected pattern`)
      throw new Error(`URL ${url} didn't match expected pattern`)
    }
    const initialEditorType: EditorType | null = (urlMatch[1] as EditorType) ?? null
    setEditorType(initialEditorType)

    if (![null, "level", "collage", "code"].includes(initialEditorType)) {
      showError(`Unknown editor type: ${initialEditorType}`)
      throw new Error(`Unknown editor type: ${initialEditorType}`)
    }
    const initialFilePath: string | null = urlMatch[2] ?? null
    setFilePathDirect(initialFilePath)

    if (initialFilePath) {
      openFile(initialFilePath, initialEditorType)
    } else {
      setLoadingFile(false)
    }
  }

  useEffect(() => {
    initFromUrl()
  }, [])

  useEffect(() => {
    if (filePath !== null) {
      updatePageTitle(filePath)
    } else {
      updatePageTitle("Editor v2")
    }
  }, [filePath])

  function setFilePathAndPageStuff(newFilePath: string, newEditorType: EditorType) {
    setEditorType(newEditorType)
    setFilePathDirect(newFilePath)
    const newUrl = `/${editSlug}/${newEditorType}${newFilePath}`
    if (newUrl !== window.location.pathname) {
      window.location.href = newUrl
      // We would use pushState() here, but that doesn't provide us
      // with browser confirmation on back button.
      // window.history.pushState(null, "", newUrl)
    }
  }

  async function openFile(newFilePath: string, explicitEditorType: EditorType | null) {
    try {
      setLoadingFile(true)
      const file = await server.api.projectFiles.readFile.fetch(server.withProject({ filePath: newFilePath }))
      if (file.isBinaryFile) {
        window.location.href = `/${prefixRawProjectFiles}${newFilePath}`
        return
      }
      const fileContents = atob(file.base64Contents)
      const newEditorType = (() => {
        if (explicitEditorType) {
          return explicitEditorType
        }
        const possibleEditorTypes = detectEditorTypes(fileContents)
        if (possibleEditorTypes.length === 0) {
          showError("Unable to find an appropriate editor for this file")
          return "code"
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
