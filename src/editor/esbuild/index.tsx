// import { createRoot } from 'react-dom/client'

// import React from "preact"
import { render } from "preact"
import Editor from "./editor";
import { ServerLiaison } from "./server-liaison";
import SvgPatterns from "./svg-patterns";

var slug = "edit"
var url = window.location.href
// Expecting URL of form /edit/my-project
var projectName = url.substring(url.indexOf(slug) + slug.length + 1)
var serverLiaison = new ServerLiaison(projectName);

window.onbeforeunload = function() {
    return true;
};

export default function EsbuildEditor() {
  return <>
    <Editor
      server={serverLiaison}
    />
    <SvgPatterns />
  </>
}

// const container = document.getElementById('app')
// const root = createRoot(container)
// root.render(<EsbuildEditor />)

render(<EsbuildEditor />, document.getElementById('app') as HTMLElement);
