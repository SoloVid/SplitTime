namespace splitTime.editor.server {
    export class TsApiHelper implements serverLite.Server {
        private readonly middleware
        private nextId = 10

        constructor(private readonly url: string) {
            this.middleware = new TsApiMiddleware(url)
        }

        endpoint<Request extends file.jsonable, Response extends file.jsonable>()
                : TsApiEndpoint<Request, Response> {
            return new TsApiEndpoint(this.middleware, "" + this.nextId++)
        }

        handle(url: string, body: file.jsonable): PromiseLike<serverLite.Response> {
            return this.middleware.handle(url, body)
        }
    }
}