var projectName = window.location.hash.substring(1);
while(!projectName) {
	projectName = prompt("project folder name:");
}
window.location.hash = "#" + projectName;
var projectPath = "projects/" + projectName + "/";

$(document).ready(function() {
	$.getScript(projectPath + "dist/game.js", function() {
		subImg = $("#subImg").get(0);
		ctx = subImg.getContext("2d");
		subImg2 = $("#subImg2").get(0);

		var t = new SplitTime.Body();
		ctx.fillStyle = "#CD96CD";
		ctx.fillRect(5, 5, t.xres - 10, t.yres - 10);
		subImg = subImg.toDataURL();
		ctx = subImg2.getContext("2d");
		ctx.fillStyle = "rgba(0, 0, 0, 0)";
		ctx.fillRect(0, 0, 320, 320);
		subImg2 = subImg2.toDataURL();

		$.getScript("src/editor/level/vue-setup.js", function() {
			setupEventHandlers();
		});
	});
});
