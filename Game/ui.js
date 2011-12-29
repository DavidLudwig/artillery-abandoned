
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

function InitInput() {
	window.addEventListener('keydown', HandleKeyDown, true);
	window.addEventListener('keyup', HandleKeyUp, true);
	ResetInput();
}

const NumKeys = 255;
var KeysDown = [];
function ResetInput() {
	for (var i = 0; i < NumKeys; i++) {
		KeysDown[i] = false;
	}
}

function HandleKeyDown(evt) {
	var isKeyRepeating = null;
	if (evt.keyCode >= 0 && evt.keyCode < NumKeys) {
		isKeyRepeating = KeysDown[evt.keyCode];
		KeysDown[evt.keyCode] = true;
	}
	
	//console.log("keydown: " + evt + ", keyCode=" + evt.keyCode + "; charCode=" + evt.charCode + "; isKeyRepeating=" + isKeyRepeating);

	switch (evt.keyCode) {
		case KeyCodes.Space:
			if ( ! isKeyRepeating) {
				if (CurrentTank != null) {
					CurrentTank.fire();
				}
			}
			break;
		case KeyCodes.PageUp:
			PowerPlusPlusDown = true;
			break;
		case KeyCodes.PageDown:
			PowerMinusMinusDown = true;
			break;
		case KeyCodes.Left:
			AngleMinusDown = true;
			break;
		case KeyCodes.Right:
			AnglePlusDown = true;
			break;
		case KeyCodes.Up:
			PowerPlusDown = true;
			break;
		case KeyCodes.Down:
			PowerMinusDown = true;
			break;
	}
}

function HandleKeyUp(evt) {
	if (evt.keyCode >= 0 && evt.keyCode < NumKeys) {
		KeysDown[evt.keyCode] = false;
	}

	//console.log("keyup: " + evt + ", keyCode=" + evt.keyCode + "; charCode=" + evt.charCode);

	switch (evt.keyCode) {
		case KeyCodes.PageUp:
			PowerPlusPlusDown = false;
			break;
		case KeyCodes.PageDown:
			PowerMinusMinusDown = false;
			break;
		case KeyCodes.Left:
			AngleMinusDown = false;
			break;
		case KeyCodes.Right:
			AnglePlusDown = false;
			break;
		case KeyCodes.Up:
			PowerPlusDown = false;
			break;
		case KeyCodes.Down:
			PowerMinusDown = false;
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
