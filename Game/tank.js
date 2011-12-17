
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
