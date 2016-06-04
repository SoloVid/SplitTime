SLVDE.images = {};
SLVDE.images.preloaded = {};
SLVDE.images.other = {};
SLVDE.images.blank = document.createElement("canvas");
SLVDE.images.blank.complete = true; //for loaded check

SLVDE.storeImage = function(relativePath, alias) {
	if(relativePath in SLVDE.images.preloaded || alias in SLVDE.images.preloaded)
	{
		console.log("You've already preloaded this image!!!");
		return;
	}

	SLVDE.images.preloaded[alias] = new Image();
	SLVDE.images.preloaded[alias].src = "images/" + relativePath;
};

SLVDE.getImage = function(relativePath) {
	if(!relativePath)
	{
		return SLVDE.images.blank;
	}

	if(relativePath in SLVDE.images.preloaded)
	{
		return SLVDE.images.preloaded[relativePath];
	}

	if(!(relativePath in SLVDE.images.other))
	{
		SLVDE.images.other[relativePath] = new Image();
		SLVDE.images.other[relativePath].src = "images/" + relativePath;
	}

	return SLVDE.images.other[relativePath];
};
