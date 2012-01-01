
// Tank class

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
	this.collisionMaskCanvas = null;
	this.collisionDetector = null;
	this._isTankCanvasValid = false;
	
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
		
		if ( ! this.MoveByXOffset(this.xstep)) {
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
	
	var turretVector = new Vector(TurretLengthFromTankCenter + TurretWeight, 0);
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

Tank.prototype._invalidateTankCanvas = function () {
	this._isTankCanvasValid = false;
}

Tank.prototype._updateTankCanvas = function () {
	if (this._isTankCanvasValid) {
		return;
	}
	
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

	// Create and configure a canvas to do collision detection with.
	if (this.collisionMaskCanvas == null) {
		this.collisionMaskCanvas = document.createElement("canvas");
	}
	this.collisionMaskCanvas.width = this.tankCanvas.width;
	this.collisionMaskCanvas.height = this.tankCanvas.height;
	ctx = this.collisionMaskCanvas.getContext("2d");
	ctx.clearRect(0, 0, this.collisionMaskCanvas.width, this.collisionMaskCanvas.height);
	
	// Mark the tank's canvas as valid.
	this._isTankCanvasValid = true;
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
	if (ShowCollisionDebugInfo) {
		ctx.save();
		ctx.strokeStyle = "white";
		ctx.lineWeight = "1";
		ctx.strokeRect(tankCanvasGlobalLeft, tankCanvasGlobalTop, this.tankCanvas.width, this.tankCanvas.height);
		ctx.restore();
	}
	
	// Draw collision mask, if requested.
	if (ShowCollisionDebugInfo) {
		ctx.save();
		ctx.translate(tankCanvasGlobalLeft, CollisionDebugInfoYPosition);
		ctx.drawImage(this.collisionMaskCanvas, 0, 0);
		ctx.strokeStyle = "white";
		ctx.lineWidth = 1;
		ctx.strokeRect(0, 0, this.tankCanvas.width, this.tankCanvas.height);
		ctx.restore();
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
	
	// Draw highlight, if need be.
	if (UseTankHighlights && this == CurrentTank) {
		//console.log("draw current tank");
		ctx.save();
		ctx.translate(this.cx, this.cy - HighlightDistanceYFromTankCenter);
		DrawHighlight(ctx);
		ctx.restore();
	}
	
	ctx.restore();
}

Tank.prototype.SetAngle = function (angle) {
	this.angle = angle;
	this._invalidateTankCanvas();
}

Tank.prototype.OffsetAngleWithWrapping = function (offsetAngle) {
	if (offsetAngle > 0) {
		var newAngle = this.angle + offsetAngle;
		if (newAngle > 0) {
			newAngle = -180;
		}
		this.SetAngle(newAngle);
	} else if (offsetAngle < 0) {
		var newAngle = this.angle - 1;
		if (newAngle < -180) {
			newAngle = 0;
		}
		this.SetAngle(newAngle);
	}
}

Tank.prototype.AdjustDownward = function () {
	var x = this.cx;
	var yadjustment = (this.height / 2);
	var y = this.cy + yadjustment;
	while (true) {
		if (y >= ScreenHeight) {
			this.cy = ScreenHeight - yadjustment;
			this._invalidateTankCanvas();
			return true;
		}
		var alpha = HackedGetAlpha(TerrainLayerData, x, y);
		//console.log("... x="+x+"; y="+y+"; alpha = " + alpha);
		if (alpha == 0) {
			y++;
		} else {
			//console.log("AdjustDownward got it!")
			this.cy = y - yadjustment;
			this._invalidateTankCanvas();
			return true;
		}
	}
}

Tank.prototype.AdjustUpward = function () {
	var x = this.cx;
	var yadjustment = (this.height / 2);
	var y = this.cy + yadjustment;
	while (true) {
		if (y <= 0) {
			//console.log("AdjustUpward hit top")
			return false;
		}
		var alpha = HackedGetAlpha(TerrainLayerData, x, y - 1);
		//console.log("... x="+x+"; y="+y+"; alpha = " + alpha);
		if (alpha != 0) {
			y--;
		} else {
			//console.log("AdjustUpward got it!")
			this.cy = y - yadjustment;
			this._invalidateTankCanvas();
			return true;
		}
	}
}

Tank.prototype.MoveByXOffset = function (xoffset) {
	if (xoffset != 0) {
		this.cx += xoffset;
		this._invalidateTankCanvas();	
		if ( ! this.AdjustDownward() ) {
			return false;
		}
		if ( ! this.AdjustUpward() ) {
			return false;
		}
	}
	return true;
}

Tank.prototype._doesRectCollideWithBoundingBox = function (left, top, right, bottom) {
	this._updateTankCanvas();
	var bodyBoxLeft = this.cx - this.tankCanvasCX;
	var bodyBoxTop = this.cy - this.tankCanvasCY;
	var bodyBoxRight = bodyBoxLeft + this.tankCanvas.width;
	var bodyBoxBottom = bodyBoxTop + this.tankCanvas.height;
	var doRectsIntersect = intersectRectRect(
		left, top, right, bottom,
		bodyBoxLeft, bodyBoxTop, bodyBoxRight, bodyBoxBottom);
	return doRectsIntersect;
}

Tank.prototype.BeginPixelCollisionDetection = function () {
	//this.collisionDetector = new _SourceInBasedTankCollisionDetector(this);
	this.collisionDetector = new _ClipBasedTankCollisionDetector(this);
	return this.collisionDetector.Begin();
}

Tank.prototype.EndPixelCollisionDetection = function (ctx, outputCollisionPoint) {
	var collisionResult = this.collisionDetector.End(ctx, outputCollisionPoint);
	this.collisionDetector = null;
	return collisionResult;
}

// var CollisionCallCount = 0;
Tank.prototype.CollidesWithLineSegment = function (x1, y1, x2, y2, outputCollisionPoint) {
	// CollisionCallCount++;
	
	// Figure out if the line segment was near the tank.  If not, report
	// that no collision occurred.
	var lineRectLeft = Math.min(x1, x2);
	var lineRectTop = Math.min(y1, y2);
	var lineRectRight = Math.max(x1, x2);
	var lineRectBottom = Math.max(y1, y2);
	if ( ! this._doesRectCollideWithBoundingBox(lineRectLeft, lineRectTop, lineRectRight, lineRectBottom) ) {
		return false;
	}

	// Determine if the line intersected with any pixel on the tank's body.
	// This is done by drawing the tank's body onto a separate canvas,
	// then drawing the line on top of it using a composition mode that
	// will only show the pixels where the line intersects the body.
	var ctx = this.BeginPixelCollisionDetection();

	ctx.translate(x1, y1);
	var lineVectorX = x2 - x1;
	var lineVectorY = y2 - y1;
	ctx.rotate(Math.atan2(lineVectorY, lineVectorX));
	var lineLength = Math.sqrt((lineVectorX * lineVectorX) + (lineVectorY * lineVectorY));
	ctx.beginPath();
	ctx.moveTo(0, -1);
	ctx.lineTo(lineLength, -1);
	ctx.lineTo(lineLength, 1);
	ctx.lineTo(0, 1);
	ctx.closePath();

	var doesPixelCollide = this.EndPixelCollisionDetection(ctx, outputCollisionPoint);
	return doesPixelCollide;
}

Tank.prototype.CollidesWithCircle = function (cx, cy, radius) {
	// Figure out if the circle was near the tank.  If not, report
	// that no collision occurred.
	this._updateTankCanvas();
	var bodyBoxLeft = this.cx - this.tankCanvasCX;
	var bodyBoxTop = this.cy - this.tankCanvasCY;
	var bodyBoxRight = bodyBoxLeft + this.tankCanvas.width;
	var bodyBoxBottom = bodyBoxTop + this.tankCanvas.height;
	var collisionPoint = intersectCircleAABB(cx, cy, radius, bodyBoxLeft, bodyBoxTop, bodyBoxRight, bodyBoxBottom);
	if (collisionPoint == null) {
		return false;
	}
	
	// Determine if the circle intersected with any pixel on the tank's body.
	// This is done by drawing the tank's body onto a separate canvas,
	// then drawing the circle on top of it using a composition mode that
	// will only show the pixels where the circle intersects the body.
	var ctx = this.BeginPixelCollisionDetection();
	
	ctx.beginPath();
	ctx.arc(cx, cy, radius, 0, Math.PI * 2, true);
	
	var doesPixelCollide = this.EndPixelCollisionDetection(ctx);
	return doesPixelCollide;
}


// ----------------------------------------------------------------------
//  Tank Collision Detection via a "source-in" fill operation
//
//  This algorithm requires that the browser, when performing a source-in
//  fill() operation, clears all of the canvas' image data except
//  for those areas were there is a union between visible source and
//  destination pixels.  That is to say, the browser will clear any pixel
//  data that isn't drawn over by the fill() operation.  Chrome 15 and
//  Firefox 9 support this.  Some older browsers, such as Mobile Safari
//  on iOS 5.0, when asked to perform the same compositing operation,
//  will not clear these pixels.  If a pixel was on the canvas before
//  the source-in fill(), and it wasn't drawn over, it'll still be there
//  after the fill().
// ----------------------------------------------------------------------

function _SourceInBasedTankCollisionDetector(tank) {
	this.tank = tank;
}

_SourceInBasedTankCollisionDetector.prototype.Begin = function () {
	this.tank._updateTankCanvas();
	var bodyBoxLeft = this.tank.cx - this.tank.tankCanvasCX;
	var bodyBoxTop = this.tank.cy - this.tank.tankCanvasCY;
	var ctx = this.tank.collisionMaskCanvas.getContext("2d");
	ctx.save();
	ctx.clearRect(0, 0, this.tank.collisionMaskCanvas.width, this.tank.collisionMaskCanvas.height);
	
	// Draw the tank onto the collision canvas.
	ctx.globalCompositeOperation = "source-over";
	ctx.drawImage(this.tank.tankCanvas, 0, 0);

	// Draw the line onto the collision canvas
	ctx.translate(-bodyBoxLeft, -bodyBoxTop);
	ctx.globalCompositeOperation = "source-in";
	ctx.fillStyle = CollisionMaskColor;
	return ctx;
}

_SourceInBasedTankCollisionDetector.prototype.End = function (ctx, outputCollisionPoint) {
	ctx.fill();
	
	var bodyBoxLeft = this.tank.cx - this.tank.tankCanvasCX;
	var bodyBoxTop = this.tank.cy - this.tank.tankCanvasCY;

	// All done with drawing to the collision canvas.  Clean up before moving on.
	ctx.restore();
	
	// Check for any collisions.
	var collidedImageData = ctx.getImageData(0, 0, this.tank.collisionMaskCanvas.width, this.tank.collisionMaskCanvas.height);
	for (var y = 0; y < this.tank.collisionMaskCanvas.height; y++) {
		for (var x = 0; x < this.tank.collisionMaskCanvas.width; x++) {
			var index = (((this.tank.collisionMaskCanvas.width * y) + x) * 4);
			// var pixelR = collidedImageData.data[index + 0];
			// var pixelG = collidedImageData.data[index + 1];
			// var pixelB = collidedImageData.data[index + 2];
			var pixelAlpha = collidedImageData.data[index + 3];
			// console.log("****: " + CollisionCallCount + "; {"+x+","+y+"}; index="+index+"; pixel={"+pixelR+","+pixelG+","+pixelB+","+pixelAlpha+"}");
			if (pixelAlpha > 0) {
				if (outputCollisionPoint != null) {
					var collisionX = x + bodyBoxLeft;
					var collisionY = y + bodyBoxTop;
					outputCollisionPoint.splice(0, outputCollisionPoint.length);
					outputCollisionPoint.push(collisionX);
					outputCollisionPoint.push(collisionY);
				}
				// console.log("!!!!: collision detected")
				return true;
			}
		}
	}
	
	return false;
}


// ----------------------------------------------------------------------
//  Tank Collision Detection via clip()
// ----------------------------------------------------------------------

function _ClipBasedTankCollisionDetector(tank) {
	this.tank = tank;
}

_ClipBasedTankCollisionDetector.prototype.Begin = function () {
	this.tank._updateTankCanvas();
	var bodyBoxLeft = this.tank.cx - this.tank.tankCanvasCX;
	var bodyBoxTop = this.tank.cy - this.tank.tankCanvasCY;
	var ctx = this.tank.collisionMaskCanvas.getContext("2d");
	ctx.save();
	ctx.clearRect(0, 0, this.tank.collisionMaskCanvas.width, this.tank.collisionMaskCanvas.height);
	
	// Draw the collision-checking path onto the canvas.
	ctx.translate(-bodyBoxLeft, -bodyBoxTop);
	return ctx;
}

_ClipBasedTankCollisionDetector.prototype.End = function (ctx, outputCollisionPoint) {
	// Convert the just-drawn path into a clipping path.
	ctx.clip();
	
	// Clean up a bit.
	ctx.setTransform(1, 0, 0, 1, 0, 0);	// set the transformation to the identity matrix
	
	// Draw the tank onto the collision canvas.
	ctx.globalCompositeOperation = "source-over";
	ctx.drawImage(this.tank.tankCanvas, 0, 0);
	
	// All done with drawing to the collision canvas.  Clean up before moving on.
	ctx.restore();
	
	// Check for any collisions.
	var bodyBoxLeft = this.tank.cx - this.tank.tankCanvasCX;
	var bodyBoxTop = this.tank.cy - this.tank.tankCanvasCY;
	var collidedImageData = ctx.getImageData(0, 0, this.tank.collisionMaskCanvas.width, this.tank.collisionMaskCanvas.height);
	for (var y = 0; y < this.tank.collisionMaskCanvas.height; y++) {
		for (var x = 0; x < this.tank.collisionMaskCanvas.width; x++) {
			var index = (((this.tank.collisionMaskCanvas.width * y) + x) * 4);
			// var pixelR = collidedImageData.data[index + 0];
			// var pixelG = collidedImageData.data[index + 1];
			// var pixelB = collidedImageData.data[index + 2];
			var pixelAlpha = collidedImageData.data[index + 3];
			// console.log("****: " + CollisionCallCount + "; {"+x+","+y+"}; index="+index+"; pixel={"+pixelR+","+pixelG+","+pixelB+","+pixelAlpha+"}");
			if (pixelAlpha > 0) {
				if (outputCollisionPoint != null) {
					var collisionX = x + bodyBoxLeft;
					var collisionY = y + bodyBoxTop;
					outputCollisionPoint.splice(0, outputCollisionPoint.length);
					outputCollisionPoint.push(collisionX);
					outputCollisionPoint.push(collisionY);
				}
				// console.log("!!!!: collision detected")
				return true;
			}
		}
	}
	
	return false;
}