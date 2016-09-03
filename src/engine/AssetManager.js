SplitTime.images = {};
SplitTime.images.preloaded = {};
SplitTime.images.other = {};
SplitTime.images.blank = document.createElement("canvas");
SplitTime.images.blank.complete = true; //for loaded check

SplitTime.storeImage = function(relativePath, alias) {
	if(relativePath in SplitTime.images.preloaded || alias in SplitTime.images.preloaded)
	{
		console.log("You've already preloaded this image!!!");
		return;
	}

	SplitTime.images.preloaded[alias] = new Image();
	SplitTime.images.preloaded[alias].src = "images/" + relativePath;
};

SplitTime.getImage = function(relativePath) {
	if(!relativePath)
	{
		return SplitTime.images.blank;
	}

	if(relativePath in SplitTime.images.preloaded)
	{
		return SplitTime.images.preloaded[relativePath];
	}

	if(!(relativePath in SplitTime.images.other))
	{
		SplitTime.images.other[relativePath] = new Image();
		SplitTime.images.other[relativePath].src = "images/" + relativePath;
	}

	return SplitTime.images.other[relativePath];
};
