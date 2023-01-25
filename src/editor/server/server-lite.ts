import type { IsJsonable } from "engine/file/json"

type AllowedResponseCodes = 404 | 500
export type ErrorResponse = { statusCode: AllowedResponseCodes, responseBody: string }
export type DataResponse<T = unknown> = { responseBody: IsJsonable<T, true, true> }
export type Response<T = unknown> = DataResponse<T> | ErrorResponse | null
export type Handler<RequestType, ResponseType> = (url: string, body: IsJsonable<RequestType, true, true>) => PromiseLike<Response<ResponseType>>
export interface Server<RequestType = unknown, ResponseType = unknown> {
    handle: Handler<RequestType, ResponseType>
}
