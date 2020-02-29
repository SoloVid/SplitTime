namespace splitTime.assets {
    export class Images {
        constructor(private readonly root: string) {}

        private map: { [relativePath: string]: HTMLImageElement } = {}
        private loadingPromises: {
            [relativePath: string]: Promise<HTMLImageElement>
        } = {}

        load(
            relativePath: string,
            alias?: string,
            isPermanent: boolean = false
        ): Promise<HTMLImageElement> {
            if (relativePath in this.loadingPromises) {
                return this.loadingPromises[relativePath]
            }
            var promise = new Promise<HTMLImageElement>(resolve => {
                function onLoad() {
                    if (loadingImage.complete) {
                        loadingImage.removeEventListener("load", onLoad)
                        resolve(loadingImage)
                    }
                }

                const loadingImage = new Image()
                loadingImage.addEventListener("load", onLoad)
                loadingImage.src = this.root + "/" + relativePath
                this.map[relativePath] = loadingImage
                if (alias) {
                    this.map[alias] = loadingImage
                }
            })

            this.loadingPromises[relativePath] = promise

            return promise
        }

        get(name: string): HTMLImageElement {
            if (!this.map[name]) {
                this.load(name)
                // TODO: throw exception?
            }
            return this.map[name]
        }
    }
}
