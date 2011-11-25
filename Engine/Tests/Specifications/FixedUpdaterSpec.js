
describe("FixedUpdater", function () {
	var updater = null;
	
	beforeEach(function () {
		updater = new FixedUpdater();
	});
	
	it("has a default time of 0", function () {
		expect(updater.Time()).toEqual(0);
	});
	
	it("can have its time advanced forward by an offset", function () {
		updater.AdvanceTime(10);
		expect(updater.Time()).toEqual(10);
		
		updater.AdvanceTime(10);
		expect(updater.Time()).toEqual(20);
		
		updater.AdvanceTime(20);
		expect(updater.Time()).toEqual(40);
		
		updater.AdvanceTime(50);
		expect(updater.Time()).toEqual(90);
	});
	
	describe("Callback Invocation", function () {
//	it("can have a callback invoked on intervals as time elapses", function () {
		var callCount = 0;

		beforeEach(function () {
			callCount = 0;
			updater.AddCallback(10, function () {
				callCount++;
			});
		});
		
		it("isn't called by default", function () {
			expect(callCount).toEqual(0);
		});
		
		it("is called if time is advanced by the interval, exactly", function () {
			updater.AdvanceTime(10);
			expect(callCount).toEqual(1);			
		});

		it("isn't called if time is advanced by shorter than the interval", function () {
			updater.AdvanceTime(9);
			expect(callCount).toEqual(0);
		});
		
		it("is called if time is advanced beyond the interval", function () {
			updater.AdvanceTime(15);
			expect(callCount).toEqual(1);
		});

		it("is called if time is advanced multiple times to reach the interval", function () {
			updater.AdvanceTime(9);
			updater.AdvanceTime(1);
			expect(callCount).toEqual(1);
		});
		
		it("has its callback invoked multiple times, once the interval is reached", function () {
			updater.AdvanceTime(10);
			expect(callCount).toEqual(1);
			
			updater.AdvanceTime(10);
			expect(callCount).toEqual(2);
			
			updater.AdvanceTime(15);
			expect(callCount).toEqual(3);
			
			updater.AdvanceTime(5);
			expect(callCount).toEqual(4);
		});
		
		it("can have its callback invoked multiple times via one time advancement", function () {
			updater.AdvanceTime(50);
			expect(callCount).toEqual(5);

			updater.AdvanceTime(25);
			expect(callCount).toEqual(7);

			updater.AdvanceTime(25);
			expect(callCount).toEqual(10);
		});
		
		/*
		// Call it again.
		updater.AdvanceTime(10);
		expect(callCount).toEqual(2);
		
		// Call it halfway.
		updater.AdvanceTime(5);
		expect(callCount).toEqual(2);
		
		// Call it the rest of the way.
		updater.AdvanceTime(5);
		expect(callCount).toEqual(3);
		
		// Call it multiple times.
		*/
	});
});
