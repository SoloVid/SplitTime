namespace SplitTime.image {
    var ROOT: string;
    defer(() => {
        ROOT = SLVD.getScriptDirectory() + "images/";
    });
    var map = {};
    var loadingPromises = {};
    
    /**
    * @param {string} relativePath
    * @param {string} [alias]
    * @param {boolean} [isPermanent]
    * @returns {SLVD.Promise}
    */
    export function load(relativePath, alias?, isPermanent = false) {
        if(relativePath in loadingPromises) {
            return loadingPromises[relativePath];
        }
        
        var promise = new SLVD.Promise();
        var loadingImage;
        
        function onLoad() {
            if(loadingImage.complete) {
                loadingImage.removeEventListener("load", onLoad);
                promise.resolve(loadingImage);
            }
        }
        
        if(!(relativePath in loadingPromises)) {
            loadingImage = new Image();
            loadingImage.addEventListener("load", onLoad);
            loadingImage.src = ROOT + relativePath;
            loadingPromises[relativePath] = promise;
            map[relativePath] = loadingImage;
            if(alias) {
                map[alias] = loadingImage;
            }
        }
        
        return promise;
    };
    
    /**
    * @param {string} name
    * @returns {HTMLImageElement}
    */
    export function get(name) {
        if(!map[name]) {
            SplitTime.image.load(name);
        }
        return map[name];
    };
}