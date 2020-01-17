namespace SplitTime.image {
    var ROOT: string;
    defer(() => {
        ROOT = SLVD.getScriptDirectory() + "images/";
    });
    var map: { [relativePath: string]: HTMLImageElement } = {};
    var loadingPromises: { [relativePath: string]: Promise<HTMLImageElement> } = {};
    
    export function load(relativePath: string, alias?: string, isPermanent: boolean = false): Promise<HTMLImageElement> {
        if(relativePath in loadingPromises) {
            return loadingPromises[relativePath];
        }
        var promise = new Promise<HTMLImageElement>(resolve => {
            function onLoad() {
                if(loadingImage.complete) {
                    loadingImage.removeEventListener("load", onLoad);
                    resolve(loadingImage);
                }
            }
            
            const loadingImage = new Image();
            loadingImage.addEventListener("load", onLoad);
            loadingImage.src = ROOT + relativePath;
            map[relativePath] = loadingImage;
            if(alias) {
                map[alias] = loadingImage;
            }
        });

        loadingPromises[relativePath] = promise;
    
        return promise;
    };
    
    export function get(name: string): HTMLImageElement {
        if(!map[name]) {
            SplitTime.image.load(name);
            // TODO: throw exception?
        }
        return map[name];
    };
}