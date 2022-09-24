import { game_seconds, Timeline } from "../../../../engine/time/timeline"
import { SpeechBubbleState } from "../../../../engine/ui/conversation/runtime/speech-bubble"
import { AdvanceMethod, DASH, howLongForChar } from "../../../../engine/ui/conversation/settings"
import { TextPart } from "../../../../engine/ui/conversation/spec/text-part"
import { conversation } from "../test-conversation"

const group = conversation.group("SpeechBubbleState")

const line = "Hi, mom!"
const lineParts = [{text: line}]

class MockTimeline {
    time: game_seconds = 0
    readonly getTime = () => this.time
}

group.scenario("SpeechBubbleState#notifyFrameUpdate() moves dialog forward", t => {
    const timeline = new MockTimeline()
    const bubble = new SpeechBubbleState(lineParts, timeline as unknown as Timeline)

    // Beginning
    t.assert(!bubble.isFinished(), "Bubble should start unfinished")
    t.assertEqual(line.charAt(0), partsToString(bubble.getDisplayedCurrentParts()), "Bubble should start with first character")

    bubble.notifyFrameUpdate()
    t.assertEqual(line.charAt(0), partsToString(bubble.getDisplayedCurrentParts()), "Bubble should stay as is if no time passed")

    // Just before first character advance
    timeline.time = 0.9 * bubble.msPerChar / 1000
    bubble.notifyFrameUpdate()
    t.assertEqual(line.charAt(0), partsToString(bubble.getDisplayedCurrentParts()), "Bubble should stay at first character until msPerChar reached")

    // Just after first character advance
    timeline.time = 1.001 * bubble.msPerChar / 1000
    bubble.notifyFrameUpdate()
    t.assertEqual(line.substr(0, 2), partsToString(bubble.getDisplayedCurrentParts()), "Bubble should show next character after msPerChar")

    const totalTimeForLine = line.split("").reduce(
        (total, char) => total + howLongForChar(char, bubble.msPerChar), 0) / 1000
    const lastChar = line.charAt(line.length - 1)
    const msForLastChar = howLongForChar(lastChar, bubble.msPerChar)

    // Just before last character
    timeline.time = totalTimeForLine - ((msForLastChar + 1) / 1000)
    bubble.notifyFrameUpdate()
    const almostLine = line.substr(0, line.length - 1)
    t.assertEqual(almostLine, partsToString(bubble.getDisplayedCurrentParts()), "Bubble should advance characters consistently")
    t.assert(!bubble.isFinished(), "Bubble should remain unfinished while line incomplete")

    // Just after last character
    timeline.time = 1.001 * totalTimeForLine
    bubble.notifyFrameUpdate()
    t.assertEqual(line, partsToString(bubble.getDisplayedCurrentParts()), "Bubble should hit end of line at correct time")
    t.assert(!bubble.isFinished(), "Bubble should remain unfinished for delay after line finishes")

    // Just before delay end
    timeline.time = totalTimeForLine + 0.9 * (bubble.delay - msForLastChar) / 1000
    bubble.notifyFrameUpdate()
    t.assert(!bubble.isFinished(), "Bubble should remain unfinished for (delay - msForLastChar) after line finishes")

    // Just after delay end
    timeline.time = totalTimeForLine + 1.001 * (bubble.delay - msForLastChar)
    bubble.notifyFrameUpdate()
    t.assert(bubble.isFinished(), "Bubble should be finished after delay")
    t.assertEqual(line, partsToString(bubble.getDisplayedCurrentParts()), "Bubble should still show full line after finish")
})

group.scenario("SpeechBubbleState#advance() jumps to end", t => {
    const timeline = new MockTimeline()
    const bubble = new SpeechBubbleState(lineParts, timeline as unknown as Timeline)

    bubble.advance()
    t.assertEqual(line, partsToString(bubble.getDisplayedCurrentParts()), "Full line should be displayed")
    t.assert(!bubble.isFinished(), "Bubble should not be finished immediately after advance")

    timeline.time = bubble.delay / 2 / 1000
    bubble.notifyFrameUpdate()
    t.assert(!bubble.isFinished(), "Bubble should still not be finished before delay")
    t.assertEqual(line, partsToString(bubble.getDisplayedCurrentParts()), "Full line should still be displayed")

    timeline.time = 1.001 * bubble.delay / 1000
    bubble.notifyFrameUpdate()
    t.assert(bubble.isFinished(), "Bubble should finish after delay")
})

