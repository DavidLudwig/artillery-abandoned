
describe("FixedUpdater", function () {
	var updater = null;
	
	beforeEach(function () {
		updater = new FixedUpdater();
	});
	
	describe("can be externally queried about its current time", function () {
		it("the value of which is zero by default.", function () {
			expect(updater.Time()).toEqual(0);
		});
	
		it("the value of which updates as time is updated.", function () {
			updater.AdvanceToTime(10);
			expect(updater.Time()).toEqual(10);
		
			updater.AdvanceToTime(20);
			expect(updater.Time()).toEqual(20);
		
			updater.AdvanceTimeByOffset(20);
			expect(updater.Time()).toEqual(40);
		
			updater.AdvanceTimeByOffset(50);
			expect(updater.Time()).toEqual(90);
		});
	});

	describe("can have callbacks", function () {
		it("that can be added after some amount of time has elapsed.", function () {
			var callCount = 0;
			updater.AdvanceToTime(100);
			updater.AddCallback(10, function () {
				callCount++;
			});
			updater.AdvanceToTime(120);
			expect(callCount).toEqual(2);
		});
		
		describe("that will be invoked a certain number of times as time is advanced", function () {
			var callCount = 0;

			beforeEach(function () {
				callCount = 0;
				updater.AddCallback(10, function () {
					callCount++;
				});
			});
		
			describe("by an offset.", function () {
				it("They aren't called by default.", function () {
					expect(callCount).toEqual(0);
				});
		
				it("They are called if time is advanced by the interval, exactly.", function () {
					updater.AdvanceTimeByOffset(10);
					expect(callCount).toEqual(1);			
				});

				it("They aren't called if time is advanced by less than the interval.", function () {
					updater.AdvanceTimeByOffset(9);
					expect(callCount).toEqual(0);
				});
		
				it("They are called if time is advanced beyond the interval.", function () {
					updater.AdvanceTimeByOffset(15);
					expect(callCount).toEqual(1);
				});

				it("They are called if time is advanced multiple times to reach the interval.", function () {
					updater.AdvanceTimeByOffset(9);
					updater.AdvanceTimeByOffset(1);
					expect(callCount).toEqual(1);
				});
		
				it("They can be invoked multiple times across multiple time advancements.", function () {
					updater.AdvanceTimeByOffset(10);
					expect(callCount).toEqual(1);
			
					updater.AdvanceTimeByOffset(10);
					expect(callCount).toEqual(2);
			
					updater.AdvanceTimeByOffset(15);
					expect(callCount).toEqual(3);
			
					updater.AdvanceTimeByOffset(5);
					expect(callCount).toEqual(4);
				});
		
				it("They invoked multiple times via a single, large time advancement.", function () {
					updater.AdvanceTimeByOffset(50);
					expect(callCount).toEqual(5);

					updater.AdvanceTimeByOffset(25);
					expect(callCount).toEqual(7);

					updater.AdvanceTimeByOffset(25);
					expect(callCount).toEqual(10);
				});
			});
	
			describe("to a specific time.", function () {
				it("They will be called once, if time is advanced to the interval.", function () {
					updater.AdvanceToTime(10);
					expect(callCount).toEqual(1);
				});
			
				it("They will only be called once if time is advanced slightly beyond the interval.", function () {
					updater.AdvanceToTime(15);
					expect(callCount).toEqual(1);
				});
			
				it("They will be called multiple times if time is advanced to multiple times the interval.", function () {
					updater.AdvanceToTime(30);
					expect(callCount).toEqual(3);
				});		
			});
		});
		
		describe("that can query for the current time, the value of which won't be listed as being in the future.", function () {
			var callbackTimes = null;

			beforeEach(function () {
				callbackTimes = new Array();
			});

			function AddTestCallback(interval) {
				var indexIntoTestResults = callbackTimes.length;
				callbackTimes.push(new Array());
				updater.AddCallback(interval, function () {
					callbackTimes[indexIntoTestResults].push(updater.Time());
				});
			}

			it("It works with a single callback.", function () {
				AddTestCallback(10);
				updater.AdvanceToTime(10);
				expect(callbackTimes[0][0]).toEqual(10);
			});

			it("It works with multiple callbacks, with staggered intervals whose signalling times may not equal one another.", function () {
				AddTestCallback(2);
				AddTestCallback(5);
				updater.AdvanceToTime(14);

				expect(callbackTimes[0].length).toEqual(7);
				expect(callbackTimes[0][0]).toEqual(2);
				expect(callbackTimes[0][1]).toEqual(4);
				expect(callbackTimes[0][2]).toEqual(6);
				expect(callbackTimes[0][3]).toEqual(8);
				expect(callbackTimes[0][4]).toEqual(10);
				expect(callbackTimes[0][5]).toEqual(12);
				expect(callbackTimes[0][6]).toEqual(14);

				expect(callbackTimes[1].length).toEqual(2);
				expect(callbackTimes[1][0]).toEqual(5);
				expect(callbackTimes[1][1]).toEqual(10);
			});
		});
	});
	
	describe("the concept of simulated time, which is separate from real time", function () {
		it("starts at zero", function () {
			expect(updater.SimulatedTime()).toEqual(0);
		});
		
		it("increments as real-time is incremented", function () {
			updater.AdvanceToTime(20);
			expect(updater.SimulatedTime()).toEqual(20);

			updater.AdvanceToTime(100);
			expect(updater.SimulatedTime()).toEqual(100);
		});
		
		describe("simulated time with paused states", function () {
			it("doesn't increment if the updater is paused", function () {
				updater.Pause();
				updater.AdvanceToTime(20);
				expect(updater.SimulatedTime()).toEqual(0);
			});
		
			it("will resume once the updater is resumed, without factoring in paused time", function () {
				updater.Pause();
				expect(updater.SimulatedTime()).toEqual(0);

				updater.AdvanceToTime(10);
				expect(updater.SimulatedTime()).toEqual(0);
				
				updater.Resume();
				expect(updater.SimulatedTime()).toEqual(0);

				updater.AdvanceToTime(30);
				expect(updater.SimulatedTime()).toEqual(20);

				updater.AdvanceToTime(70);
				expect(updater.SimulatedTime()).toEqual(60);

				updater.Pause();
				updater.AdvanceToTime(100);
				expect(updater.SimulatedTime()).toEqual(60);

				updater.Resume();
				expect(updater.SimulatedTime()).toEqual(60);
				
				updater.AdvanceToTime(110);
				expect(updater.SimulatedTime()).toEqual(70);
				
				updater.Pause();
				expect(updater.SimulatedTime()).toEqual(70);
				
				updater.AdvanceToTime(115);
				expect(updater.SimulatedTime()).toEqual(70);
				
				updater.Resume();
				expect(updater.SimulatedTime()).toEqual(70);
				
				updater.AdvanceToTime(120);
				expect(updater.SimulatedTime()).toEqual(75);
			});
		});
		
		it("allows callbacks to retrieve simulated time, and interpolates time for callbacks that occur in the middle of large advancements", function () {
			var SimulatedTimesOnAFiveSecondCallback = new Array();
			updater.AddCallback(5, function () {
				SimulatedTimesOnAFiveSecondCallback.push(updater.SimulatedTime());
			});

			var SimulatedTimesOnATenSecondCallback = new Array();
			updater.AddCallback(10, function () {
				SimulatedTimesOnATenSecondCallback.push(updater.SimulatedTime());
			});
			
			updater.AdvanceToTime(12);
			expect(SimulatedTimesOnAFiveSecondCallback.length).toEqual(2);
			expect(SimulatedTimesOnAFiveSecondCallback[0]).toEqual(5);
			expect(SimulatedTimesOnAFiveSecondCallback[1]).toEqual(10);
			expect(SimulatedTimesOnATenSecondCallback.length).toEqual(1);
			expect(SimulatedTimesOnATenSecondCallback[0]).toEqual(10);
			
			updater.AdvanceToTime(25);
			expect(SimulatedTimesOnAFiveSecondCallback.length).toEqual(5);
			expect(SimulatedTimesOnAFiveSecondCallback[0]).toEqual(5);
			expect(SimulatedTimesOnAFiveSecondCallback[1]).toEqual(10);
			expect(SimulatedTimesOnAFiveSecondCallback[2]).toEqual(15);
			expect(SimulatedTimesOnAFiveSecondCallback[3]).toEqual(20);
			expect(SimulatedTimesOnAFiveSecondCallback[4]).toEqual(25);
			expect(SimulatedTimesOnATenSecondCallback.length).toEqual(2);
			expect(SimulatedTimesOnATenSecondCallback[0]).toEqual(10);
			expect(SimulatedTimesOnATenSecondCallback[1]).toEqual(20);
		});

		it("won't erronously compute callback intervals based off of real-time", function () {
			var SimulatedTimesFromCallback = new Array();
			updater.AddCallback(10, function () {
				SimulatedTimesFromCallback.push(updater.SimulatedTime());
			});
			
			updater.Pause();
			updater.AdvanceToTime(54);
			updater.Resume();
			updater.AdvanceToTime(70);
			expect(SimulatedTimesFromCallback.length).toEqual(1);
			expect(SimulatedTimesFromCallback[0]).toEqual(10);
		});
	});

	describe("pause and resume with callbacks", function () {
		it("won't invoke callbacks, if the updater is paused before any updates occur", function () {
			// Set up a call-counting callback
			var callCount = 0;
			updater.AddCallback(10, function () {
				callCount++;
			});

			// Pause the updater.
			updater.Pause();
			
			// Advance time by a bit, observing that no callbacks have been invoked.
			updater.AdvanceToTime(100);
			expect(callCount).toEqual(0);
			
			// Resume the updater, observing that callbacks still have not been invoked.
			updater.Resume();
			expect(callCount).toEqual(0);
			
			// Advance time a bit mroe, observing that callbacks are invoked, but only from the resumed time.
			// Paused time is not considered when determining how many times to invoke callbacks.
			updater.AdvanceToTime(150);
			expect(callCount).toEqual(5);
		});
		
		it("can have callbacks added while the updater is paused, which will be invoked once the updater resumes and time is advanced", function () {
			updater.Pause();
			updater.AdvanceToTime(100);
			var callCount = 0;
			updater.AddCallback(10, function () {
				callCount++;
			});
			updater.AdvanceToTime(110);
			expect(callCount).toEqual(0);

			updater.Resume();
			expect(callCount).toEqual(0);

			updater.AdvanceToTime(120);
			expect(callCount).toEqual(1);
		});
	});
});
