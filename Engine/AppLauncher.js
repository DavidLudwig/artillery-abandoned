
/*
 * Launches a game after loading all resources.
 *
 * Example:
 *   var launcher = new AppLauncher(TheMainFunction);
 *   launcher.AddRemoteImage("Image1.png");
 *   launcher.AddRemoteImage("Image2.png");
 *   launcher.LoadRemoteImagesAndRun();
 */
function AppLauncher(mainFunction) {
	this.NumImages = 0;
	this.NumImagesLoaded = 0;
	this.Images = new Array();
	this.mainFunction = mainFunction;
}

AppLauncher.prototype.AddRemoteImage = function (src) {
	var launcher = this;
	var innerImage = new Image();
	innerImage.onload = function () {
        launcher._OnImageLoaded();
    }
	this.Images[src] = innerImage;
	this.NumImages++;
}

AppLauncher.prototype.GetImage = function (imageName) {
	return this.Images[imageName];
}

AppLauncher.prototype._OnImageLoaded = function () {
    this.NumImagesLoaded++;
    if (this.NumImagesLoaded == this.NumImages) {
		this.mainFunction();
    }
}

AppLauncher.prototype.LoadRemoteImagesAndRun = function () {
	for (var src in this.Images) {
	    this.Images[src].src = src;
	}
}
