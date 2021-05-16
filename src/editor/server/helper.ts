namespace splitTime.editor.server {
    export class Helper {
        public readonly pathHelper: PathHelper

        constructor(public readonly config: Config) {
            this.pathHelper = new PathHelper(config)
        }
    }
}