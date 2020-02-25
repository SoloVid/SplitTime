// If we run a some JavaScript in Node with this included,
// we automatically kick off a simple console run of all tests
if(__NODE__) {
    var runner = new SplitTime.ConsoleTestRunner();
    runner.run();
}