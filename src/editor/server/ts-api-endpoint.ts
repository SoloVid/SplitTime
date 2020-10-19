namespace splitTime.editor.server {
    /**
     * Type-safe interface between client and server for a web endpoint
     */
    export class TsApiEndpoint<RequestType, ResponseType> {

        constructor(
            private readonly middleware: TsApiMiddleware,
            private readonly id: string
        ) {}

        /**
         * Define how the server will handle a request to this endpoint.
         * Should only be called from the server.
         */
        serve(handler: (request: file.IsJsonable<RequestType>) => (file.IsJsonable<ResponseType> | PromiseLike<file.IsJsonable<ResponseType>>)): void {
            assert(__NODE__, "TsApiEndpoint#serve() should only be called from the server")
            this.middleware.serve(this.id, requestJson => {
                // Trust cast because object from #fetch()
                const request = requestJson as file.IsJsonable<RequestType>
                return handler(request)
            })
        }

        /**
         * Make a request to the server for this endpoint.
         * Should only be called from the client.
         */
        async fetch(request: file.IsJsonable<RequestType>): Promise<file.IsJsonable<ResponseType>> {
            assert(!__NODE__, "TsApiEndpoint#fetch() should only be called from the client")
            const responseJson = await this.middleware.fetch(this.id, request)
            // Trust cast because object from #serve()
            return responseJson as file.IsJsonable<ResponseType>
        }
    }
}