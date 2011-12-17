
//
// Screen Dimensions
//
const ScreenWidth = 512;
const ScreenHeight = 384;

//
// World Properties
//
const GravityY = 100;
const NumStars = 200;
const MinStarIntensity = 100;
const MaxStarIntensity = 175;

//
// Simulation Properties
//
const InputIntervalInMS = 75;
//const GameTimeEnd = 720; // 60 minutes)* 12 = 720 minutes

//
// Player Input + HUD
//
const DefaultAngle = -30; // -56;
const DefaultPower = 150; // 190;
const PowerIncrementBig = 5;
const PowerIncrementSmall = 0.5;
const AngleIncrementBig = 2;
const GamePowerToViewPowerFactor = 2;
const MaxGamePower = 400;

//
// Keyboard input key codes
//
const KeyCodes = {
	"Left": 37,
	"Up": 38,
	"Right": 39,
	"Down": 40
};

//
// Player Tank
//
const TurretLengthFromTankCenter = 15;
const TurretWeight = 4;
const CrosshairWeight = 2;
const CrosshairSize = 6;
const CrosshairLengthFromTankCenter = 20;
const PlayerWidth = 16;

//
// Monsters
//
const MonsterWidth = 6;
const SpawnXMin = 400;
const SpawnXMax = 500;
const NextMonsterDelayMinMS = 20000;
const NextMonsterDelayMaxMS = 20000;
const MonsterXStepMin = 70;
const MonsterXStepMax = 250;

//
// Explosions
//
const DefaultExplosionRadius = 10;
const DefaultExplosionDuration = 0.3;
const PlayerExplodedRadius = 50;


// Timing
var StartTimeMS = null;
var UpdateDurationS = 0.05;		// time to elapse when updating game state, sort-of approximately in seconds
var TimeMgr = null;
const FixedUpdateIntervalMS = 50;
const FixedUpdateIntervalS = FixedUpdateIntervalMS / 1000;

// Layers
var BackgroundLayer;
//var DawnOverlayLayer;
var TerrainLayer;
var TerrainLayerData;
var ShotLayer;

// Images
var Background_2_Image;
var Sunscape_Image;

// Missile Drawing
var MissileLineSegmentsToDraw;

// Game Objects
var Tanks = new Array();
var DeadTanks = new Array();
var CurrentTank = null;
var Missiles = new Array();
var DeadMissiles = new Array();
var Explosions = new Array();
var DeadExplosions = new Array();

// Input States
var ProcessInputsAfterAppTimeMS = 0;
var PowerMinusMinusDown = false;
var PowerMinusDown = false;
var PowerPlusDown = false;
var PowerPlusPlusDown = false;
var AngleMinusMinusDown = false;
var AngleMinusDown = false;
var AnglePlusDown = false;
var AnglePlusPlusDown = false;

// Sunscape
var Sunscape_YPos = 0;
const Sunscape_YPos_Sunrise = -45;
const Sunscape_YPos_Night = 384;

// Utility Functions
function RandNum(from, to) {
	return Math.random() * (to - from + 1) + from;
}

function RandInt(from, to) {
	return Math.floor(Math.random() * (to - from + 1) + from);
}

function Millis() {
	return Date.now() - StartTimeMS;
}

// Game States
var GameStates = {
	"PLAYING" : 1,
	"GAME_OVER" : 2
};

var GameState = GameStates.PLAYING;
function SetGameState(theState) {
	if (GameState == theState) {
		return;
	}
	console.log("set game state: " + theState);
	GameState = theState;
}

// Delayed Deletion
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


// Tank class
function AdjustTankDownward(tank) {
	var x = tank.cx;
	var yadjustment = (tank.height / 2);
	var y = tank.cy + yadjustment;
	while (true) {
		if (y >= ScreenHeight) {
			console.log("AdjustTankDownward hit bottom")
			return false;
		}
		var alpha = HackedGetAlpha(TerrainLayerData, x, y);
		//console.log("... x="+x+"; y="+y+"; alpha = " + alpha);
		if (alpha == 0) {
			y++;
		} else {
			//console.log("AdjustTankDownward got it!")
			tank.cy = y - yadjustment;
			return true;
		}
	}
}

