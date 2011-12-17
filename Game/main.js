
var launcher;
const LoopIntervalMS = 1000.0 / 60.0;

function Main(processing) {
	InitGame();
	setInterval(DrawGame, LoopIntervalMS);
}

launcher = new ProcessingLauncher(document.getElementById('GameCanvas'), Main);
launcher.AddRemoteImage("Assets/Images/Background_2.png");
launcher.AddRemoteImage("Assets/Images/Sunscape.png");
launcher.LoadRemoteImagesAndRun();
