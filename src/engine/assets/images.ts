import { error } from "engine/utils/logger";
import { getErrorPlaceholderImageUrl } from "./placeholder-image";

export type ImageRef = {
    load: () => Promise<HTMLImageElement>
    get: () => HTMLImageElement
}
export class Images {
    constructor(private readonly root: string) { }
    private map: {
        [relativePath: string]: HTMLImageElement;
    } = {};
    private loadingPromises: {
        [relativePath: string]: Promise<HTMLImageElement>;
    } = {};
    /**
     * @deprecated Use {@link get2} instead
     */
    load(relativePath: string, alias?: string, isPermanent: boolean = false): Promise<HTMLImageElement> {
        if (relativePath in this.loadingPromises) {
            return this.loadingPromises[relativePath];
        }
        var promise = new Promise<HTMLImageElement>(resolve => {
            function onLoad() {
            }
            const loadingImage = new Image();
            loadingImage.addEventListener("load", () => {
                if (loadingImage.complete) {
                    loadingImage.removeEventListener("load", onLoad);
                    resolve(loadingImage);
                }
            });
            loadingImage.addEventListener("error", (e) => {
                error(`Error loading image ${relativePath}:`, e)
                loadingImage.src = getErrorPlaceholderImageUrl("Error loading image")
            })
            if (/^[a-z]+:/.test(relativePath)) {
                loadingImage.src = relativePath
            } else {
                loadingImage.src = this.root + "/" + relativePath;
            }
            this.map[relativePath] = loadingImage;
            if (alias) {
                this.map[alias] = loadingImage;
            }
        });
        this.loadingPromises[relativePath] = promise;
        return promise;
    }
    /**
     * @deprecated Use {@link get2} instead
     */
     get(name: string): HTMLImageElement {
        if (!this.map[name]) {
            this.load(name);
            // TODO: throw exception?
        }
        return this.map[name];
    }
    get2(relativePath: string, alias?: string, isPermanent: boolean = false): ImageRef {
        return {
            load: () => this.load(relativePath, alias, isPermanent),
            get: () => this.get(relativePath),
        }
    }
}
