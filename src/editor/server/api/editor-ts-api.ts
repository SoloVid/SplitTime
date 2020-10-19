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
        collageJson: TsApiEndpoint<
            WithProject<{ collageId: string }>,
            splitTime.file.Collage
        >
        imageInfo: TsApiEndpoint<
            WithProject<{ imageId: string }>,
            { webPath: string, timeModifiedString: string }
        >

        private helper: TsApiHelper

        constructor() {
            const a = this.helper = new TsApiHelper(EditorTsApi.url)
            this.projectFiles = new ProjectFileTsApi(EditorTsApi.url)
            this.test1 = a.endpoint()
            this.test2 = a.endpoint()
            this.levelJson = a.endpoint()
            this.collageJson = a.endpoint()
            this.imageInfo = a.endpoint()
        }

        async handle(url: string, body: unknown): Promise<serverLite.Response<unknown>> {
            const myResponse = await this.helper.handle(url, body)
            if (myResponse !== null) {
                return myResponse
            }
            return await this.projectFiles.handle(url, body)
        }
    }
}