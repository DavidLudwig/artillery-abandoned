
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
});
