namespace G {
    export var menu: splitTime.menu.MenuMan
}

defer(() => {
    const controls = new splitTime.menu.MenuControls(
        G.joyStick,
        G.button.GUI_CONFIRMATION,
        G.button.GUI_CANCEL
    )
    G.menu = new splitTime.menu.MenuMan(G.view, controls, G.hud)
})
