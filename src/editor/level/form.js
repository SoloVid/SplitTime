var editingThing;
var editFields = [];

$(document).ready(function() {
    var $back = $("#XMLEditorBack");
    var $fields = $("#XMLEditorFields");
    var $saveButton = $("#saveChanges");
    $back.hide();

    $back.click(function(event) {
        if(event.target == this) {
            $back.hide();
        }
    });

    $fields.on("keyup", "input", function(event) {
        if(event.which == 13) { // enter
            $saveButton.click();
        }
    });

    $saveButton.click(function(event) {
        for(var i = 0; i < editFields.length; i++) {
            var field = editFields[i];
            Vue.set(editingThing, field.key, getEditorValue(field));
            // editingThing[field.key] = getEditorValue(field);
        }

        $back.hide();
    });

    $("#deleteThing").click(function(event) {
        if(!confirm("Are you sure you want to delete this?")) {
            return;
        }

        for(var iLayer = 0; iLayer < levelObject.layers.length; iLayer++) {
            var layer = levelObject.layers[iLayer];
            if(layer === editingThing) {
                levelObject.layers.splice(iLayer, 1);
                iLayer--;
            } else {
                for(var iTrace = 0; iTrace < layer.traces.length; iTrace++) {
                    if(layer.traces[iTrace] === editingThing) {
                        layer.traces.splice(iTrace, 1);
                        iTrace--;
                    }
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

        $back.hide();
    });
});

function showEditor(thing, fields) {
    $("#XMLEditorFields").empty();
    editingThing = thing;
    editFields = fields;

    for(var i = 0; i < fields.length; i++) {
        var field = fields[i];

        var container = $("<div></div>");
        var element;

        if(!field.type) {
            field.type = "input";
        }
        if(!field.title) {
            field.title = field.key;
        }

        var value = thing[field.key];
        switch(field.type) {
            case "input":
                element = $("<input/>");
                element.val(value);
                break;
            case "number":
                element = $("<input type='number'/>");
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
                console.warn("unrecognized type: " + field.type);
        }

        if(field.readonly) {
            element.attr("readonly", true);
        }

        if(field.key) {
            element.attr("id", "FIELD" + field.key);
        }
        if(field.title) {
            container.append($("<span>" + field.title + ": </span>"));
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

function getEditorValue(field) {
    var strVal = $("#FIELD" + field.key).val();
    switch(field.type) {
        case "number":
            return +strVal;
    }
    return strVal;
}

function showEditorLevel() {
    showEditor(levelObject, [
        {
            key: "region"
        },
        {
            key: "background"
        }
    ]);
}

function showEditorLayer(layer) {
    showEditor(layer, [
        {
            key: "id"
        },
        {
            key: "z",
            type: "number"
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
            key: "x",
            type: "number"
        },
        {
            key: "y",
            type: "number"
        },
        {
            key: "z",
            type: "number"
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
        {
            key: "template"
        },
        {
            key: "x",
            type: "number"
        },
        {
            key: "y",
            type: "number"
        },
        {
            key: "z",
            type: "number"
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
    var fields = [
        {
            key: "id"
        },
        {
            key: "type",
            readonly: true
        },
        {
            type: "textarea",
            key: "vertices"
        },
        {
            key: "z",
            type: "number"
        },
        {
            key: "height",
            type: "number"
        }
    ];

    switch(trace.type) {
        case splitTime.Trace.Type.STAIRS:
            fields.push({key: "direction"});
            break;
        case splitTime.Trace.Type.EVENT:
            fields.push({key: "event"});
            break;
        case splitTime.Trace.Type.POINTER:
        case splitTime.Trace.Type.TRANSPORT:
            fields.push({key: "level"});
            fields.push({key: "offsetX", type: "number"});
            fields.push({key: "offsetY", type: "number"});
            fields.push({key: "offsetZ", type: "number"});
            break;
    }

    showEditor(trace, fields);
}
