
describe("FixedUpdater", function () {
	var updater = null;
	
	beforeEach(function () {
		updater = new FixedUpdater();
	});
	
	it("has a default time of 0", function () {
		expect(updater.Time()).toEqual(0);
	});
	
	it("can have its time advanced forward by an offset", function () {
		updater.AdvanceTimeByOffset(10);
		expect(updater.Time()).toEqual(10);
		
		updater.AdvanceTimeByOffset(10);
		expect(updater.Time()).toEqual(20);
		
		updater.AdvanceTimeByOffset(20);
		expect(updater.Time()).toEqual(40);
		
		updater.AdvanceTimeByOffset(50);
		expect(updater.Time()).toEqual(90);
	});
	
	describe("A callback", function () {
		var callCount = 0;

		beforeEach(function () {
			callCount = 0;
			updater.AddCallback(10, function () {
				callCount++;
			});
		});
		
		describe("that's advanceable by offset", function () {
			it("isn't called by default", function () {
				expect(callCount).toEqual(0);
			});
		
			it("is called if time is advanced by the interval, exactly", function () {
				updater.AdvanceTimeByOffset(10);
				expect(callCount).toEqual(1);			
			});

			it("isn't called if time is advanced by shorter than the interval", function () {
				updater.AdvanceTimeByOffset(9);
				expect(callCount).toEqual(0);
			});
		
			it("is called if time is advanced beyond the interval", function () {
				updater.AdvanceTimeByOffset(15);
				expect(callCount).toEqual(1);
			});

			it("is called if time is advanced multiple times to reach the interval", function () {
				updater.AdvanceTimeByOffset(9);
				updater.AdvanceTimeByOffset(1);
				expect(callCount).toEqual(1);
			});
		
			it("has its callback invoked multiple times, once the interval is reached", function () {
				updater.AdvanceTimeByOffset(10);
				expect(callCount).toEqual(1);
			
				updater.AdvanceTimeByOffset(10);
				expect(callCount).toEqual(2);
			
				updater.AdvanceTimeByOffset(15);
				expect(callCount).toEqual(3);
			
				updater.AdvanceTimeByOffset(5);
				expect(callCount).toEqual(4);
			});
		
			it("can have its callback invoked multiple times via one time advancement", function () {
				updater.AdvanceTimeByOffset(50);
				expect(callCount).toEqual(5);

				updater.AdvanceTimeByOffset(25);
				expect(callCount).toEqual(7);

				updater.AdvanceTimeByOffset(25);
				expect(callCount).toEqual(10);
			});
		});
	
		describe("that's advanceable to a specific time", function () {
			it("will be called once if advanced to the interval", function () {
				updater.AdvanceToTime(10);
				expect(callCount).toEqual(1);
			});
			
			it("will only be called once if advanced slightly beyond the interval, but not to twice (the interval).", function () {
				updater.AdvanceToTime(15);
				expect(callCount).toEqual(1);
			});
			
			it("will be called multiple times if advanced to multiple times the interval", function () {
				updater.AdvanceToTime(30);
				expect(callCount).toEqual(3);
			});		
		});
	});
	
	describe("signals time observers at specific times", function () {
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
		
		it("with a single callback", function () {
			AddTestCallback(10);
			updater.AdvanceToTime(10);
			expect(callbackTimes[0][0]).toEqual(10);
		});
		
		it("with multiple callbacks", function () {
			AddTestCallback(2);
			AddTestCallback(5);
			updater.AdvanceToTime(14);

			expect(callbackTimes[0].length).toEqual(5):
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
