namespace splitTime.editor.server {
    export class EditorTsApi implements serverLite.Server<unknown, unknown> {
        private static readonly url = "/editor/ts-api"

        projectFiles: ProjectFileTsApi
        test1: TsApiEndpoint<string, string>
        test2: TsApiEndpoint<int, { one: number, two: string }>
        levelJson: TsApiEndpoint<
            WithProject<{ levelId: string }>,
            splitTime.level.FileData
        >
        imageInfo: TsApiEndpoint<
            WithProject<{ imageId: string }>,
            { webPath: string, timeModifiedString: string }
        >

        private helper: TsApiHelper

        constructor() {
            this.projectFiles = new ProjectFileTsApi(EditorTsApi.url)
            const a = this.helper = new TsApiHelper(EditorTsApi.url)
            this.test1 = a.endpoint()
            this.test2 = a.endpoint()
            this.levelJson = a.endpoint()
            this.imageInfo = a.endpoint()
        }

        handle(url: string, body: unknown): PromiseLike<serverLite.Response<unknown>> {
            return this.helper.handle(url, body)
        }
    }
}