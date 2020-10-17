namespace splitTime.editor.server {
    export class TsApiEndpoint<RequestType, ResponseType> {

        constructor(
            private readonly middleware: TsApiMiddleware,
            private readonly id: string
        ) {}

        serve(handler: (request: file.IsJsonable<RequestType>) => (file.IsJsonable<ResponseType> | PromiseLike<file.IsJsonable<ResponseType>>)): void {
            this.middleware.serve(this.id, requestJson => {
                // Trust cast because object from #fetch()
                const request = requestJson as file.IsJsonable<RequestType>
                return handler(request)
            })
        }

        async fetch(request: file.IsJsonable<RequestType>): Promise<file.IsJsonable<ResponseType>> {
            const responseJson = await this.middleware.fetch(this.id, request)
            // Trust cast because object from #serve()
            return responseJson as file.IsJsonable<ResponseType>
        }
    }
}