
var ImagesToLoad = [
	"Game/Assets/Images/Background_2.png",
	"Game/Assets/Images/Sunscape.png"
];

var FilesToLoad = [
];

// Game States
var GameStates = {
	"INITIALIZING" : "INITIALIZING",
	"PLAYING" : "PLAYING",
	"GAME_OVER" : "GAME_OVER"
};

var GameState = null;
function SetGameState(theState) {
	if (GameState == theState) {
		return;
	}
	//console.log("New game state: " + theState);
	GameState = theState;
}

function SpawnMonster() {
	var x = RandNum(SpawnXMin, SpawnXMax);
	var monsterXStep = RandNum(MonsterXStepMin, MonsterXStepMax);
	var monster = new Tank(x, 0, "red", DefaultAngle, DefaultPower, false, MonsterWidth, -1, monsterXStep);
	MoveTank(monster, 0);	// make sure it's on the ground
	Tanks.push(monster);
}

// Angle + Power management
function getAngleFromView() {
	var angle = parseInt(document.getElementById("AngleValue").innerHTML);
	if (isNaN(angle)) {
		console.log("Unable to parse angle: " + document.getElementById("AngleValue").innerHTML)
		return 0;
	}
	return angle;
}

function GameAngleToViewAngle(inAngle) {
	var outAngle;
	if (inAngle < -90) {
		outAngle = (inAngle * -1);
		outAngle = 180 - outAngle;
	} else {
		outAngle = (inAngle * -1);
	}
	return outAngle;
}

function setAngleToView(value, isRealAngle) {
	var displayedValue;
	if (isRealAngle == true) {
		displayedValue = value;
	} else {
		displayedValue = GameAngleToViewAngle(value);			
	}
	document.getElementById("AngleValue").innerHTML = displayedValue;
}

function getPowerFromView() {
	var power = parseInt(document.getElementById("PowerValue").innerHTML);
	if (isNaN(power)) {
		console.log("Unable to parse power: " + document.getElementById("PowerValue").innerHTML)
		return 0;
	}
	return power;
}

function GamePowerToViewPower(inPower) {
	var outPower = (inPower * GamePowerToViewPowerFactor);
	return outPower;
}

function setPowerToView(value) {
	var displayedValue = GamePowerToViewPower(value);
	document.getElementById("PowerValue").innerHTML = displayedValue;
}

function UpdateViewFromModel() {
	if (CurrentTank == null) {
		setAngleToView(0, true);
		setPowerToView(0, true);
	} else {
		setAngleToView(CurrentTank.angle);
		setPowerToView(CurrentTank.power);
	}
}

function UpdateModelFromView() {
	if (CurrentTank) {
		CurrentTank.angle = getAngleFromView();
		CurrentTank.power = getPowerFromView();
	}
}

// UI Handlers

document.getElementById('AngleMinusMinus').onmousedown = function () { AngleMinusMinusDown = true; }
document.getElementById('AngleMinusMinus').onmouseup = function () { AngleMinusMinusDown = false; }
document.getElementById('AngleMinus').onmousedown = function () { AngleMinusDown = true; }
document.getElementById('AngleMinus').onmouseup = function () { AngleMinusDown = false; }
document.getElementById('AnglePlus').onmousedown = function () { AnglePlusDown = true; }
document.getElementById('AnglePlus').onmouseup = function () { AnglePlusDown = false; }
document.getElementById('AnglePlusPlus').onmousedown = function () { AnglePlusPlusDown = true; }
document.getElementById('AnglePlusPlus').onmouseup = function () { AnglePlusPlusDown = false; }
	
document.getElementById('PowerMinusMinus').onmousedown = function () { PowerMinusMinusDown = true; }
document.getElementById('PowerMinusMinus').onmouseup = function () { PowerMinusMinusDown = false; }
document.getElementById('PowerMinus').onmousedown = function () { PowerMinusDown = true; }
document.getElementById('PowerMinus').onmouseup = function () { PowerMinusDown = false; }
document.getElementById('PowerPlus').onmousedown = function () { PowerPlusDown = true; }
document.getElementById('PowerPlus').onmouseup = function () { PowerPlusDown = false; }
document.getElementById('PowerPlusPlus').onmousedown = function () { PowerPlusPlusDown = true; }
document.getElementById('PowerPlusPlus').onmouseup = function () { PowerPlusPlusDown = false; }

document.getElementById('FireButton').onclick = function() {
	if (CurrentTank == null) {
		return;
	}
	
	var tmpContext = ShotLayer.getContext("2d");
	tmpContext.fillStyle = "transparent black";
	tmpContext.fillRect(ShotLayer.width, ShotLayer.height);
	tmpContext = null;
	
	CurrentTank.fire();
}

