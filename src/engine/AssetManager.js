SplitTime.Image = {};

SplitTime.Image.root = "images/";

SplitTime.Image.map = {};

SplitTime.Image.load = function(relativePath, alias, isPermanent) {
	var promise = new SLVD.Promise();
	var t;
	function onLoad() {
		if(t.complete) {
			t.removeEventListener("load", onLoad);
			promise.resolve(t);
		}
	}

	if(!(relativePath in SplitTime.Image.map)) {
		t = new Image();
		t.addEventListener("load", onLoad);
		t.src = SplitTime.Image.root + relativePath;
		SplitTime.Image.map[relativePath] = t;
		if(alias) {
			SplitTime.Image.map[alias] = t;
		}
	}
	else {
		promise.resolve(SplitTime.Image.map[relativePath]);
	}

	return promise;
};

SplitTime.Image.get = function(name) {
	if(!SplitTime.Image.map[name]) {
		SplitTime.Image.load(name);
	}
	return SplitTime.Image.map[name];
};