function AdjustTankUpward(tank) {
	var x = tank.cx;
	var yadjustment = (tank.height / 2);
	var y = tank.cy + yadjustment;
	while (true) {
		if (y <= 0) {
			console.log("AdjustTankUpward hit top")
			return false;
		}
		var alpha = HackedGetAlpha(TerrainLayerData, x, y - 1);
		//console.log("... x="+x+"; y="+y+"; alpha = " + alpha);
		if (alpha != 0) {
			y--;
		} else {
			//console.log("AdjustTankUpward got it!")
			tank.cy = y - yadjustment;
			return true;
		}
	}
}

function MoveTank(tank, xoff) {
	tank.cx += xoff;
	if ( ! AdjustTankDownward(tank) ) {
		return false;
	}
	if ( ! AdjustTankUpward(tank) ) {
		return false;
	}
	return true;
}

function Tank(cx, cy, color, angle, power, isPlayer, width, xstep, xstepInterval) {
	this.cx = cx;
	this.cy = cy;
	this.width = width;
	this.height = 10;
	this.angle = angle;
	this.power = power;
	this.isPlayer = isPlayer;
	this.xstep = xstep;
	this.xstepInterval = xstepInterval;
	this.nextUpdateMS = null;
	this.color = color;
}

Tank.prototype.update = function () {
	if (this.nextUpdateMS == null) {
		// set nextUpdateMS on the first tick
		this.nextUpdateMS = TimeMgr.Time();
	}
	while (this.nextUpdateMS <= TimeMgr.Time()) {
		// var intersectRectRect(var left, var top, var right, var bottom,
		//                       var otherLeft, var otherTop, var otherRight, var otherBottom)
		
		if (this.isPlayer) {
			for (var i = 1; i < Tanks.length; i++) {
				var otherTank = Tanks[i];
				if (intersectRectRect(this.cx - (this.width / 2),
									  this.cy - (this.height / 2),
									  this.cx + (this.width / 2),
									  this.cy + (this.height / 2),
									  otherTank.cx - (otherTank.width / 2),
									  otherTank.cy - (otherTank.height / 2),
									  otherTank.cx + (otherTank.width / 2),
									  otherTank.cy + (otherTank.height / 2))) {
					// console.log("tank collision");
					var explosion = new Explosion(this.cx, this.cy, PlayerExplodedRadius);
					Explosions.push(explosion);
					SetGameState(GameStates.GAME_OVER);
					return;
				}
			}
		}
		
		if ( ! MoveTank(this, this.xstep) ) {
			Destroy(this, DeadTanks);
			return;
		}

		this.nextUpdateMS += this.xstepInterval;
	}
}

function RotateVectorByRad(v, rad) {
	var cs = Math.cos(rad);
	var sn = Math.sin(rad);
	var px = v.x * cs - v.y * sn; 
	var py = v.x * sn + v.y * cs;
	v.x = px;
	v.y = py;
}

function RotateVectorByDeg(v, deg) {
	var rad = DegToRad(deg);
	RotateVectorByRad(v, rad);
}

Tank.prototype.fire = function () {
	var angleDeg = this.angle;
	var angleRad = DegToRad(angleDeg);
	var power = this.power;
	var x = this.cx;
	var y = this.cy;
	
	var turretVector = new Vector(TurretLengthFromTankCenter, 0);
	RotateVectorByDeg(turretVector, this.angle);
	x += turretVector.x;
	y += turretVector.y;
	
	var vx = power * Math.cos(angleRad);
	var vy = power * Math.sin(angleRad);
	console.log("fire!: angle="+angleDeg+"; power="+power+"; x="+x+"; y="+y+"; vx="+vx+"; vy="+vy);
	var missile = new Missile(x, y, vx, vy);
	Missiles.push(missile);
}