function HandleKeyDown(evt) {
	//console.log("keydown: " + evt + ", keyCode=" + evt.keyCode + "; charCode=" + evt.charCode);
	switch (evt.keyCode) {
		case KeyCodes.Left:
			//console.log("left");
			MoveTank(Tanks[1], -1);
			break;
		
		case KeyCodes.Right:
			//console.log("right");
			MoveTank(Tanks[1], 1);
			break;
		
		case KeyCodes.Down:
			//console.log("down");
			AdjustTankDownward(Tanks[1]);
			break;
	}
}

function ProcessInput() {
	if (Millis() < ProcessInputsAfterAppTimeMS) {
		//console.log("ignoring inputs: cur=" + Millis() + "; next=" + ProcessInputsAfterAppTimeMS);
		return;
	}

	var doViewUpdate = false;
			
	if (CurrentTank) {
		if (PowerPlusPlusDown) {
			CurrentTank.power += PowerIncrementBig;
			if (CurrentTank.power > MaxGamePower) {
				CurrentTank.power = MaxGamePower;
			}
			doViewUpdate = true;
		} else if (PowerPlusDown) {
			CurrentTank.power += PowerIncrementSmall;
			if (CurrentTank.power > MaxGamePower) {
				CurrentTank.power = MaxGamePower;
			}
			doViewUpdate = true;
		} else if (PowerMinusDown) {
			CurrentTank.power -= PowerIncrementSmall;
			if (CurrentTank.power < 0) {
				CurrentTank.power = 0;
			}
			doViewUpdate = true;
		} else if (PowerMinusMinusDown) {
			CurrentTank.power -= PowerIncrementBig;
			if (CurrentTank.power < 0) {
				CurrentTank.power = 0;
			}
			doViewUpdate = true;
		}
	
		if (AnglePlusPlusDown) {
			CurrentTank.angle += AngleIncrementBig;
			if (CurrentTank.angle > 0) {
				CurrentTank.angle = -180;
			}
			doViewUpdate = true;
		} else if (AnglePlusDown) {
			CurrentTank.angle++;
			if (CurrentTank.angle > 0) {
				CurrentTank.angle = -180;
			}
			doViewUpdate = true;
		} else if (AngleMinusDown) {
			CurrentTank.angle--;
			if (CurrentTank.angle < -180) {
				CurrentTank.angle = 0;
			}
			doViewUpdate = true;
		} else if (AngleMinusMinusDown) {
			CurrentTank.angle -= AngleIncrementBig;
			if (CurrentTank.angle < -180) {
				CurrentTank.angle = 0;		// BUG: set to higher than 0 if CurrentTank.angle was considerably less than -180
			}
			doViewUpdate = true;
		}
	}
	
	if (doViewUpdate) {
		//console.log(CurrentTank.angle);
		UpdateViewFromModel();
		ProcessInputsAfterAppTimeMS = Millis() + InputIntervalInMS;
	}		
}

