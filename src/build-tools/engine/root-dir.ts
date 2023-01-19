import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

// const __filename = fileURLToPath(import.meta.url)
// const __dirname = dirname(__filename)

export const rootDir = join(__dirname, "..", "..", "..")
export default rootDir
