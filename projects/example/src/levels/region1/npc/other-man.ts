namespace G.region1.otherMan {
    export const NAME = "other-man"
    export let body: splitTime.Body
    export let speaker: splitTime.conversation.Speaker
    export let npc: splitTime.Npc

    G.BODY_TEMPLATES.register(NAME, function() {
        var body = new splitTime.Body()

        var sprite = new splitTime.Sprite("people/man.png")
        sprite.baseOffY = -6
        sprite.xres = 32
        sprite.yres = 64
        sprite.light = new splitTime.body.SpotLight(0.5)
        body.drawable = sprite

        body.baseLength = 16
        body.height = 56
        return body
    })

    G.FILE_BANK.onNew(function() {
        body = G.BODY_TEMPLATES.getInstance(NAME)
        npc = new splitTime.Npc(body, body.drawable as splitTime.Sprite)
        body.registerTimeAdvanceListener(npc.behavior)
        speaker = new splitTime.conversation.Speaker("Mike", body)
        body.putInPosition(G.region1.hall.floor1.position.MAN_IDLE)
    })

    const workplace = region1.level.getPosition("man-workplace")

    const goToWorkSpec = paths.register("man-go-to-work", p => {
        p.walk(region1.hall.floor1.position.DOOR)
        p.transport(region1.position.hallEntrance)
        p.walk(workplace)
    })
    export const goToWork = () => npc.behavior.set(new splitTime.agent.PathWalker(goToWorkSpec, npc))
}
