
/*
 * Launches a Processing.js context after loading all resources.
 *
 * Example:
 *   var launcher = new ProcessingLauncher(document.getElementById('TheCanvas'), TheSketchFunction);
 *   launcher.AddRemoteImage("Image1.png");
 *   launcher.AddRemoteImage("Image2.png");
 *   launcher.LoadRemoteImagesAndRun();
 */
function ProcessingLauncher(canvas, sketchProc) {
	this.NumImagesToLoad = 0;
	this.NumImagesLoaded = 0;
	this.ImagesToLoad = new Array();
	this.sketch = new Processing.Sketch(sketchProc);
	this.canvas = canvas;
	this.processingContext = null;
}

ProcessingLauncher.prototype.AddRemoteImage = function (src) {
	var launcher = this;
	var innerImage = new Image();
	innerImage.onload = function () {
        launcher.sketch.imageCache.add(src, innerImage);
        launcher._OnImageLoaded();
    }
	this.ImagesToLoad[src] = innerImage;
	this.NumImagesToLoad++;
}

ProcessingLauncher.prototype.GetImage = function (imageName) {
	return this.ImagesToLoad[imageName];
}

ProcessingLauncher.prototype._OnImageLoaded = function () {
    this.NumImagesLoaded++;
    if (this.NumImagesLoaded == this.NumImagesToLoad) {
		this.processingContext = new Processing(this.canvas, this.sketch);
    }
}

ProcessingLauncher.prototype.LoadRemoteImagesAndRun = function () {
	for (var src in this.ImagesToLoad) {
	    this.ImagesToLoad[src].src = src;
	}
}
