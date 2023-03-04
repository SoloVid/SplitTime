import { distDirectory, distGameJsFileName } from "build-tools/project/constants"
import express from "express"
import type { int } from "globals"
import { readFile } from "node:fs/promises"
import path from "node:path"
import { ApiServer } from "./api-server"
import { Config } from "./config"
import { prefixEdit, prefixEngine, prefixPlay, prefixStatic, prefixTest } from "./constants"
import { ensurePosixPath } from "./path-helper"

export const staticPath = "static"

export function runServer(port: int, config: Config): void {
    const app = express()

    const root = require("find-root")(__dirname)
    app.use(`/${prefixPlay}`, express.static(path.join(config.projectDirectory, distDirectory)))
    app.use(`/${prefixStatic}`, express.static(path.join(root, staticPath)))
    app.use(`/${prefixEngine}`, express.static(root))

    app.get("/", async (req, res) => {
        res.sendFile(path.join(root, staticPath, "index.html"))
    })

    app.get([`/${prefixEdit}`, `/${prefixEdit}/*`], async (req, res) => {
        res.sendFile(path.join(root, staticPath, "editor.html"))
    })

    const gameScriptPath = `/${prefixPlay}/${ensurePosixPath(distGameJsFileName)}`
    app.get([`/${prefixTest}`, `/${prefixTest}/*`], async (req, res) => {
        const playerHtml = await readFile(path.join(root, staticPath, "player.template.html"), "utf-8")
        const customizedPlayerHtml = playerHtml.replace(/\{gameScript\}/g, gameScriptPath)
        res.send(customizedPlayerHtml)
    })

    const apiServer = new ApiServer(config)
    app.post('*', express.json() as express.RequestHandler, async (req, res) => {
        const liteResponse = await apiServer.handle<unknown>(req.url, req.body)
        if ("statusCode" in liteResponse) {
            res.statusCode = liteResponse.statusCode
        }
        res.send(JSON.stringify(liteResponse.responseBody))
    })

    // Fallback to 404
    app.get("*", (req, res) => {
        res.status(404).send("Sorry can't find that!")
    })

    // start the Express server
    app.listen(port, () => {
        console.info(`Server listening on port \x1b[33m${port}\x1b[0m (\x1b[36mhttp://localhost:${port}\x1b[0m)`)
    })
}
