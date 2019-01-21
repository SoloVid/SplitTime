var editingThing;
var editFields = [];

$(document).ready(function() {
    $("#XMLEditorFields").on("keyup", "input", function(event) {
        if(event.which == 13) {
            $("#saveChanges").click();
        }
    });

    $("#saveChanges").click(function(event) {
        for(var i = 0; i < editFields.length; i++) {
            var field = editFields[i];
            editingThing[field] = getEditorValue(field);
        }

        $("#XMLEditorBack").hide();
    });

    $("#deleteThing").click(function(event) {
        if(!confirm("Are you sure you want to delete this?")) {
            return;
        }

        for(var iLayer = 0; iLayer < levelObject.layers.length; iLayer++) {
            var layer = levelObject.layers[iLayer];
            for(var iTrace = 0; iTrace < layer.traces.length; iTrace++) {
                if(layer.traces[iTrace] === editingThing) {
                    layer.traces.splice(iTrace, 1);
                    iTrace--;
                }
            }
        }
        for(var iProp = 0; iProp < levelObject.props.length; iProp++) {
            if(levelObject.props[iProp] === editingThing) {
                levelObject.props.splice(iProp, 1);
                iProp--;
            }
        }
        for(var iPos = 0; iPos < levelObject.positions.length; iPos++) {
            if(levelObject.positions[iPos] === editingThing) {
                levelObject.positions.splice(iPos, 1);
                iPos--;
            }
        }

        $("#XMLEditorBack").hide();
    });
});

function showEditor(thing, fieldSpecs) {
    $("#XMLEditorFields").empty();
    editingThing = thing;
    editFields = [];

    for(var i = 0; i < fieldSpecs.length; i++) {
        var fieldSpec = fieldSpecs[i];
        editFields.push(fieldSpec.key);

        var container = $("<div></div>");
        var element;

        if(!fieldSpec.type) {
            fieldSpec.type = "input";
        }
        if(!fieldSpec.title) {
            fieldSpec.title = fieldSpec.key;
        }

        var value = thing[fieldSpec.key];
        switch(fieldSpec.type) {
            case "input":
                element = $("<input/>");
                element.val(value);
                break;
            case "textarea":
                element = $("<textarea></textarea>");
                element.val(value);
                break;
            case "title":
                element = $("<h2>" + value + "</h2>");
                break;
            default:
                console.warn("unrecognized type: " + fieldSpec.type);
        }

        if(fieldSpec.key) {
            element.attr("id", "FIELD" + fieldSpec.key);
        }
        if(fieldSpec.title) {
            container.append($("<span>" + fieldSpec.title + ": </span>"));
        }
        container.append(element);
        // container.append("<br />");

        $("#XMLEditorFields").append(container);
    }

    $("#XMLEditorBack").show();
    var inputs = $("#XMLEditorFields").find("input, textarea");
    var firstInput = inputs.first();
    firstInput.focus();
}

function getEditorValue(id) {
    return $("#FIELD" + id).val();
}

function showEditorLayer(layer) {
    showEditor(layer, [
        {
            key: "id"
        },
        {
            key: "background"
        },
        {
            key: "height"
        }
    ]);
}

function showEditorProp(prop) {
    showEditor(prop, [
        {
            key: "id"
        },
        {
            key: "template"
        },
        {
            key: "x"
        },
        {
            key: "y"
        },
        {
            key: "z"
        },
        {
            key: "dir"
        },
        {
            key: "stance"
        }
    ]);
}

function showEditorPosition(position) {
    showEditor(position, [
        {
            key: "id"
        },
        // {
        //     key: "actorAlias"
        // },
        {
            key: "alias"
        },
        {
            key: "x"
        },
        {
            key: "y"
        },
        {
            key: "z"
        },
        {
            key: "dir"
        },
        {
            key: "stance"
        }
    ]);
}

function showEditorTrace(trace) {
    showEditor(trace, [
        {
            key: "id"
        },
        {
            key: "type"
        },
        {
            key: "reference"
        },
        {
            key: "dir"
        },
        {
            type: "textarea",
            key: "vertices"
        }
    ]);
}
