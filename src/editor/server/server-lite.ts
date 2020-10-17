namespace splitTime.serverLite {
    export type ErrorResponse = { statusCode: 404 | 500, responseBody: string }
    export type DataResponse<T = unknown> = { responseBody: file.IsJsonable<T> }
    export type ActualResponse<T = unknown> = DataResponse<T> | ErrorResponse
    export type Response<T = unknown> = ActualResponse<T> | null
    export type Handler<RequestType, ResponseType> = (url: string, body: file.IsJsonable<RequestType>) => PromiseLike<Response<ResponseType>>
    export interface Server<RequestType = unknown, ResponseType = unknown> {
        handle: Handler<RequestType, ResponseType>
    }
}