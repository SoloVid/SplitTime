import { __NODE__ } from "environment"
import { runServer } from "./launch"

if (!__NODE__) {
    throw new Error("Can't run server unless in Node context!")
}

try {
    const port = process.argv.slice(2).reduce((found, arg) => {
        if (found !== null) {
            return found
        }
        if (/^\d+$/.test(arg)) {
            return parseInt(arg, 10)
        }
        return null
    }, null as null | number) ?? 8080
    // const sourceDirectory = process.argv[3] || "."
    const projectDirectory = "."

    runServer(port, {
        projectDirectory: projectDirectory
    })
} catch (e: unknown) {
    console.error(e)
    process.exit(1)
}
