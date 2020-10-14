namespace splitTime.editor.level {
    var projectName = window.location.hash.substring(1);
    while(!projectName) {
        projectName = prompt("project folder name:") || "";
    }
    window.location.hash = "#" + projectName;
    export var projectPath = "projects/" + projectName + "/";
    
    $(document).ready(function() {
        $.getScript(projectPath + "dist/game.js", () => {
            // $.getScript("src/editor/level/vue-setup.js", function() {
                setupEventHandlers();
            // });
        });
    });
}
