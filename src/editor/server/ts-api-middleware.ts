import type { IsJsonable } from "engine/file/json"
import { __NODE__ } from "environment"
import type { Response, Server } from "./server-lite"

type Handler<RequestType, ResponseType> = (request: RequestType) => (ResponseType | PromiseLike<ResponseType>)

interface IdRequest<T> {
    id: string
    requestData: IsJsonable<T>
}

/**
 * Type-unsafe backing for {@link TsApiEndpoint} to handle client/server communications
 *
 * Really, almost no one should touch this class's interface.
 * Use {@link TsApiEndpoint} or {@link TsApiHelper} instead.
 */
export class TsApiMiddleware implements Server<unknown, unknown> {
    private readonly handlerMap: { [id: string]: Handler<IsJsonable<unknown>, IsJsonable<unknown>> } = {}

    constructor(
        private readonly url: string
    ) {}

    serve<RequestType, ResponseType>(id: string, handler: Handler<IsJsonable<RequestType>, IsJsonable<ResponseType>>): void {
        if (!__NODE__) {
            throw new Error("Endpoints can only be served on Node server")
        }
        if (id in this.handlerMap) {
            throw new Error("Endpoint already registered")
        }
        // FTODO: re-evaluate this type-cast
        this.handlerMap[id] = handler as Handler<unknown, unknown>
    }

    async fetch<RequestType, ResponseType>(id: string, data: IsJsonable<RequestType>): Promise<IsJsonable<ResponseType>> {
        if (__NODE__) {
            throw new Error("Endpoints can only be fetched from client")
        }
        const requestJson = {
            id: id,
            requestData: data
        }
        const response = await fetch(this.url, {
            method: 'POST',
            cache: 'no-cache',
            headers: {
                'Content-Type': 'application/json'
            },
            redirect: 'follow',
            referrerPolicy: 'no-referrer',
            body: JSON.stringify(requestJson)
        })
        if (response.status > 399) {
            throw new Error("Request failed: " + response.text())
        }

        // Trust cast because from #handle()
        return response.json()
    }

    async handle<RequestType, ResponseType>(url: string, body: IsJsonable<RequestType>):
            Promise<Response<ResponseType>> {
        if (url !== this.url) {
            return null
        }
        // FTODO: actually do type check
        // Trust cast because from #fetch()
        const requestJson = body as unknown as IdRequest<RequestType>
        if (!(requestJson.id in this.handlerMap)) {
            return {
                statusCode: 404,
                responseBody: "Bad API ID " + requestJson.id
            }
        }
        try {
            const response = await this.handlerMap[requestJson.id](requestJson.requestData)
            return {
                responseBody: response as unknown as IsJsonable<ResponseType>
            }
        } catch (e: unknown) {
            console.log(e)
            return {
                statusCode: 500,
                responseBody: "Server error"
            }
        }
    }
}
