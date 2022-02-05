if (!__NODE__) {
    throw new Error("Can't run server unless in Node context!")
}

try {
    const port = 80 //parseInt(process.argv[2], 10)
    const sourceDirectory = "."// process.argv[3] || "."

    splitTime.editor.server.runServer(port, {
        sourceDirectory
    })
} catch (e: unknown) {
    console.error(e)
    // process.exit(1)
}
