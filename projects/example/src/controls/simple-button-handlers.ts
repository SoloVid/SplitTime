defer(() => {
    G.button.SWITCH_CHARACTERS.onDown(function() {
        // TODO
        splitTime.log.debug("switch characters (or rather spawn penguin)")
        const body = G.soldier.make()
        body.putInLocation(new splitTime.InFrontOfBody(G.player.getActiveBody(), 128))

    })

    G.button.JUMP.onDown(function() {
        var currentCharacter = G.player.getActive()
        if (currentCharacter && currentCharacter.body.getLevel().isLoaded()) {
            currentCharacter.doJump()
        }
    })

    G.button.SPECIAL.onDown(function() {
        var currentCharacter = G.player.getActive()
        if (currentCharacter && currentCharacter.body.getLevel().isLoaded()) {
            currentCharacter.doSpecial()
        }
    })

    G.button.ATTACK.onDown(function() {
        var currentCharacter = G.player.getActive()
        if (currentCharacter && currentCharacter.body.getLevel().isLoaded()) {
            currentCharacter.doAttack()
        }
    })

    G.button.PAUSE.onUp(() => {
        if (G.main.isRunning()) {
            G.main.stop()
        } else {
            G.main.start()
        }
    })
})
