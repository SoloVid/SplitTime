SplitTime.Image = {};

(function() {
	var ROOT = "images/";
    var map = {};
    var loadingPromises = {};

    SplitTime.Image.load = function(relativePath, alias, isPermanent) {
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

    SplitTime.Image.get = function(name) {
        if(!map[name]) {
            SplitTime.Image.load(name);
        }
        return map[name];
    };
} ());
