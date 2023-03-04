import { streamToBuffer } from "build-tools/common/stream-helper"
import { distDirectory, distGameJsFileName } from "build-tools/project/constants"
import express from "express"
import { assert, int } from "globals"
import { readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { ApiServer } from "./api-server"
import { Config } from "./config"
import { prefixEdit, prefixEngine, prefixPlay, prefixRawProjectFiles, prefixStatic, prefixTest, uploadEndpoint } from "./constants"
import { ensurePosixPath } from "./path-helper"
import multer from "multer"
import { fileExists } from "./project-file-ts-api-backing"

export const staticPath = "static"

export function runServer(port: int, config: Config): void {
    const app = express()

    const root = require("find-root")(__dirname)
    // TODO: This will definitely have to get tightened up if sharing a server.
    app.use(`/${prefixRawProjectFiles}`, express.static(config.projectDirectory))
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

    const upload = multer()
    app.post([uploadEndpoint], upload.single("file"), async (req, res) => {
        try {
            const directoryPath = JSON.parse(req.header("x-directory-path") ?? "")
            const projectId = JSON.parse(req.header("x-project-id") ?? "")
            assert(!!req.file, "File should have been uploaded")
            const fileName = req.file.originalname
            const fileContents = req.file.buffer
            const targetPath = path.join(config.projectDirectory, directoryPath, fileName)
            if (await fileExists(targetPath)) {
                return res.status(409).send(`file ${targetPath} already exists`)
            }
            await writeFile(targetPath, fileContents)
            return res.status(200).send("success")
        } catch (e) {
            console.error(e)
            return res.status(500).send("server error (check server logs)")
        }
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
