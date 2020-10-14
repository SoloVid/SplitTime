/// <reference path="deps.d.ts" />

const PORT = 8080 // default port to listen

if (!__NODE__) {
    throw new Error("Can't run server unless in Node context!")
}

process.on('SIGINT', () => process.exit())

const express: typeof _dependencies.express = require( "express" )
const path: typeof _dependencies.path = require("path")
const app = express()

app.use(express.static(__ROOT__ + '/projects'))
app.use(express.static(__ROOT__))

const apiServer = new splitTime.editor.server.ApiServer()
app.post('*', express.json(), (req, res) => {
    const liteResponse = apiServer.handle(req.url, req.body)
    const statusCode = liteResponse.statusCode
    if (statusCode) {
        res.statusCode = statusCode
    }
    res.send(JSON.stringify(liteResponse.responseBody))
});

// Fallback to 404
app.get("*", (req, res) => {
    res.status(404).send("Sorry can't find that!")
})

// start the Express server
app.listen(PORT, () => {
    console.log( `server started at http://localhost:${ PORT }` )
})
