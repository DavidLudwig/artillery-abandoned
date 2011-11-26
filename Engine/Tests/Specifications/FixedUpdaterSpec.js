
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
});
