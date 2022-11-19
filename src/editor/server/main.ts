import { __NODE__ } from "environment"
import { runServer } from "./launch"

if (!__NODE__) {
    throw new Error("Can't run server unless in Node context!")
}

try {
    const port = parseInt(process.argv[2], 10)
    const sourceDirectory = process.argv[3] || "."

    runServer(port, {
        sourceDirectory
    })
} catch (e: unknown) {
    console.error(e)
    process.exit(1)
}