// Init game
function InitGame() {
	SetGameState(GameStates.INITIALIZING);
	
	// Load Game Parameters
	if (typeof(GameParametersFile) == "string") {
		console.log("Loading Game Parameters From File: " + GameParametersFile);
		var rawData = launcher.GetFile(GameParametersFile);
		var parser = new DOMParser();
		var xmlData = parser.parseFromString(rawData, "text/xml");
		console.log("Game Parameters:");
		console.log(xmlData);
	}
	
	// Retrieve images
	Background_2_Image = launcher.GetImage("Game/Assets/Images/Background_2.png");
	Sunscape_Image = launcher.GetImage("Game/Assets/Images/Sunscape.png");
		
	// Init Layers
	BackgroundLayer = document.createElement("canvas");
	BackgroundLayer.width = ScreenWidth;
	BackgroundLayer.height = ScreenHeight;
	var tmpContext = BackgroundLayer.getContext("2d");
	tmpContext.fillStyle = "black"
	tmpContext.fillRect(0, 0, BackgroundLayer.width, BackgroundLayer.height);
	for (var i = 0; i < NumStars; i++) {
		var x = RandInt(0, ScreenWidth);
		var y = RandInt(0, ScreenHeight);
		var intensity = RandInt(MinStarIntensity, MaxStarIntensity);
		var color = "rgb(" + intensity + "," + intensity + "," + intensity + ");";
		tmpContext.fillStyle = color;
		tmpContext.fillRect(x, y, 1, 1);
	}
	tmpContext = null;
	
	TerrainLayer = document.createElement("canvas");
	TerrainLayer.width = ScreenWidth;
	TerrainLayer.height = ScreenHeight;
	tmpContext = TerrainLayer.getContext("2d");
	tmpContext.fillStyle = "rgba(0,0,0,0);";
	tmpContext.fillRect(0, 0, TerrainLayer.width, TerrainLayer.height);
	tmpContext.drawImage(Background_2_Image, 0, 0);
	TerrainLayerData = tmpContext.getImageData(0, 0, TerrainLayer.width, TerrainLayer.height);
	tmpContext = null;
	
	ShotLayer = document.createElement("canvas");
	ShotLayer.width = ScreenWidth;
	ShotLayer.height = ScreenHeight;
	tmpContext = ShotLayer.getContext("2d");
	tmpContext.fillStyle = "rgba(0,0,0,0);";
	tmpContext.fillRect(0, 0, ShotLayer.width, ShotLayer.height);
	tmpContext = null;
	
	// Init Missiles
	MissileLineSegmentsToDraw = new Array();
	
	// Init Tanks
	Tanks.push(new Tank(60, 267, "blue", DefaultAngle, DefaultPower, true, PlayerWidth, 0, 10));		// player
	CurrentTank = Tanks[0];

	NextSpawnAt = Millis();
	SpawnMonster();
	
	// Init Sunrise
	Sunscape_YPos = 0; //Sunscape_YPos_Night;	// FIXME: don't use 0 as an initial value, as that's just for testing raw canvas usage
	
	// Update angle + power views
	UpdateViewFromModel();
	
	// Reset time manager
	TimeMgr = null;
	
	// Mark as initialized
	SetGameState(GameStates.PLAYING);
}

function FixedUpdate() {	
	for (var i = 0; i < Tanks.length; i++) {
		Tanks[i].update();
	}
	
	for (var i = 0; i < Missiles.length; i++) {
		Missiles[i].update();
	}
	
	for (var i = 0; i < Explosions.length; i++) {
		Explosions[i].update();
	}
	
	if (NextSpawnAt <= TimeMgr.Time()) {
		SpawnMonster();
		var nextDelay = RandInt(NextMonsterDelayMinMS, NextMonsterDelayMaxMS);
		NextSpawnAt = TimeMgr.Time() + nextDelay;
	}
	
	// Update sunscape position

	// if (NextRiseAt <= TimeMgr.Time()) {
	// 	Sunscape_YPos--;
	// 	if (Sunscape_YPos < Sunscape_YPos_Sunrise) {
	// 		Sunscape_YPos = Sunscape_YPos_Sunrise;
	// 	}
	// 	NextRiseAt = TimeMgr.Time() + 
	// }
}

function Draw(ctx) {
	ctx.save();	
	DrawBackground(ctx);
	DrawTerrain(ctx);
	DrawMissiles(ctx);
	DrawTanks(ctx);
	DrawExplosions(ctx);
	ctx.restore();
}

function DrawBackground(ctx) {
	ctx.fillStyle = "black";
	ctx.fillRect(0, 0, ScreenWidth, ScreenHeight);	
	ctx.drawImage(BackgroundLayer, 0, 0);
	ctx.drawImage(Sunscape_Image, 0, Sunscape_YPos);		
}

function DrawTerrain(ctx) {
	ctx.drawImage(TerrainLayer, 0, 0);
}

function DrawMissiles(ctx) {
	var tmpContext = null;
	if (MissileLineSegmentsToDraw.length > 0) {
		tmpContext = ShotLayer.getContext("2d");
		tmpContext.strokeStyle = "yellow";
		for (var i = 0; i < MissileLineSegmentsToDraw.length; i++) {
			var m = MissileLineSegmentsToDraw[i];
			tmpContext.beginPath();
			tmpContext.moveTo(m[0], m[1]);
			tmpContext.lineTo(m[2], m[3]);
			tmpContext.stroke();
		}
		MissileLineSegmentsToDraw.splice(0, MissileLineSegmentsToDraw.length);	// clear the array
	}
	ctx.drawImage(ShotLayer, 0, 0);
}

function DrawTanks(ctx) {
	for (var i = 0; i < Tanks.length; i++) {
		Tanks[i].draw(ctx);
	}
}

function DrawExplosions(ctx) {
	for (var i = 0; i < Explosions.length; i++) {
		Explosions[i].draw(ctx);
	}
}

function CleanupFromUpdate() {
	// Clean up garbage
	CollectGarbage(Missiles, DeadMissiles);
	CollectGarbage(Explosions, DeadExplosions);
	CollectGarbage(Tanks, DeadTanks);
}



