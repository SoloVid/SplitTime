import type { IsJsonable } from "engine/file/json"
import { __NODE__ } from "environment"
import { assert } from "globals"
import { TsApiMiddleware } from "./ts-api-middleware"

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
    serve(handler: (request: IsJsonable<RequestType, true, true>) => (IsJsonable<ResponseType, true, true> | PromiseLike<IsJsonable<ResponseType, true, true>>)): void {
        assert(__NODE__, "TsApiEndpoint#serve() should only be called from the server")
        this.middleware.serve(this.id, requestJson => {
            // Trust cast because object from #fetch()
            const request = requestJson as IsJsonable<RequestType, true, true>
            return handler(request)
        })
    }

    /**
     * Make a request to the server for this endpoint.
     * Should only be called from the client.
     */
    async fetch(request: IsJsonable<RequestType, true, true>): Promise<IsJsonable<ResponseType, true, true>> {
        assert(!__NODE__, "TsApiEndpoint#fetch() should only be called from the client")
        const responseJson = await this.middleware.fetch(this.id, request)
        // Trust cast because object from #serve()
        return responseJson as IsJsonable<ResponseType, true, true>
    }
}