Tank.prototype.draw = function (ctx, a, b, c, d) {
	ctx.save();
	//console.log("draw tank at " + this.x + ", " + this.y);
	
	// Draw tank body
	var x = this.cx - (this.width/2);
	var y = this.cy - (this.height/2);
	ctx.fillStyle = this.color;
	ctx.fillRect(x, y, this.width, this.height);

	// Draw turret
	if (this.isPlayer) {
		var turretVector = new Vector(TurretLengthFromTankCenter, 0);
		RotateVectorByDeg(turretVector, this.angle);
		ctx.beginPath();
		ctx.moveTo(this.cx, this.cy);
		ctx.lineTo(this.cx + turretVector.x, this.cy + turretVector.y);
		ctx.strokeStyle = this.color;
		ctx.lineWidth = TurretWeight;
		ctx.lineCap = "square";
		ctx.stroke();
	}
	
	// Draw crosshair
	if (this.isPlayer) {
		var crosshairVector = new Vector(CrosshairLengthFromTankCenter + ((this.power / 1000.0) * 120), 0);
		RotateVectorByDeg(crosshairVector, this.angle);
		ctx.lineWidth = CrosshairWeight;
		ctx.strokeStyle = "white";
		ctx.beginPath();
		ctx.moveTo(this.cx + crosshairVector.x - (CrosshairSize / 2), this.cy + crosshairVector.y);
		ctx.lineTo(this.cx + crosshairVector.x + (CrosshairSize / 2), this.cy + crosshairVector.y);
		ctx.stroke();
		ctx.moveTo(this.cx + crosshairVector.x, this.cy + crosshairVector.y - (CrosshairSize / 2));
		ctx.lineTo(this.cx + crosshairVector.x, this.cy + crosshairVector.y + (CrosshairSize / 2));
		ctx.stroke();
	}
	
	ctx.restore();
}

function SpawnMonster() {
	var x = RandNum(SpawnXMin, SpawnXMax);
	var monsterXStep = RandNum(MonsterXStepMin, MonsterXStepMax);
	var monster = new Tank(x, 0, "red", DefaultAngle, DefaultPower, false, MonsterWidth, -1, monsterXStep);
	MoveTank(monster, 0);	// make sure it's on the ground
	Tanks.push(monster);
}

// Explosion class
function Explosion(x, y, radius) {
	this.x = x;
	this.y = y;
	
	if (radius == null) {
		radius = DefaultExplosionRadius;
	}
	this.radius = radius;
	
	this.timeRemaining = DefaultExplosionDuration;
	this.wasColliderRun = false;
}

function intersectRectRect(left, top, right, bottom, otherLeft, otherTop, otherRight, otherBottom) {
	return !(left > otherRight || right < otherLeft || top > otherBottom || bottom < otherTop);
}

function intersectCircleAABB(Cx, Cy, Cradius, Rleft, Rtop, Rright, Rbottom) {
	var closestPointX = Cx;
	var closestPointY = Cy;

	if (Cx < Rleft) {
		closestPointX = Rleft;
	} else if (Cx > Rright) {
		closestPointX = Rright;
	}

	if (Cy < Rtop) {
		closestPointY = Rtop;
	} else if (Cy > Rbottom) {
		closestPointY = Rbottom;
	}

	var diffX = closestPointX - Cx;
	var diffY = closestPointY - Cy;

	if (diffX * diffX + diffY * diffY > Cradius * Cradius) {
		return null;
	}

	return [closestPointX, closestPointY];
}

Explosion.prototype.update = function () {
	if ( ! this.wasColliderRun ) {
		for (var i = 0; i < Tanks.length; i++) {
			var tank = Tanks[i];
			var collisionPoint = intersectCircleAABB(this.x, this.y, this.radius,
				(tank.cx - (tank.width / 2)),
				(tank.cy - (tank.height / 2)),
				(tank.cx + (tank.width / 2)),
				(tank.cy + (tank.height / 2)));
			// console.log("collision pt: " + pt);
			if (collisionPoint) {
				Destroy(tank, DeadTanks);
			}
		}
		this.wasColliderRun = true;
	}
	
	this.timeRemaining -= FixedUpdateIntervalS;
	if (this.timeRemaining <= 0) {
		Destroy(this, DeadExplosions);
	}
}

Explosion.prototype.draw = function (ctx) {
	ctx.save();
	ctx.beginPath();
	ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI, false);
	ctx.fillStyle = "yellow";
	ctx.fill();
	ctx.restore();
}


