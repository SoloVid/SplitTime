namespace splitTime.editor.server {
    export class EditorTsApiBacking {
        public readonly api = new EditorTsApi()

        constructor() {
            this.api.test1.serve(request => "Here's your string! " + request)
            this.api.test2.serve(request => {
                return {
                    one: request + 7,
                    two: "himom"
                }
            })
        }
    }
}