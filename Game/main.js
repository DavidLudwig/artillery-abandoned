
var launcher;

function Main(processing) {
	Game(processing);
}

launcher = new ProcessingLauncher(document.getElementById('GameCanvas'), Main);
launcher.AddRemoteImage("Assets/Images/Background_2.png");
launcher.AddRemoteImage("Assets/Images/Sunscape.png");
launcher.LoadRemoteImagesAndRun();
