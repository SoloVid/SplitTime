namespace splitTime.editor.server {
    export class ApiServer implements serverLite.Server {
        private readonly editorTsApiBacking = new EditorTsApiBacking()
        private readonly apis: serverLite.Server[] = [
            this.editorTsApiBacking.api
        ]

        async handle<T>(url: string, body: file.IsJsonable<T>): Promise<NonNullable<serverLite.Response>> {
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
}