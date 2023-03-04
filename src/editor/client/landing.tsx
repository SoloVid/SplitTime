import { instanceOfCollage } from "engine/file/collage";
import { instanceOfFileData as instanceOfLevelFileData } from "engine/world/level/level-file-data";
import { useEffect, useState } from "preact/hooks";
import { EditorType } from "./editor";
import FileBrowser from "./file-browser";
import { ServerLiaison } from "./server-liaison";
import { showError } from "./utils/prompt";

type LandingProps = {
  readonly server: ServerLiaison
  readonly openEditor: (filePath: string) => PromiseLike<void>
}

export default function Landing({
  server,
  openEditor,
}: LandingProps) {

  return <>
    <FileBrowser
          confirmActionText="Open"
          initialDirectory=""
          initialFileName=""
          rootDirectory=""
          server={server}
          showNew={true}
          showTextBox={false}
          title={"Select File"}
          onFileSelected={openEditor}
      />
  </>
}
