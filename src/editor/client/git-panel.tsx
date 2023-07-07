import { useCallback, useEffect, useMemo, useState } from "preact/hooks"
import { ServerLiaison } from "./common/server-liaison"
import { Diff2HtmlUI, Diff2HtmlUIConfig } from 'diff2html/lib/ui/js/diff2html-ui-slim.js';
import { unknownToString } from "editor/player/console-text-helper";

type GitPanelProps = {
  server: ServerLiaison
}

export default function GitPanel({
  server,
}: GitPanelProps) {
  const [error, setError] = useState<unknown | null>(null)
  const [diffContents, setDiffContents] = useState<string | null>(null)
  useEffect(() => {
    server.api.git.diff.fetch(server.withProject({})).then((diff) => {
      setDiffContents(diff)
    }, (e) => {
      setError(e)
    })
  }, [])
  const diffElement = useMemo(() => {
    const div = document.createElement("div")
    if (diffContents === null) {
      return div
    }
    const ui = new Diff2HtmlUI(div, diffContents)
    ui.draw()
    ui.highlightCode()
    return div
  }, [diffContents])
  const diffContainerRef = useCallback((node: HTMLDivElement | null) => {
    if (node === null) {
      return
    }
    node.innerHTML = ""
    if (diffContents) {
      node.appendChild(diffElement)
    }
  }, [diffContents, diffElement])

  if (diffContents === null) {
    return <>loading...</>
  }
  if (error !== null) {
    return <>error {unknownToString(error)}</>
  }

  return <>
    <div
      style="display: flex; flex-direction: row; justify-content: end;"
    >
      {/* TODO: Implement take/restore snapshot */}
      {/* <a className="btn" title="Commit and push changes to git repository">Take Snapshot</a> */}
      {/* <a className="btn" title="Pull and do hard reset from git repository">Restore Snapshot</a> */}
    </div>
    <div ref={diffContainerRef}></div>
  </>
}
