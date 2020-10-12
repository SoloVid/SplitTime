namespace G {
    splitTime.debug.ENABLED = true
    splitTime.debug.DRAW_TRACES = false

    export const WORLD: splitTime.World = new splitTime.World()
    export const view = new splitTime.ui.View(640, 360)
    export const hud = new splitTime.ui.HUD()
    export const perspective = new splitTime.Perspective(G.WORLD, view, hud)
    export const main = new splitTime.GameLoop(perspective)

    export const keyboard = __DOM__ ? new splitTime.controls.Keyboard(document) : ({} as splitTime.controls.Keyboard)
    export const joyStick = new splitTime.controls.JoyStick(keyboard)
    export const player = new splitTime.player.PlayerManager(perspective, joyStick)

    export const FILE_BANK = new splitTime.file.Bank("example")

    export const convo = splitTime.conversation.createSpecManager(
        main,
        perspective,
        hud
    )
    // TODO: actually set
    export const paths = new splitTime.agent.PathSpecManager()

    export const mainTimeline = G.WORLD.getDefaultTimeline()
    mainTimeline.kSecondsPerRealSecond = 1
    mainTimeline.kSecondsPerMinute = 1

    main.onFrameUpdate(delta => {
        splitTime.debug.setDebugValue("Time", mainTimeline.getTimeOfDayString() + " (" + mainTimeline.getTime().toFixed(2) + ")")
    })

    interface AttackData {
        direction: splitTime.direction_t,
        damage: number
    }
    export const attackEvent = new splitTime.body.CustomEventHandler<AttackData>()
}
