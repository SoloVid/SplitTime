dependsOn("Body.js");

(function() {
	var focusedBody;

    SplitTime.Body.getFocused = function() {
    	return focusedBody;
	};
    SplitTime.Body.setFocused = function(body) {
    	focusedBody = body;
	};
} ());