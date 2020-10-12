namespace G {
    const titleMenu = new splitTime.menu.MenuSpec()
    titleMenu.cursor = "torch-cursor.png"
    titleMenu.background = "opening-menu.png"
    titleMenu.addPoint(212, 185, newGame)
    titleMenu.addPoint(212, 245, loadGame)
    titleMenu.addPoint(212, 305, rollCredits)

    function runMainMenu(): PromiseLike<void> {
        return G.menu.create(titleMenu).run()
    }

    function showLogo() {
        G.view.see.fillStyle = "#DDDDDD"
        G.view.see.fillRect(0, 0, G.view.width, G.view.height)
        var logo = ASSETS.images.get("logo.png")
        G.view.see.drawImage(
            logo,
            G.view.width / 2 - logo.width / 2,
            G.view.height / 2 - logo.height / 2
        )
        return G.button.GUI_CONFIRMATION.waitForAfterUp()
    }

    export async function launch() {
        G.view.attach("game-view", "bordered" /*, "full-screen"*/)
        await splitTime.load(G.perspective)
        G.main.start()
        await showLogo()
        ASSETS.audio.play("dungeon.mp3")
        runMainMenu()
    }

    async function newGame() {
        await G.FILE_BANK.loadNew()
        G.startTheStory()
    }

    async function loadGame() {
        // TODO: implement
        splitTime.log.warn("Load functionality not yet implemented")
        return runMainMenu()
    }

    async function rollCredits() {
        // TODO: implement
        // var credits = await ASSETS.images.load("credits.png")
        // G.view.see.drawImage(credits, G.view.width - credits.width / 2, 0)
        // splitTime.delay(2)
        //     .then(() => G.button.GUI_CONFIRMATION.waitForAfterUp())
        //     .then(runMainMenu)
        splitTime.log.warn("Credits not yet implemented")
        return runMainMenu()
    }
}