// Missile class
function Missile(startx, starty, vx, vy) {
	this.lastx = startx;
	this.lasty = starty;
	this.x = startx;
	this.y = starty;
	this.vx = vx;
	this.vy = vy;
	this.alive = true;
}

function HackedGetAlpha(layer, x, y) {
	x = Math.round(x);
	y = Math.round(y);		
	var index = (((layer.width * y) + x) * 4) + 3;
	var value = layer.data[index];
	if (value == null) {
		console.log("undefined value");
	}
	//console.log("value at "+x+","+y+": "+value);
	return value;
	//return 0;
}

Missile.prototype.update = function () {
	//console.log("missile active at ms: " + Millis());
	
	this.lastx = this.x;
	this.lasty = this.y;
	this.x += (this.vx * FixedUpdateIntervalS);
	this.y += (this.vy * FixedUpdateIntervalS);
	MissileLineSegmentsToDraw.push([this.lastx, this.lasty, this.x, this.y]);
	
	this.vy += (GravityY * FixedUpdateIntervalS);
	
	// make sure the missile does not continue offscreen to either the left or right
	if (this.x < 0 || this.x >= ScreenWidth) {
		Destroy(this, DeadMissiles);
		return;
	}
	
	// do collision detection against the ground
	var detectedAlpha = HackedGetAlpha(TerrainLayerData, this.x, this.y);
	//console.log("alpha at {"+this.x+","+this.y+"} = "+detectedAlpha);
	if (detectedAlpha > 0) {
		var explosion = new Explosion(this.x, this.y);
		Explosions.push(explosion);
		Destroy(this, DeadMissiles);
	}
	
	if (this.x < 0 || this.x >= ScreenWidth || this.y < 0 || this.y >= ScreenHeight) {
		Destroy(this, DeadMissiles);
	}
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
	console.log("keydown: " + evt + ", keyCode=" + evt.keyCode + "; charCode=" + evt.charCode);
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
	console.log("setup called");
	
	StartTimeMS = Date.now();
	
	// Create PImages from pre-loaded images
	Background_2_Image = launcher.GetImage("Assets/Images/Background_2.png");
	Sunscape_Image = launcher.GetImage("Assets/Images/Sunscape.png");
	
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
	
	console.log("launcher: " + launcher);
	console.log("setup done!");
}

var FixedUpdateCount = 0;
var ActualCount = 0;
function FixedUpdate() {
	FixedUpdateCount++;
	//console.log("FixedUpdate("+ActualCount+","+FixedUpdateCount+"): managed="+TimeMgr.Time()+"; real="+Millis());
	
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

function Update() {
	// Update
	if (TimeMgr == null) {
		TimeMgr = new FixedUpdater();
		TimeMgr._currentTime = Millis();
		TimeMgr.AddCallback(FixedUpdateIntervalMS, function () {
			FixedUpdate();
		});
		FixedUpdate();
	} else {
		TimeMgr.AdvanceToTime(Millis());
	}
}

function Draw() {
	var canvas = document.getElementById("GameCanvas");
	if ( ! canvas.getContext ) {
		return;
	}
	
	var ctx = canvas.getContext("2d");
	var tmpContext = null;	
	ctx.save();
	
	// Draw Background
	ctx.fillStyle = "black";
	ctx.fillRect(0, 0, ScreenWidth, ScreenHeight);
	
	ctx.drawImage(BackgroundLayer, 0, 0);
	ctx.drawImage(Sunscape_Image, 0, Sunscape_YPos);		
	ctx.drawImage(TerrainLayer, 0, 0);
	
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
	
	for (var i = 0; i < Tanks.length; i++) {
		Tanks[i].draw(ctx);
	}
	for (var i = 0; i < Explosions.length; i++) {
		Explosions[i].draw(ctx);
	}
	
	// Clean up garbage
	CollectGarbage(Missiles, DeadMissiles);
	CollectGarbage(Explosions, DeadExplosions);
	CollectGarbage(Tanks, DeadTanks);
	ctx.restore();
};

function UpdateAndDraw() {
	// Process Input
	ProcessInput();

	// Advance Time
	Update();
	
	// Draw
	Draw();
}


window.addEventListener('keydown', HandleKeyDown, true);



