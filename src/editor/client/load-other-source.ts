namespace splitTime.editor.level {
    var projectName = window.location.hash.substring(1);
    while(!projectName) {
        projectName = prompt("project folder name:") || "";
    }
    window.location.hash = "#" + projectName;
    export var projectPath = "projects/" + projectName + "/";
    
    $(document).ready(async function() {
        $.getScript(projectPath + "dist/game.js", () => {
            // $.getScript("src/editor/level/vue-setup.js", function() {
                setupEventHandlers();
            // });
        });

        const api = new server.EditorTsApi()
        const test1Response = await api.test1.fetch("from client")
        console.log(test1Response)
        const test2Response = await api.test2.fetch(4)
        console.log(test2Response)
    });
}
