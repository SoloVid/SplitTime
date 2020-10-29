namespace splitTime.serverLite {
    type AllowedResponseCodes = 404 | 500
    export type ErrorResponse = { statusCode: AllowedResponseCodes, responseBody: string }
    export type DataResponse<T = unknown> = { responseBody: file.IsJsonable<T> }
    export type Response<T = unknown> = DataResponse<T> | ErrorResponse | null
    export type Handler<RequestType, ResponseType> = (url: string, body: file.IsJsonable<RequestType>) => PromiseLike<Response<ResponseType>>
    export interface Server<RequestType = unknown, ResponseType = unknown> {
        handle: Handler<RequestType, ResponseType>
    }
}