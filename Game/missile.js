
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
		//console.log("undefined alpha value at {" + x + "," + y + "}");
	}
	//console.log("value at "+x+","+y+": "+value);
	return value;
	//return 0;
}

function DrawMissileHighlight(ctx, highlightPosition) {
	ctx.save();
	ctx.translate(highlightPosition[0], highlightPosition[1]);
	ctx.rotate(Math.PI);
	DrawHighlight(ctx);
	ctx.restore();
}

Missile.prototype.update = function () {
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
	
	// do collision detection against the terrain
	var detectedAlpha = HackedGetAlpha(TerrainLayerData, this.x, this.y);
	//console.log("alpha at {"+this.x+","+this.y+"} = "+detectedAlpha);
	if (detectedAlpha > 0) {
		if (MissilesCreateExplosions == true) {
			var explosion = new Explosion(this.x, this.y);
			Explosions.push(explosion);
		}
		Destroy(this, DeadMissiles);
		return;
	}
	
	// do collision detection against each tank
	var collisionPoint = [];
	for (var tankIndex = 0; tankIndex < Tanks.length; tankIndex++) {
		var tank = Tanks[tankIndex];
		if (tank.CollidesWithLineSegment(this.lastx, this.lasty, this.x, this.y, collisionPoint)) {
			// console.log("missile + tank collision detected: {" + collisionPoint[0] + "," + collisionPoint[1] + "}");

			LastCollisionPoint.splice(0, LastCollisionPoint.length);
			LastCollisionPoint[0] = collisionPoint[0];
			LastCollisionPoint[1] = collisionPoint[1];

			if (MissilesCreateExplosions == true) {
				var explosion = new Explosion(collisionPoint[0], collisionPoint[1]);
				Explosions.push(explosion);
			}
			Destroy(this, DeadMissiles);
			return;
		}
	}
	
	if (this.x < 0 || this.x >= ScreenWidth) {
		Destroy(this, DeadMissiles);
		return;
	} else if (this.y >= ScreenHeight) {
		if (MissilesCreateExplosions == true) {
			var explosion = new Explosion(this.x, this.y);
			Explosions.push(explosion);
		}
		Destroy(this, DeadMissiles);
		return;
	}
	
	if (this.y < 0) {
		MissileHighlightsToDraw.push([this.x, MissileHighlightY]);
	}
}
