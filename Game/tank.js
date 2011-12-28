
// Tank class
function AdjustTankDownward(tank) {
	var x = tank.cx;
	var yadjustment = (tank.height / 2);
	var y = tank.cy + yadjustment;
	while (true) {
		if (y >= ScreenHeight) {
			//console.log("AdjustTankDownward hit bottom")
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
			//console.log("AdjustTankUpward hit top")
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
	
	// The tank's body.
	this.tankCanvas = null;
	
	// Tank canvas center point: a point on this.tankCanvas's coordinate space that translates to this.cx and this.cy in the world's coordinate space.
	this.tankCanvasCX = null;
	this.tankCanvasCY = null;
}

Tank.prototype.update = function () {
	if (this.nextUpdateMS == null) {
		// set nextUpdateMS on the first tick
		this.nextUpdateMS = TimeMgr.SimulatedTime();
	}
	while (this.nextUpdateMS <= TimeMgr.SimulatedTime()) {
		// var intersectRectRect(var left, var top, var right, var bottom,
		//                       var otherLeft, var otherTop, var otherRight, var otherBottom)
		
		if ( ! MoveTank(this, this.xstep) ) {
			Destroy(this, DeadTanks);
			return;
		}

		if (this.isPlayer) {
			for (var i = 0; i < Tanks.length; i++) {
				var otherTank = Tanks[i];
				if ( ! otherTank.isPlayer ) {
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
		}

		this.nextUpdateMS += this.xstepInterval;
	}
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
	//console.log("fire!: angle="+angleDeg+"; power="+power+"; x="+x+"; y="+y+"; vx="+vx+"; vy="+vy+"; time="+TimeMgr.SimulatedTime());
	var missile = new Missile(x, y, vx, vy);
	Missiles.push(missile);
}

Tank.prototype._drawTankBody = function (ctx, cx, cy) {
	// Draw the tank's body
	var x = cx - (this.width / 2);
	var y = cy - (this.height / 2);
	ctx.fillStyle = this.color;
	ctx.fillRect(x, y, this.width, this.height);
	
	// Draw the turret
	if (this.isPlayer) {
		var turretVector = new Vector(TurretLengthFromTankCenter, 0);
		RotateVectorByDeg(turretVector, this.angle);
		ctx.beginPath();
		ctx.moveTo(cx, cy);
		ctx.lineTo(cx + turretVector.x, cy + turretVector.y);
		ctx.strokeStyle = this.color;
		ctx.lineWidth = TurretWeight;
		ctx.lineCap = "square";
		ctx.stroke();
	}
}

Tank.prototype._updateTankCanvas = function () {
	// Create a canvas, if such hasn't already been done. 
	if (this.tankCanvas == null) {
		this.tankCanvas = document.createElement("canvas");
	}
	
	// Make sure the canvas is the correct size.
	var canvasWidth = Math.max(this.width, TurretWeight + (2 * TurretLengthFromTankCenter));
	var canvasHeight = Math.max(this.height, (TurretWeight / 2) + (TurretLengthFromTankCenter + (this.height / 2)));
	this.tankCanvas.width = canvasWidth;
	this.tankCanvas.height = canvasHeight;
	
	// Figure out where the tank's center will be on the canvas.
	this.tankCanvasCX = canvasWidth / 2;
	this.tankCanvasCY = canvasHeight - (this.height / 2);

	// Draw onto the canvas.
	var ctx = this.tankCanvas.getContext("2d");
	this._drawTankBody(ctx, this.tankCanvasCX, this.tankCanvasCY);
}

Tank.prototype.draw = function (ctx, a, b, c, d) {
	this._updateTankCanvas();
	
	ctx.save();
	//console.log("draw tank at " + this.x + ", " + this.y);
	
	// Draw tank body
	// this._drawTankBody(ctx, this.cx, this.cy);
	var tankCanvasGlobalLeft = this.cx - this.tankCanvasCX;
	var tankCanvasGlobalTop = this.cy - this.tankCanvasCY;
	ctx.drawImage(this.tankCanvas, tankCanvasGlobalLeft, tankCanvasGlobalTop);
	
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
	
	// Draw highlight, if need be.
	if (UseTankHighlights && this == CurrentTank) {
		//console.log("draw current tank");
		ctx.beginPath();
		ctx.fillStyle = HighlightColor;
		ctx.beginPath();
		ctx.beginPath();
		ctx.moveTo(this.cx - (HighlightWidth / 2), this.cy - HighlightDistanceYFromTankCenter - HighlightHeight);
		ctx.lineTo(this.cx + (HighlightWidth / 2), this.cy - HighlightDistanceYFromTankCenter - HighlightHeight);
		ctx.lineTo(this.cx, this.cy - HighlightDistanceYFromTankCenter);
		ctx.closePath();
		ctx.fill();
	}
	
	ctx.restore();
}
