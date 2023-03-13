import type { IsJsonable } from "engine/file/json"
import { Config } from "./config"
import { EditorTsApiBacking } from "./editor-ts-api-backing"
import type { Response, Server } from "./server-lite"

export class ApiServer implements Server {
    private readonly editorTsApiBacking
    private readonly apis: readonly Server[]

    constructor(config: Config) {
        this.editorTsApiBacking = new EditorTsApiBacking(config)
        this.apis = [
            this.editorTsApiBacking.api
        ]
    }

    async handle<T>(url: string, body: IsJsonable<T, true, true>): Promise<NonNullable<Response>> {
        for (const api of this.apis) {
            const response = await api.handle(url, body)
            if (response !== null) {
                return response
            }
        }
        return {
            statusCode: 404,
            responseBody: "API not found"
        }
    }
}
