
/*
 * Launches a game after loading all resources.
 *
 * Example:
 *   var launcher = new AppLauncher(TheMainFunction);
 *   launcher.AddRemoteImage("Image1.png");
 *   launcher.AddRemoteImage("Image2.png");
 *   launcher.AddRemoteFile("GameData.xml");
 *   launcher.LoadRemoteDataAndRun();
 */
function AppLauncher(mainFunction) {
	this.NumImages = 0;
	this.NumImagesLoaded = 0;
	this.Images = new Array();
	
	this.NumFiles = 0;
	this.NumFilesLoaded = 0;
	this.Files = new Array();
	
	this.mainFunction = mainFunction;
}

/*
 * Image Management
 */

AppLauncher.prototype.AddRemoteImage = function (src) {
	var launcher = this;
	var innerImage = new Image();
	innerImage.onload = function () {
		console.log("Image Loaded: " + src);
        launcher._OnImageLoaded();
    }
	innerImage.onabort = function () {
		console.log("Image Load Aborted: " + src);
	}
	innerImage.onabort = function () {
		console.log("Image Load Failed: " + src);
	}
	this.Images[src] = innerImage;
	this.NumImages++;
}

AppLauncher.prototype.GetImage = function (imageName) {
	return this.Images[imageName];
}

AppLauncher.prototype._OnImageLoaded = function () {
    this.NumImagesLoaded++;
	this._RunMainFunctionIfEverythingIsLoaded();
}

/*
 * Generic File Management
 */

AppLauncher.prototype.AddRemoteFile = function (src) {
	var launcher = this;
	var httpRequest = new XMLHttpRequest();
	this.Files[src] = httpRequest;
	this.NumFiles++;
	httpRequest.onreadystatechange = function () {
		if (httpRequest.readyState == 4 && httpRequest.status == 200) {
			console.log("File Loaded: " + src);
			launcher._OnFileLoaded(httpRequest);
		} else if (httpRequest.readyState >= 2 ) {
			console.log("File ready state change: " + src + " (readyState=" + httpRequest.readyState + ", status code='" + httpRequest.status + ": " + httpRequest.statusText + "')"); 
			// console.log("File not loaded, readyState=" + httpRequest.readyState + ", status code=" + httpRequest.status + ": " + src); 
		} else {
			console.log("File ready state change: " + src + " (readyState=" + httpRequest.readyState + ")"); 
		}
	}
	httpRequest.open("GET", src, true);
}

AppLauncher.prototype.GetFile = function (src) {
	var httpRequest = this.Files[src];
	if (httpRequest == null) {
		return null;
	}
	if (httpRequest.readyState != 4 || httpRequest.status != 200) {
		return null;
	} else {
		return httpRequest.responseText;
	}
}

AppLauncher.prototype._OnFileLoaded = function (httpRequest) {
	this.NumFilesLoaded++;
	this._RunMainFunctionIfEverythingIsLoaded();
}

/*
 * Other Stuff
 */

AppLauncher.prototype.LoadRemoteDataAndRun = function () {
	for (var src in this.Images) {
	    this.Images[src].src = src;
	}
	for (var src in this.Files) {
	    this.Files[src].send();
	}
}

AppLauncher.prototype._RunMainFunctionIfEverythingIsLoaded = function () {
	if (this.NumImagesLoaded < this.NumImages) {
		return;
	}
	if (this.NumFilesLoaded < this.NumFiles) {
		return;
	}
	this.mainFunction();
}
