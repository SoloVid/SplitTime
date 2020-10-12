namespace G.region1.dialog {
    export const mutterSpec = G.convo.register("man-muttering", mutter)
    export const greetSpec = G.convo.register("first-greet", converse)

    function mutter(d: splitTime.conversation.DSL) {
        const MAN = otherMan.speaker

        d.section(() => {
            d.say(MAN, "Lorem ipsum dolor sit amet, consectetur adipiscing elit.")
            d.say(MAN, "Mauris tellus mi, venenatis vitae accumsan id, scelerisque vitae libero.")
            d.say(MAN, "Aliquam erat volutpat. Sed facilisis pulvinar ligula sit amet imperdiet.")
            d.do(() => splitTime.log.debug("muttering midpoint"))
            d.say(MAN, "Curabitur tristique nunc ipsum, ut facilisis metus aliquet et. Nulla facilisi.")
            d.say(MAN, "Praesent non aliquam tellus, non tincidunt lacus.")
        }).interruptible(true, () => {
            d.say(MAN, "Oh my. Yes. *ahem*")
            converse(d)
        })
    }

    function converse(d: splitTime.conversation.DSL) {
        const MAN = otherMan.speaker
        const WOMAN = woman.speaker

        d.section(() => {
            d.say(WOMAN, "Y'ello!")
            d.say(MAN, "... What's that?")
            d.say(WOMAN, "I said, \"HELLO!\"")
            d.say(MAN, "No need to shout about it!")
            d.say(WOMAN, "But this is a demo!")
            d.say(MAN, "Lot's of people have demos.")
            d.say(MAN, "Get over it.")
        }).cancelable(() => {
            d.say(MAN, "That was rude.")
            d.say(MAN, "She just walked off on me.")
            d.say(MAN, "We'll see if she comes back to see this.")
        })

        d.do(otherMan.goToWork)
    }
}