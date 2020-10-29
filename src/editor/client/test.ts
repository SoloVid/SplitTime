namespace splitTime.editor.level {
    async function exerciseApi() {
        const api = new server.EditorTsApi()
        const test1Response = await api.test1.fetch("himom (from client)")
        log.debug(test1Response)
        const test2Response = await api.test2.fetch(3)
        log.debug(test2Response)
    }
    defer(() => {
        exerciseApi()
    })
}