namespace splitTime.editor.server {
    /**
     * One-stop shop for setting up a new set of API endpoints
     */
    export class TsApiHelper implements serverLite.Server<unknown, unknown> {
        private readonly middleware
        private nextId = 10

        constructor(private readonly url: string) {
            this.middleware = new TsApiMiddleware(url)
        }

        /**
         * Create a type-safe API endpoint
         */
        endpoint<RequestType, ResponseType>()
                : TsApiEndpoint<RequestType, ResponseType> {
            return new TsApiEndpoint(this.middleware, "" + this.nextId++)
        }

        /**
         * Inevitably, you'll still have to manually ask the server to pass along
         * web requests to you, so just let us do the dirty work for you.
         */
        handle(url: string, body: unknown): PromiseLike<serverLite.Response<unknown>> {
            return this.middleware.handle(url, body)
        }
    }
}