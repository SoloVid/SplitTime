import type { IsJsonable } from "engine/file/json"
import { __NODE__ } from "environment"
import type { int } from "globals"
import type { Response, Server } from "./server-lite"
import { Config } from "./config"
import { prefixRun, prefixStatic, prefixEngine, prefixEdit } from "./constants"
// import express = require("express")
import express from "express"
import path = require("path")
import { ApiServer } from "./api-server"

export const staticPath = "static"

export function runServer(port: int, config: Config): void {
    if (!__NODE__) {
        throw new Error("Can't run server unless in Node context!")
    }

    const app = express()

    const root = require("find-root")(__dirname)
    app.use(`/${prefixRun}`, express.static(config.sourceDirectory))
    app.use(`/${prefixStatic}`, express.static(path.join(root, staticPath)))
    app.use(`/${prefixEngine}`, express.static(root))

    app.get("/", async (req, res) => {
        res.sendFile(path.join(root, staticPath, "index.html"))
    })

    app.get([`/${prefixEdit}`, `/${prefixEdit}/*`], async (req, res) => {
        res.sendFile(path.join(root, staticPath, "editor.html"))
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
        console.log( `server started at http://localhost:${ port }` )
    })
}
