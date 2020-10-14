namespace splitTime.serverLite {
    export type ActualResponse = { statusCode?: int, responseBody: file.jsonable }
    export type Response = ActualResponse | null
    export type Handler = (url: string, body: file.jsonable) => Response
    export interface Server {
        handle: Handler
    }
}