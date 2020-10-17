namespace splitTime.editor.server {
    export class TsApiHelper implements serverLite.Server<unknown, unknown> {
        private readonly middleware
        private nextId = 10

        constructor(private readonly url: string) {
            this.middleware = new TsApiMiddleware(url)
        }

        endpoint<RequestType, ResponseType>()
                : TsApiEndpoint<RequestType, ResponseType> {
            return new TsApiEndpoint(this.middleware, "" + this.nextId++)
        }

        handle(url: string, body: unknown): PromiseLike<serverLite.Response<unknown>> {
            return this.middleware.handle(url, body)
        }
    }
}