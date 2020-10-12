namespace G.woman {
    export const NAME = "woman"
    export let body: splitTime.Body
    export let agent: splitTime.player.PlayerAgent
    export let speaker: splitTime.conversation.Speaker

    G.BODY_TEMPLATES.register(NAME, function() {
        var body = new splitTime.Body()

        var sprite = new splitTime.Sprite("people/woman.png")
        sprite.baseOffY = -4
        sprite.xres = 32
        sprite.yres = 64
        sprite.light = new splitTime.body.SpotLight(0.5)
        body.drawable = sprite

        body.height = 56
        // body.hp = 60;
        // body.strg = 60;
        body.spd = 32 * 5
        body.shadow = true
        return body
    })

    G.FILE_BANK.onNew(function() {
        body = G.BODY_TEMPLATES.getInstance(NAME)
    })
    G.FILE_BANK.onLoad(function() {
        agent = player.makeAgent(body)
        agent.setJumpAbility(splitTime.player.ability.Jump.fromMaxHeight(body, body.height * 2))
        agent.setSpecialAbility(new Warp(body))
        agent.setAttackAbility(new splitTime.SlashAbility(body))
        body.registerTimeAdvanceListener(agent)

        // TODO: don't duplicate and put somewhere better
        let knocking = false
        attackEvent.registerListener(body, data => {
            if (!knocking) {
                knocking = true
                splitTime.knockBack(body, data.direction, 512, 0.1).then(() => knocking = false)
            }
        })

        speaker = new splitTime.conversation.Speaker("Steph", body)
    })
}
