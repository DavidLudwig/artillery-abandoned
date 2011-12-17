
/*
 * Launches a game after loading all resources.
 *
 * Example:
 *   var launcher = new AppLauncher(document.getElementById('TheCanvas'), TheMainFunction);
 *   launcher.AddRemoteImage("Image1.png");
 *   launcher.AddRemoteImage("Image2.png");
 *   launcher.LoadRemoteImagesAndRun();
 */
function AppLauncher(canvas, mainFunction) {
	this.NumImagesToLoad = 0;
	this.NumImagesLoaded = 0;
	this.ImagesToLoad = new Array();
	this.mainFunction = mainFunction;
	this.canvas = canvas;
}

AppLauncher.prototype.AddRemoteImage = function (src) {
	var launcher = this;
	var innerImage = new Image();
	innerImage.onload = function () {
        launcher._OnImageLoaded();
    }
	this.ImagesToLoad[src] = innerImage;
	this.NumImagesToLoad++;
}

AppLauncher.prototype.GetImage = function (imageName) {
	return this.ImagesToLoad[imageName];
}

AppLauncher.prototype._OnImageLoaded = function () {
    this.NumImagesLoaded++;
    if (this.NumImagesLoaded == this.NumImagesToLoad) {
		this.mainFunction();
    }
}

AppLauncher.prototype.LoadRemoteImagesAndRun = function () {
	for (var src in this.ImagesToLoad) {
	    this.ImagesToLoad[src].src = src;
	}
}
