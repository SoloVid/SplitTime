namespace splitTime.editor.server {
    export class ApiServer implements serverLite.Server {
        private readonly editorTsApiBacking = new EditorTsApiBacking()
        private readonly apis: serverLite.Server[] = [
            this.editorTsApiBacking.api
        ]

        handle(url: string, body: file.jsonable): serverLite.ActualResponse {
            for (const api of this.apis) {
                const response = api.handle(url, body)
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
}