namespace G {
    G.BODY_TEMPLATES.register("tree", () => {
        var sprite = new splitTime.Sprite("crummy-tree.png")
        sprite.xres = 200
        sprite.yres = 400
        sprite.playerOcclusionFadeFactor = 0.7

        var body = new splitTime.Body()

        body.drawable = sprite
        body.baseLength = 0
        body.height = 380

        return body
    })
}