namespace splitTime.editor.server {
    type Handler = (request: file.jsonable) => (file.jsonable | PromiseLike<file.jsonable>)

    interface IdRequest {
        id: string
        requestData: file.jsonable
    }

    export class TsApiMiddleware implements serverLite.Server {
        private readonly handlerMap: { [id: string]: Handler } = {}

        constructor(
            private readonly url: string
        ) {}

        serve(id: string, handler: Handler): void {
            if (!__NODE__) {
                throw new Error("Endpoints can only be served on Node server")
            }
            if (id in this.handlerMap) {
                throw new Error("Endpoint already registered")
            }
            this.handlerMap[id] = handler
        }

        async fetch(id: string, data: file.jsonable): Promise<file.jsonable> {
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
                throw new Error("Request failed")
            }
            
            return response.json() // parses JSON response into native JavaScript objects
        }

        async handle(url: string, body: file.jsonable): Promise<serverLite.Response> {
            if (url !== this.url) {
                return null
            }
            // Cast should be safe because it should have come from fetch()
            // FTODO: actually do type check
            const requestJson = body as unknown as IdRequest
            if (!(requestJson.id in this.handlerMap)) {
                return {
                    statusCode: 404,
                    responseBody: "Bad API ID " + requestJson.id
                }
            }
            try {
                const response = await this.handlerMap[requestJson.id](requestJson.requestData)
                return {
                    responseBody: response
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
}