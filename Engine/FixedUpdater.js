
function FixedUpdater() {
	this._callbacks = [];
	this._currentTime = 0;
	this._simulatedTime = 0;
	this._isPaused = false;
	this._timeOfLastResume = 0;
}

FixedUpdater.prototype.AddCallback = function (interval, callback) {
	var callbackInfo = {
		interval: interval,
		callback: callback,
		nextSimulatedTime: this._simulatedTime + interval
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

	if (this._isPaused) {
		this._currentTime = newTime;
		return;
	}

	var totalAdvancementInTime = (newTime - this._currentTime);
	var newSimulatedTime = this._simulatedTime + totalAdvancementInTime;
	
	while (true) {
		// Look for callbacks that should be signalled, given the new time.  Make note of
		// their next time (to signal).  Time will be updated to the earliest time-to-signal.
		// If no callbacks-to-signal can be found, update time to the new time and return.

		// Find the next time to update to.
		var nextSimulatedTime = newSimulatedTime;
		for (var i = 0; i < this._callbacks.length; i++) {
			var callbackInfo = this._callbacks[i];
			if (callbackInfo.nextSimulatedTime <= nextSimulatedTime) {
				// A callback-to-signal has been found.  Make note of its next time-to-signal, if appropriate.
				if (callbackInfo.nextSimulatedTime < nextSimulatedTime) {
					nextSimulatedTime = callbackInfo.nextSimulatedTime;
				}
			}
		}
		
		// Update time by a bit.
		var partialAdvancementInTime = (nextSimulatedTime - this._simulatedTime);
		this._currentTime += partialAdvancementInTime;
		this._simulatedTime += partialAdvancementInTime;
		
		// Signal callbacks.
		for (var i = 0; i < this._callbacks.length; i++) {
			var callbackInfo = this._callbacks[i];
			while (callbackInfo.nextSimulatedTime <= this._simulatedTime) {
				callbackInfo.callback();
				callbackInfo.nextSimulatedTime += callbackInfo.interval;
			}
		}
		
		// Check to see if we've updated to the final time.  If so, return to the caller.
		if (this._simulatedTime == newSimulatedTime) {
			return;
		}
	}
}

FixedUpdater.prototype.Pause = function () {
	this._isPaused = true;
}

FixedUpdater.prototype.Resume = function () {
	this._isPaused = false;
	this._timeOfLastResume = this._currentTime;
}

FixedUpdater.prototype.SimulatedTime = function () {
	return this._simulatedTime;
}

FixedUpdater.prototype.Time = function () {
	return this._currentTime;
}
