namespace splitTime.testRunner {
    // If we run a some JavaScript in Node with this included,
    // we automatically kick off a simple console run of all tests
    if(__NODE__) {
        defer(() => {
            var runner = new ConsoleTestRunner()
            runner.run()
        })
    }
}