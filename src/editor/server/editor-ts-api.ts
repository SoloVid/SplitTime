namespace splitTime.editor.server {
    export class EditorTsApi implements serverLite.Server {
        private static readonly url = "/editor/ts-api"

        test1: TsApiEndpoint<string, string>
        test2: TsApiEndpoint<int, { one: number, two: string }>
        levelJson: TsApiEndpoint<
            WithProject<{ levelId: string }>,
            file.MadeJsonable<splitTime.level.FileData>
        >
        imageInfo: TsApiEndpoint<
            WithProject<{ imageId: string }>,
            { webPath: string, timeModifiedString: string }
        >

        private helper: TsApiHelper

        constructor() {
            const a = this.helper = new TsApiHelper(EditorTsApi.url)
            this.test1 = a.endpoint()
            this.test2 = a.endpoint()
            this.levelJson = a.endpoint()
            this.imageInfo = a.endpoint()
        }

        handle(url: string, body: file.jsonable): PromiseLike<serverLite.Response> {
            return this.helper.handle(url, body)
        }
    }
}