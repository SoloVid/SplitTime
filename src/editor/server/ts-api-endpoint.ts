namespace splitTime.editor.server {
    export class TsApiEndpoint<Request extends file.jsonable, Response extends file.jsonable> {

        constructor(
            private readonly middleware: TsApiMiddleware,
            private readonly id: string
        ) {}

        serve(handler: (request: Request) => (Response | PromiseLike<Response>)): void {
            this.middleware.serve(this.id, requestJson => {
                const request = requestJson as Request
                return handler(request)
            })
        }

        async fetch(request: Request): Promise<Response> {
            const responseJson = await this.middleware.fetch(this.id, request)
            return responseJson as Response
        }
    }
}