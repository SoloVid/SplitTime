import { instanceOfCollage } from "engine/file/collage";
import { instanceOfFileData as instanceOfLevelFileData } from "engine/world/level/level-file-data";
import { useEffect, useState } from "preact/hooks";
import { EditorType } from "./editor";
import FileBrowser from "./file-browser/file-browser";
import GitPanel from "./git-panel";
import { onlyLeft } from "./utils/preact-help";
import { ServerLiaison } from "./common/server-liaison";
import { showError } from "./utils/prompt";

type LandingProps = {
  readonly server: ServerLiaison
  readonly openEditor: (filePath: string) => PromiseLike<void>
}

export default function Landing({
  server,
  openEditor,
}: LandingProps) {
  const [showGitPanel, setShowGitPanel] = useState(false)

  const gitPanelIcon = showGitPanel ? "fa-chevron-down" : "fa-chevron-right"

  return <>
    <FileBrowser
          confirmActionText="Open"
          initialDirectory=""
          initialFileName=""
          rootDirectory=""
          server={server}
          showNew={true}
          hideCancel={true}
          showTextBox={false}
          showUpload={true}
          title={"Select File"}
          onFileSelected={openEditor}
      />
    
    <div
      onClick={onlyLeft(() => setShowGitPanel(s => !s), true)}
      className="pointer"
      style="display: flex; flex-direction: row; align-items: baseline; justify-content: start;"
    >
      <i className={`fas fa-fw ${gitPanelIcon}`} aria-hidden="true"></i>
      <h4 style="margin: 0;">Git Snapshots</h4>
    </div>
    {showGitPanel && <GitPanel
      server={server}
    ></GitPanel>}
  </>
}