group.scenario("SpeechBubbleState#advance() x2 forces finish", t => {
    const timeline = new MockTimeline()
    const bubble = new SpeechBubbleState(lineParts, timeline as unknown as Timeline)

    // Advance to end
    bubble.advance()
    // Force finish
    bubble.advance()
    t.assertEqual(line, partsToString(bubble.getDisplayedCurrentParts()), "Full line should be displayed")
    t.assert(bubble.isFinished(), "Bubble should not be finished immediately after advance")

    timeline.time = 0.1
    bubble.notifyFrameUpdate()
    t.assert(bubble.isFinished(), "Bubble should still be finished after time passes")
    t.assertEqual(line, partsToString(bubble.getDisplayedCurrentParts()), "Full line should still be displayed")
})

group.scenario("SpeechBubbleState#advance() is required to finish INTERACTION", t => {
    const timeline = new MockTimeline()
    const bubble = new SpeechBubbleState(lineParts, timeline as unknown as Timeline)
    bubble.setAdvanceMethod(AdvanceMethod.INTERACTION)

    bubble.notifyFrameUpdate()
    timeline.time = 9999
    bubble.notifyFrameUpdate()
    t.assert(!bubble.isFinished(), "Bubble (INTERACTION) shouldn't finish by itself")
    bubble.advance()
    t.assert(bubble.isFinished(), "Bubble (INTERACTION) finishes after advance")
    t.assertEqual(line, partsToString(bubble.getDisplayedCurrentParts()), "Full line should still be displayed")
})

group.scenario("SpeechBubbleState#interrupt() adds dash and jumps to end", t => {
    const timeline = new MockTimeline()
    const bubble = new SpeechBubbleState(lineParts, timeline as unknown as Timeline)

    bubble.interrupt()
    t.assertEqual(line.charAt(0) + DASH, partsToString(bubble.getDisplayedCurrentParts()), "Cut line should be displayed")
    t.assert(!bubble.isFinished(), "Bubble should not be finished immediately after advance")

    timeline.time = bubble.delay / 2 / 1000
    bubble.notifyFrameUpdate()
    t.assert(!bubble.isFinished(), "Bubble should still not be finished before delay")
    t.assertEqual(line.charAt(0) + DASH, partsToString(bubble.getDisplayedCurrentParts()), "Cut line should still be displayed")

    timeline.time = 1.001 * bubble.delay / 1000
    bubble.notifyFrameUpdate()
    t.assert(bubble.isFinished(), "Bubble should finish after delay")
})

group.scenario("SpeechBubbleState#interrupt() just jumps to end if close enough", t => {
    const timeline = new MockTimeline()
    const bubble = new SpeechBubbleState(lineParts, timeline as unknown as Timeline)

    // FTODO: Don't duplicate stanza with other test.
    const totalTimeForLine = line.split("").reduce(
        (total, char) => total + howLongForChar(char, bubble.msPerChar), 0) / 1000
    const lastChar = line.charAt(line.length - 1)
    const msForLastChar = howLongForChar(lastChar, bubble.msPerChar)

    // Just before last character
    timeline.time = totalTimeForLine - ((msForLastChar + 1) / 1000)
    bubble.notifyFrameUpdate()

    bubble.interrupt()
    t.assertEqual(line, partsToString(bubble.getDisplayedCurrentParts()), "Finished line should be displayed")
    t.assert(!bubble.isFinished(), "Bubble should not be finished immediately after advance")

    timeline.time += 1.001 * bubble.delay / 1000
    bubble.notifyFrameUpdate()
    t.assert(bubble.isFinished(), "Bubble should finish after delay")
})

function partsToString(parts: readonly Readonly<TextPart>[]): string {
    return parts.reduce((s, p) => s + p.text, "")
}
