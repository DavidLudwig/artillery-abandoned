
function FixedUpdater() {
	this._currentTime = 0;
}

FixedUpdater.prototype.AdvanceTime = function (offset) {
	this._currentTime += offset;
}

FixedUpdater.prototype.Time = function () {
	return this._currentTime;
}
