namespace G {
    G.BODY_TEMPLATES.register("fire-ring", () => {
        var sprite = new splitTime.Sprite("fire-ring.png")
        sprite.xres = 188
        sprite.yres = 82

        var body = new splitTime.Body()

        body.drawable = sprite
        body.baseLength = 32
        body.height = 128

        return body
    })
}