import "preact/debug";

import { render } from "preact";
import Editor from "./editor";
import { ProjectImagesProvider, ServerLiaison } from "./server-liaison";
import SvgPatterns from "./svg-patterns";
import { exerciseApi } from "./test";
import TestComponent from "./test-component";
import { TimeProvider } from "./time-context";

const slug = "edit"
const url = window.location.href
// Expecting URL of form /edit/my-project
const projectName = url.substring(url.indexOf(slug) + slug.length + 1)

Promise.resolve().then(() => exerciseApi())

window.onbeforeunload = function() {
    return true;
};

export default function EsbuildEditor() {
  const serverLiaison = new ServerLiaison(projectName)

  return <TimeProvider><ProjectImagesProvider server={serverLiaison}>
    <Editor
      server={serverLiaison}
    />
    <SvgPatterns />
    {/* <TestComponent /> */}
  </ProjectImagesProvider></TimeProvider>
}

render(<EsbuildEditor />, document.getElementById('app') as HTMLElement);
