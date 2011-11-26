
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
	
	while (true) {
		// Look for callbacks that should be signalled, given the new time.  Make note of
		// their next time (to signal).  Time will be updated to the earliest time-to-signal.
		// If no callbacks-to-signal can be found, update time to the new time and return.

		// Find the next time to update to.
		var nextTime = newTime;
		for (var i = 0; i < this._callbacks.length; i++) {
			var callbackInfo = this._callbacks[i];
			if (callbackInfo.nextTime <= nextTime) {
				// A callback-to-signal has been found.  Make note of its next time-to-signal, if appropriate.
				if (callbackInfo.nextTime < nextTime) {
					nextTime = callbackInfo.nextTime;
				}
			}
		}
		
		// Update time by a bit.
		this._currentTime = nextTime;
		
		// Signal callbacks.
		for (var i = 0; i < this._callbacks.length; i++) {
			var callbackInfo = this._callbacks[i];
			while (callbackInfo.nextTime <= this._currentTime) {
				callbackInfo.callback();
				callbackInfo.nextTime += callbackInfo.interval;
			}
		}
		
		// Check to see if we've updated to the final time.  If so, return to the caller.
		if (this._currentTime == newTime) {
			return;
		}
	}
}

FixedUpdater.prototype.Time = function () {
	return this._currentTime;
}
