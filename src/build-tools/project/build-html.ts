import { join, writeFile } from "../common/file-helper"
import {
  distGameJsFileName,
  distHtmlFile
} from "./constants"

const gameTemplateHtml = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Game</title>
    <style>
      html, body, .full-screen {
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
        background-color: black;
      }
      #game-view {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }
    </style>
  </head>
  <body>
    <div id="game-view" class="full-screen"></div>
    <script src="{gameScript}"></script>
    <script>
        window.launchGame("game-view")
    </script>
  </body>
</html>
`

export async function generateProjectHtml(projectRoot: string): Promise<void> {
  // TODO: Cache-bust script?
  const html = gameTemplateHtml.replace(/\{gameScript\}/g, distGameJsFileName).trimStart()
  await writeFile(join(projectRoot, distHtmlFile), html)
}
