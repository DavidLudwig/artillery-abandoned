
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

function ToInt(input, defaultOutput) {
	var value = parseInt(input);
	if (isNaN(value)) {
		return defaultOutput;
	} else {
		return value;
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
			TerrainType = gameData.getAttribute("terrain", TerrainType);
			
			var tanksElement = gameData.getElementsByTagName("tanks")[0];
			if (tanksElement) {
				var tanks = tanksElement.getElementsByTagName("tank");
				if (tanks.length > 0) {
					// If any tanks are specified, ignore the defaults for any tank provided.
					TanksToSpawn = new Array();
				}
				for (var i = 0; i < tanks.length; i++) {
					var x = parseInt(tanks[i].getAttribute("x"));
					var y = parseInt(tanks[i].getAttribute("y"));
					var color = tanks[i].getAttribute("color") || "blue";
					var angle = ToInt(tanks[i].getAttribute("angle"), DefaultAngle);
					if ( ! isNaN(x) && ! isNaN(y) && ! isNaN(angle) ) {
						TanksToSpawn[i] = {
							"x": x,
							"y": y,
							"color": color,
							"angle": angle
						};
					}
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
	if (TerrainType == "image") {
		tmpContext.fillStyle = "rgba(0,0,0,0);";
		tmpContext.fillRect(0, 0, TerrainLayer.width, TerrainLayer.height);
		tmpContext.drawImage(Background_2_Image, 0, 0);
	} else {
		if (TerrainType != "generated") {
			console.log("Unknown terrain type of '" + String(TerrainType) + "'.  Using 'generated' instead.");
		}
		GenerateTerrain(tmpContext);
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
		if (tankSpawnInfo.x && tankSpawnInfo.y && tankSpawnInfo.color && tankSpawnInfo.angle) {
			var tank = new Tank(tankSpawnInfo.x, tankSpawnInfo.y, tankSpawnInfo.color, tankSpawnInfo.angle, DefaultPower, true, PlayerWidth, 0, 10);
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

		// Update angle + power views
		UpdateViewFromModel();
	}
	CleanupFromUpdate();
}

function GenerateTerrain(ctx) {
	// Generate a set of 2D coordinates with X coordinates in the range {0..<terrain width>} and Y coordinates in an ok range.
	var coords = [];
	const yA = ctx.canvas.height * TerrainHeightMultiplierA;
	const yB = ctx.canvas.height * TerrainHeightMultiplierB;
	for (var i = 0; i < NumTerrainCoords; i++) {
		// First generate a number in the range {0..1} to serve as a base for the X coordinate.
		var x = i * (1 / (NumTerrainCoords - 1));
		//x *= (TerrainXVariance * Math.random());
		
		// Next, bring the number to the range {0..<terrain width>}
		x *= ctx.canvas.width;
		
		// Generate a Y coordinate anywhere in the desired range.
		y = RandNum(yA, yB);
		
		// Store the coordinate
		coords[i] = [x, y];
	}	
	
	// Draw the generated terrain.
	ctx.fillStyle = "#996600";
	ctx.beginPath();
	ctx.moveTo(0, ctx.canvas.height);
	for (var pointIndex = 0; pointIndex < coords.length; pointIndex++) {
		var px = coords[pointIndex][0];
		var py = coords[pointIndex][1];
		ctx.lineTo(px, py);
	}
	ctx.lineTo(ctx.canvas.width, ctx.canvas.height);
	ctx.closePath();
	ctx.fill();
}

function SpawnMonster() {
	if ( ! UseMonsters ) {
		return;
	}
	
	//console.log("SpawnMonster: fixedcount="+FixedUpdateCount);
	var x = RandNum(SpawnXMin, SpawnXMax);
	var monsterXStep = RandNum(MonsterXStepMin, MonsterXStepMax);
	var monster = new Tank(x, 0, "red", 0, DefaultPower, false, MonsterWidth, -1, monsterXStep);
	monster.MoveByXOffset(0);	// make sure it's on the ground
	Tanks.push(monster);
}

function FireShot() {
	// Do nothing if no tank is active.
	if (CurrentTank == null) {
		return;
	}

	// Fire from the current tank.
	CurrentTank.fire();

	// Find the index of the current tank in Tanks[].
	var prevTankIndex;
	for (prevTankIndex = 0; prevTankIndex < Tanks.length; prevTankIndex++) {
		if (CurrentTank == Tanks[prevTankIndex]) {
			break;
		}
	}
	
	// Find the index of the next player tank in Tanks[].
	var nextTankIndex = prevTankIndex;
	while (true) {
		nextTankIndex++;
		if (nextTankIndex >= Tanks.length) {
			nextTankIndex = 0;
		}
		
		if (nextTankIndex == prevTankIndex) {
			break;
		} else if (Tanks[nextTankIndex].isPlayer) {
			break;
		}
	}
	
	// Setup the current tank
	CurrentTank = Tanks[nextTankIndex];

	// Update angle + power views
	UpdateViewFromModel();
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

function FindNextTank(currentTank, tanksArray, deadTanksArray) {
	var tankIndex = Tanks.indexOf(CurrentTank);
	const originalTankIndex = tankIndex;
	if (tankIndex == -1) {
		// The Tank isn't being tracked at all.  At this point, just attempt to pick a valid tank.  If none are valid, then return null.
		if (Tanks.length >= 0) {
			return tanksArray[0];
		} else {
			return null;
		}
	} else {
		// Try to find a live tank.
		while (true) {
			// Iterate to the next tank.
			tankIndex++;
			if (tankIndex >= Tanks.length) {
				tankIndex = 0;
			}
			
			// Get a reference to the tank (that's about to be inspected).
			var tank = tanksArray[tankIndex];
			
			// See if the tank is alive, for future reference.
			var isTankAlive = (deadTanksArray.indexOf(tank) == -1);
			
			// Check to see if we've gone through all the tanks.  If so, return an appropriate value.
			if (tankIndex == originalTankIndex) {
				// We've gone through the entire list.  See if the old 'current tank' is alive.
				if (isTankAlive) {
					// The tank is still alive.  Just keep the same 'current tank'.
					return tank;
				} else {
					// The tank is now dead.  There are no tanks to pick from.
					return null;
				}
			}
			
			// Check to see if this is a valid tank.  If so, stop here as we've found the new 'current tank'.
			if (isTankAlive && tank.isPlayer) {
				return tank;
			}
		}
	}
	
}

function CleanupFromUpdate() {
	// Clean up garbage
	CollectGarbage(Missiles, DeadMissiles);
	CollectGarbage(Explosions, DeadExplosions);

	// Before cleaning up dead tanks, make sure CurrentTank, if destroyed, gets reset.
	if (DeadTanks.indexOf(CurrentTank) != -1) {
		// CurrentTank is dead.  Find a new CurrentTank.
		CurrentTank = FindNextTank(CurrentTank, Tanks, DeadTanks);
		// Update angle + power views
		UpdateViewFromModel();
	}
	CollectGarbage(Tanks, DeadTanks);
}



