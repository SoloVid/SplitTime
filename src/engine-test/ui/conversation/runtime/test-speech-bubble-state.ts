namespace splitTime.conversation {
    const group = {}
    splitTime.test.group(group, "SpeechBubbleState", conversation)

    const line = "Hi, mom!"

    splitTime.test.scenario(group, "SpeechBubbleState#notifyFrameUpdate() moves dialog forward", t => {
        const location = new TimeLocation()
        const bubble = new SpeechBubbleState("", line, location)

        // Beginning
        t.assert(!bubble.isFinished(), "Bubble should start unfinished")
        t.assertEqual(line.charAt(0), bubble.getDisplayedCurrentLine(), "Bubble should start with first character")

        bubble.notifyFrameUpdate()
        t.assertEqual(line.charAt(0), bubble.getDisplayedCurrentLine(), "Bubble should stay as is if no time passed")

        // Just before first character advance
        location.time = 0.9 * bubble.msPerChar / 1000
        bubble.notifyFrameUpdate()
        t.assertEqual(line.charAt(0), bubble.getDisplayedCurrentLine(), "Bubble should stay at first character until msPerChar reached")

        // Just after first character advance
        location.time = 1.001 * bubble.msPerChar / 1000
        bubble.notifyFrameUpdate()
        t.assertEqual(line.substr(0, 2), bubble.getDisplayedCurrentLine(), "Bubble should show next character after msPerChar")

        const totalTimeForLine = line.split("").reduce(
            (total, char) => total + howLongForChar(char, bubble.msPerChar), 0) / 1000
        const lastChar = line.charAt(line.length - 1)
        const msForLastChar = howLongForChar(lastChar, bubble.msPerChar)

        // Just before last character
        location.time = totalTimeForLine - ((msForLastChar + 1) / 1000)
        bubble.notifyFrameUpdate()
        const almostLine = line.substr(0, line.length - 1)
        t.assertEqual(almostLine, bubble.getDisplayedCurrentLine(), "Bubble should advance characters consistently")
        t.assert(!bubble.isFinished(), "Bubble should remain unfinished while line incomplete")

        // Just after last character
        location.time = 1.001 * totalTimeForLine
        bubble.notifyFrameUpdate()
        t.assertEqual(line, bubble.getDisplayedCurrentLine(), "Bubble should hit end of line at correct time")
        t.assert(!bubble.isFinished(), "Bubble should remain unfinished for delay after line finishes")

        // Just before delay end
        location.time = totalTimeForLine + 0.9 * bubble.delay / 1000
        bubble.notifyFrameUpdate()
        t.assert(!bubble.isFinished(), "Bubble should remain unfinished for delay after line finishes")

        // Just after delay end
        location.time = totalTimeForLine + 1.001 * bubble.delay
        bubble.notifyFrameUpdate()
        t.assert(bubble.isFinished(), "Bubble should be finished after delay")
        t.assertEqual(line, bubble.getDisplayedCurrentLine(), "Bubble should still show full line after finish")
    })

    splitTime.test.scenario(group, "SpeechBubbleState#advance() jumps to end", t => {
        const location = new TimeLocation()
        const bubble = new SpeechBubbleState("", line, location)

        bubble.advance()
        t.assertEqual(line, bubble.getDisplayedCurrentLine(), "Full line should be displayed")
        t.assert(!bubble.isFinished(), "Bubble should not be finished immediately after advance")

        location.time = bubble.delay / 2 / 1000
        bubble.notifyFrameUpdate()
        t.assert(!bubble.isFinished(), "Bubble should still not be finished before delay")
        t.assertEqual(line, bubble.getDisplayedCurrentLine(), "Full line should still be displayed")

        location.time = 1.001 * bubble.delay / 1000
        bubble.notifyFrameUpdate()
        t.assert(bubble.isFinished(), "Bubble should finish after delay")
    })

    splitTime.test.scenario(group, "SpeechBubbleState#advance() x2 forces finish", t => {
        const location = new TimeLocation()
        const bubble = new SpeechBubbleState("", line, location)

        // Advance to end
        bubble.advance()
        // Force finish
        bubble.advance()
        t.assertEqual(line, bubble.getDisplayedCurrentLine(), "Full line should be displayed")
        t.assert(bubble.isFinished(), "Bubble should not be finished immediately after advance")

        location.time = 0.1
        bubble.notifyFrameUpdate()
        t.assert(bubble.isFinished(), "Bubble should still be finished after time passes")
        t.assertEqual(line, bubble.getDisplayedCurrentLine(), "Full line should still be displayed")
    })

    splitTime.test.scenario(group, "SpeechBubbleState#advance() is required to finish INTERACTION", t => {
        const location = new TimeLocation()
        const bubble = new SpeechBubbleState("", line, location)
        bubble.setAdvanceMethod(AdvanceMethod.INTERACTION)

        bubble.notifyFrameUpdate()
        location.time = 9999
        bubble.notifyFrameUpdate()
        t.assert(!bubble.isFinished(), "Bubble (INTERACTION) shouldn't finish by itself")
        bubble.advance()
        t.assert(bubble.isFinished(), "Bubble (INTERACTION) finishes after advance")
        t.assertEqual(line, bubble.getDisplayedCurrentLine(), "Full line should still be displayed")
    })

    splitTime.test.scenario(group, "SpeechBubbleState#interrupt() adds dash and jumps to end", t => {
        const location = new TimeLocation()
        const bubble = new SpeechBubbleState("", line, location)

        bubble.interrupt()
        t.assertEqual(line.charAt(0) + DASH, bubble.getDisplayedCurrentLine(), "Cut line should be displayed")
        t.assert(!bubble.isFinished(), "Bubble should not be finished immediately after advance")

        location.time = bubble.delay / 2 / 1000
        bubble.notifyFrameUpdate()
        t.assert(!bubble.isFinished(), "Bubble should still not be finished before delay")
        t.assertEqual(line.charAt(0) + DASH, bubble.getDisplayedCurrentLine(), "Cut line should still be displayed")

        location.time = 1.001 * bubble.delay / 1000
        bubble.notifyFrameUpdate()
        t.assert(bubble.isFinished(), "Bubble should finish after delay")
    })

    splitTime.test.scenario(group, "SpeechBubbleState#interrupt() just jumps to end if close enough", t => {
        const location = new TimeLocation()
        const bubble = new SpeechBubbleState("", line, location)

        // FTODO: Don't duplicate stanza with other test.
        const totalTimeForLine = line.split("").reduce(
            (total, char) => total + howLongForChar(char, bubble.msPerChar), 0) / 1000
        const lastChar = line.charAt(line.length - 1)
        const msForLastChar = howLongForChar(lastChar, bubble.msPerChar)

        // Just before last character
        location.time = totalTimeForLine - ((msForLastChar + 1) / 1000)
        bubble.notifyFrameUpdate()

        bubble.interrupt()
        t.assertEqual(line, bubble.getDisplayedCurrentLine(), "Finished line should be displayed")
        t.assert(!bubble.isFinished(), "Bubble should not be finished immediately after advance")

        location.time += 1.001 * bubble.delay / 1000
        bubble.notifyFrameUpdate()
        t.assert(bubble.isFinished(), "Bubble should finish after delay")
    })

    class TimeLocation implements ILevelLocation2 {
        level = {
            getRegion: () => this.region
        } as Level
        x = 0
        y = 0
        z = 0

        time: game_seconds = 0

        private timeline = {
            getTime: () => this.time
        }
        private region = {
            getTimeline: () => this.timeline
        }
    }
}