
var launcher;
const LoopIntervalMS = 1000.0 / 60.0;

function Destroy(object, deadObjects) {
	deadObjects.push(object);
}

function CollectGarbage(liveObjects, deadObjects) {
	for (var i = 0; i < deadObjects.length; i++) {
		for (var j = 0; j < liveObjects.length; j++) {
			if (deadObjects[i] == liveObjects[j]) {
				liveObjects.splice(j, 1);
			}
		}
	}
	deadObjects.splice(0, deadObjects.length);
}

var FixedUpdateCount = 0;
function AdvanceTime() {
	var currentTime = Millis();
	
	if (FixedUpdateCount == 0) {
		//TimeMgr.AdvanceToTime(currentTime - FixedUpdateIntervalMS);
		TimeMgr._currentTime = currentTime - FixedUpdateIntervalMS;	// HACK: set time to a potentially negative value (if so, it will be made positive shortly)
		TimeMgr.Resume();
	}
	
	//console.log("AdvanceTime: " + currentTime);
	TimeMgr.AdvanceToTime(currentTime);
}

function UpdateAndDraw() {
	// Process Input
	ProcessInput();

	// Advance Time
	AdvanceTime();
	
	// Draw
	var canvas = document.getElementById("GameCanvas");
	if (canvas.getContext) {
		var ctx = canvas.getContext("2d");	
		Draw(ctx);
	}
	
	// Cleanup
	CleanupFromUpdate();
}

function Millis() {
	return Date.now() - StartTimeMS;
}

function Main() {
	console.log("All Assets Loaded");
	
	window.addEventListener('keydown', HandleKeyDown, true);
	StartTimeMS = Date.now();
	
	// Reset time manager
	TimeMgr = new FixedUpdater();
	TimeMgr.Pause();
	TimeMgr.AddCallback(FixedUpdateIntervalMS, function () {
		FixedUpdateCount++;
		FixedUpdate();
	});

	console.log("Initializing Game")
	InitGame();
	
	console.log("Starting Main Loop")
	setInterval(UpdateAndDraw, LoopIntervalMS);
}

launcher = new AppLauncher();

if (typeof(ImagesToLoad) == "object") {
	for (idx in ImagesToLoad) {
		var remoteImagePath = ImagesToLoad[idx];
		console.log("Loading Image: " + remoteImagePath)
		launcher.AddRemoteImage(remoteImagePath);
	}
}
if (typeof(FilesToLoad) == "object") {
	for (idx in FilesToLoad) {
		var remoteFilePath = FilesToLoad[idx];
		console.log("Loading File: " + remoteFilePath)
		launcher.AddRemoteFile(remoteFilePath);
	}
}
if (typeof(GameParametersFile) == "string") {
	console.log("Loading File: " + GameParametersFile);
	launcher.AddRemoteFile(GameParametersFile);
}

launcher.LoadRemoteDataAndRun(Main);
