/// <reference path="deps.d.ts" />

if (!__NODE__) {
    throw new Error("Can't run server unless in Node context!")
}

process.on('SIGINT', () => process.exit())

const express: typeof _dependencies.express = require( "express" )
const path: typeof _dependencies.path = require("path")
// import express = require("express");
// import express from "express";
const app = express()
const port = 8080 // default port to listen

app.use(express.static('projects'))
app.use(express.static('.'))
// app.use(express.static(__dirname + '/projects'))
// app.use(express.static(__dirname))

const apiServer = new splitTime.editor.server.ApiServer()
app.post('*', express.json(), (req, res) => {
    const liteResponse = apiServer.handle(req.url, req.body)
    const statusCode = liteResponse.statusCode
    if (statusCode) {
        res.statusCode = statusCode
    }
    res.send(JSON.stringify(liteResponse.responseBody))
});

// define a route handler for the default home page
// app.get( "/", ( req, res ) => {
//     req.body
//     res.send( "Hello world!" )
// } );

// app.use('/static', express.static(path.join(__dirname)))
// app.use('/play', express.static('projects'))
// app.use(express.static('projects'))
// app.use('/static', express.static(path.join(__dirname)))

// FTODO: fallback to 404
// app.get("*", (req, res) => {
//     res.status(404).send("Sorry can't find that!")
// })

// start the Express server
app.listen(port, () => {
    console.log( `server started at http://localhost:${ port }` )
})
