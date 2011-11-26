
function FixedUpdater() {
	this._callbacks = [];
	this._currentTime = 0;
}

FixedUpdater.prototype.AddCallback = function (interval, callback) {
	var callbackInfo = {
		"interval": interval,
		"callback": callback,
		"nextTime": interval	// TODO: set to something reflecting the current time
	};
	this._callbacks.push(callbackInfo);
}

FixedUpdater.prototype.AdvanceTimeByOffset = function (offset) {
	var newTime = this._currentTime + offset;
	this.AdvanceToTime(newTime);
}

FixedUpdater.prototype.AdvanceToTime = function (newTime) {
	if (newTime <= this._currentTime) {
		return;		// TODO: test this
	}
	
	this._currentTime = newTime;
	
	for (var i = 0; i < this._callbacks.length; i++) {
		var callbackInfo = this._callbacks[i];
		while (callbackInfo.nextTime <= this._currentTime) {
			callbackInfo.callback();
			callbackInfo.nextTime += callbackInfo.interval;
		}
	}
}

FixedUpdater.prototype.Time = function () {
	return this._currentTime;
}
