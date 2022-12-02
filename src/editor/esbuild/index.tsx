import "preact/debug"

import { render } from "preact"
import { useState } from "preact/hooks";
import { UnderlyingCacheObject } from "./cache";
import Editor from "./editor";
import { ServerLiaison } from "./server-liaison";
import SvgPatterns from "./svg-patterns";
import { exerciseApi } from "./test";
import TestComponent from "./test-component";

const slug = "edit"
const url = window.location.href
// Expecting URL of form /edit/my-project
const projectName = url.substring(url.indexOf(slug) + slug.length + 1)

Promise.resolve().then(() => exerciseApi())

// TODO: Re-enable confirmation
// window.onbeforeunload = function() {
//     return true;
// };

export default function EsbuildEditor() {
  const [serverCacheObject, setServerCacheObject] = useState<UnderlyingCacheObject<string>>({})
  const serverLiaison = new ServerLiaison(projectName, serverCacheObject, setServerCacheObject)

  return <>
    <Editor
      server={serverLiaison}
    />
    <SvgPatterns />
    {/* <TestComponent /> */}
  </>
}

render(<EsbuildEditor />, document.getElementById('app') as HTMLElement);
