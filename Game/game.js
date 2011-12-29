
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

function ToBool(input, defaultOutput) {
	var value = parseInt(input);
	if (isNaN(value)) {
		return defaultOutput;
	} else if (value == 0) {
		return false;
	} else {
		return true;
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
		var gameParamsDoc = parser.parseFromString(rawData, "text/xml");
		var parserErrors = gameParamsDoc.getElementsByTagName("parsererror");
		if (parserErrors.length > 0) {
			console.log("Error parsing game parameters:");
			console.log(parserErrors[0]);
		} else {
			console.log("Game Parameters:");
			console.log(gameParamsDoc);
		}
		
		var gameData = gameParamsDoc.getElementsByTagName("game")[0];
		if (gameData) {
			UseMonsters = ToBool(gameData.getAttribute("monsters"), UseMonsters);
			
			var tanks = gameData.getElementsByTagName("tanks")[0].getElementsByTagName("tank");
			for (var i = 0; i < tanks.length; i++) {
				var x = parseInt(tanks[i].getAttribute("x"));
				var y = parseInt(tanks[i].getAttribute("y"));
				var color = tanks[i].getAttribute("color") || "blue";
				if ( ! isNaN(x) && ! isNaN(y) ) {
					TanksToSpawn[i] = {
						"x": x,
						"y": y,
						"color": color
					};
				}
			}
		}
	}
	
	// Log gameplay-affecting variables.
	console.log("Use Monsters?: " + UseMonsters);
	
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
	if (UseImageBasedTerrain) {
		tmpContext.fillStyle = "rgba(0,0,0,0);";
		tmpContext.fillRect(0, 0, TerrainLayer.width, TerrainLayer.height);
		tmpContext.drawImage(Background_2_Image, 0, 0);
	} else {
		var TerrainData = [
			[0,300],
			[200,280],
			[400,220],
			[512,270]
		];
		tmpContext.fillStyle = "#996600";
		tmpContext.beginPath();
		tmpContext.moveTo(0, ScreenHeight);
		for (var pointIndex = 0; pointIndex < TerrainData.length; pointIndex++) {
			var px = TerrainData[pointIndex][0];
			var py = TerrainData[pointIndex][1];
			tmpContext.lineTo(px, py);
		}
		tmpContext.lineTo(ScreenWidth, ScreenHeight);
		tmpContext.closePath();
		tmpContext.fill();
	}
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
	for (var i = 0; i < TanksToSpawn.length; i++) {
		var tankSpawnInfo = TanksToSpawn[i];
		if (tankSpawnInfo.x && tankSpawnInfo.y && tankSpawnInfo.color) {
			var tank = new Tank(tankSpawnInfo.x, tankSpawnInfo.y, tankSpawnInfo.color, DefaultAngle, DefaultPower, true, PlayerWidth, 0, 10);
			Tanks.push(tank);
			tank.AdjustDownward();
		}
	}
	CurrentTank = Tanks[0];
	if ( ! UseMonsters ) {
		UseTankHighlights = true;
	}

	// Init Monsters
	NextSpawnAt = TimeMgr.SimulatedTime();
	
	// Init Sunrise
	Sunscape_YPos = 0; //Sunscape_YPos_Night;	// FIXME: don't use 0 as an initial value, as that's just for testing raw canvas usage
	
	// Update angle + power views
	UpdateViewFromModel();
	
	// Mark as initialized
	SetGameState(GameStates.PLAYING);
}

function FixedUpdate() {
	//console.log("FixedUpdate, #" + FixedUpdateCount+": managed="+TimeMgr.Time()+"; real="+Millis());
	
	for (var i = 0; i < Tanks.length; i++) {
		Tanks[i].update();
	}
	
	for (var i = 0; i < Missiles.length; i++) {
		Missiles[i].update();
	}
	
	for (var i = 0; i < Explosions.length; i++) {
		Explosions[i].update();
	}
	
	if (NextSpawnAt <= TimeMgr.SimulatedTime()) {
		SpawnMonster();
		var nextDelay = RandInt(NextMonsterDelayMinMS, NextMonsterDelayMaxMS);
		NextSpawnAt = TimeMgr.SimulatedTime() + nextDelay;
	}
	
	// Update sunscape position

	// if (NextRiseAt <= TimeMgr.SimulatedTime()) {
	// 	Sunscape_YPos--;
	// 	if (Sunscape_YPos < Sunscape_YPos_Sunrise) {
	// 		Sunscape_YPos = Sunscape_YPos_Sunrise;
	// 	}
	// 	NextRiseAt = TimeMgr.SimulatedTime() + 
	// }
	
	// Cleanup
	if (Tanks.indexOf(CurrentTank) == -1) {
		CurrentTank = null;
	}
	CleanupFromUpdate();
}

function SpawnMonster() {
	if ( ! UseMonsters ) {
		return;
	}
	
	//console.log("SpawnMonster: fixedcount="+FixedUpdateCount);
	var x = RandNum(SpawnXMin, SpawnXMax);
	var monsterXStep = RandNum(MonsterXStepMin, MonsterXStepMax);
	var monster = new Tank(x, 0, "red", DefaultAngle, DefaultPower, false, MonsterWidth, -1, monsterXStep);
	monster.MoveByXOffset(0);	// make sure it's on the ground
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
			Tanks[1].MoveByXOffset(-1);
			break;
		
		case KeyCodes.Right:
			//console.log("right");
			Tanks[1].MoveByXOffset(1);
			break;
		
		case KeyCodes.Down:
			//console.log("down");
			Tanks[1].AdjustDownward();
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
			CurrentTank.OffsetAngleWithWrapping(AngleIncrementBig);
			doViewUpdate = true;
		} else if (AnglePlusDown) {
			CurrentTank.OffsetAngleWithWrapping(1);
			doViewUpdate = true;
		} else if (AngleMinusDown) {
			CurrentTank.OffsetAngleWithWrapping(-1);
			doViewUpdate = true;
		} else if (AngleMinusMinusDown) {
			CurrentTank.OffsetAngleWithWrapping(-1 * AngleIncrementBig)
			doViewUpdate = true;
		}
	}
	
	if (doViewUpdate) {
		//console.log(CurrentTank.angle);
		UpdateViewFromModel();
		ProcessInputsAfterAppTimeMS = Millis() + InputIntervalInMS;
	}		
}

function Draw(ctx) {
	ctx.save();	
	DrawBackground(ctx);
	DrawTerrain(ctx);
	DrawMissiles(ctx);
	DrawTanks(ctx);
	DrawExplosions(ctx);
	DrawCollisionPoint(ctx);
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

function DrawCollisionPoint(ctx) {
	if (ShowCollisionDebugInfo == false || LastCollisionPoint == null || LastCollisionPoint.length != 2) {
		return;
	}
	
	ctx.save();
	ctx.fillStyle = CollisionPointDrawColor;
	var rectLeft = LastCollisionPoint[0] - (CollisionPointSize / 2);
	var rectTop = LastCollisionPoint[1] - (CollisionPointSize / 2);
	ctx.fillRect(rectLeft, rectTop, CollisionPointSize, CollisionPointSize);
	ctx.restore();
}

function CleanupFromUpdate() {
	// Clean up garbage
	CollectGarbage(Missiles, DeadMissiles);
	CollectGarbage(Explosions, DeadExplosions);
	CollectGarbage(Tanks, DeadTanks);
}



