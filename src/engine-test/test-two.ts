namespace SplitTime.test_group_two {
    SplitTime.test.group(test_group_two, "Test group two")

    SplitTime.test.scenario(test_group_two, "This is the first two test", t => {
        t.assert(true, "Tru dat")
        t.assertEqual(1, 1, "duh")
    })

    SplitTime.test.scenario(test_group_two, "Second two test", t => {
        t.assertEqual(1, 2, "Uh oh")
    })
}