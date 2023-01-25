import "preact/debug";

import { render } from "preact";
import Editor from "./editor";
import { ProjectImagesProvider, ServerLiaison } from "./server-liaison";
import SvgPatterns from "./svg-patterns";
import { exerciseApi } from "./test";
import TestComponent from "./test-component";
import { TimeProvider } from "./time-context";
import { useEffect, useState } from "preact/hooks";
import { updatePageTitle } from "./editor-functions";

const slug = "edit"
const url = window.location.href
// Expecting URL of form /edit/path/to/file.ext
const initialFilePath = url.substring(url.indexOf(slug) + slug.length)

Promise.resolve().then(() => exerciseApi())

window.onbeforeunload = function() {
    return true;
};

function App() {
  const serverLiaison = new ServerLiaison("")

  const [filePath, setFilePathDirect] = useState(initialFilePath.length > 1 ? initialFilePath : null)
  useEffect(() => {
    if (filePath !== null) {
      updatePageTitle(filePath)
    }
    // We're not making `filePath` a dependency and only running this once atm
    // because new files get "untitled <type>" titles manually set by Editor.
    // At some point, we should refactor that to consolidate title management.
  }, [])

  function setFilePathAndPageStuff(newFilePath: string) {
    setFilePathDirect(newFilePath)
    window.history.replaceState(null, "", `/${slug}${newFilePath}`)
    updatePageTitle(newFilePath)
  }

  return <TimeProvider><ProjectImagesProvider server={serverLiaison}>
    <Editor
      server={serverLiaison}
      filePath={filePath}
      setFilePath={setFilePathAndPageStuff}
    />
    <SvgPatterns />
    {/* <TestComponent /> */}
  </ProjectImagesProvider></TimeProvider>
}

render(<App />, document.getElementById('app') as HTMLElement);
