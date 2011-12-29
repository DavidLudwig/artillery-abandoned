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

Explosion.prototype.update = function () {
	if ( ! this.wasColliderRun ) {
		for (var i = 0; i < Tanks.length; i++) {
			var tank = Tanks[i];
			if (tank.CollidesWithCircle(this.x, this.y, this.radius) && ExplosionsDestroyTanks == true) {
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
