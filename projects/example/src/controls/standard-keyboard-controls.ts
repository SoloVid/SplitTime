defer(() => {
    const keycode = splitTime.controls.keyboard.keycode
    const dir = splitTime.direction

    G.joyStick.setKeyboardBindings(dir.N, keycode.W, keycode.UP)
    G.joyStick.setKeyboardBindings(dir.W, keycode.A, keycode.LEFT)
    G.joyStick.setKeyboardBindings(dir.S, keycode.S, keycode.DOWN)
    G.joyStick.setKeyboardBindings(dir.E, keycode.D, keycode.RIGHT)

    G.button.GUI_CONFIRMATION.setKeyboardBindings(keycode.SPACE, keycode.ENTER)
    G.button.PRIMARY_INTERACT.setKeyboardBindings(keycode.SPACE, keycode.ENTER)
    G.button.SWITCH_CHARACTERS.setKeyboardBindings(keycode.Z)
    G.button.SPECIAL.setKeyboardBindings(keycode.X)
    G.button.JUMP.setKeyboardBindings(keycode.C)
    G.button.ATTACK.setKeyboardBindings(keycode.V)

    G.button.PAUSE.setKeyboardBindings(keycode.P)
})
