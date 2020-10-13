namespace splitTime.editor.level {
    var projectName = window.location.hash.substring(1);
    while(!projectName) {
        projectName = prompt("project folder name:") || "";
    }
    window.location.hash = "#" + projectName;
    export var projectPath = "projects/" + projectName + "/";
    
    $(document).ready(function() {
        $.getScript(projectPath + "dist/game.js", function() {
            subImg = $("#subImg").get(0) as HTMLCanvasElement;
            let ctx = subImg.getContext("2d");
            if (!ctx) {
                throw new Error("Failed to get context for placeholder image")
            }
            subImg2 = $("#subImg2").get(0) as HTMLCanvasElement;
            
            var t = new splitTime.Body();
            const width = 32
            const height = 64
            ctx.fillStyle = "#CD96CD";
            ctx.fillRect(5, 5, width - 10, height - 10);
            subImg = subImg.toDataURL();
            ctx = subImg2.getContext("2d");
            if (!ctx) {
                throw new Error("Failed to get context for placeholder image 2")
            }
            ctx.fillStyle = "rgba(0, 0, 0, 0)";
            ctx.fillRect(0, 0, 320, 320);
            subImg2 = subImg2.toDataURL();
            
            // $.getScript("src/editor/level/vue-setup.js", function() {
                setupEventHandlers();
            // });
        });
    });
}
