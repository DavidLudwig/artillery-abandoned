
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
