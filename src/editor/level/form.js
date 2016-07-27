function showEditor(fields) {
    $("#XMLEditorFields").empty();

    for(var i = 0; i < fields.length; i++) {
        var field = fields[i];

        var container = $("<div></div>");
        var element;

        if(!field.type) {
            field.type = "input";
        }
        if(!field.title) {
            field.title = field.id;
        }

        switch(field.type) {
            case "input":
                element = $("<input></input>");
                element.val(field.value);
                break;
            case "textarea":
                element = $("<textarea></textarea>");
                element.val(field.value);
                break;
            case "title":
                element = $("<h2>" + field.value + "</h2>");
                break;
            default:
                console.log("unrecognized type: " + field.type);
        }

        if(field.id) {
            element.attr("id", "FIELD" + field.id);
        }
        if(field.title) {
            container.append($("<span>" + field.title + ": </span>"));
        }
        container.append(element);
        // container.append("<br />");

        $("#XMLEditorFields").append(container);
    }

    $("#XMLEditorBack").show();
}

function getEditorValue(id) {
    return $("#FIELD" + id).val();
}

function showEditorProp(prop) {
    editorOpen = "prop";
    showEditor([
        {
            value: prop.attr("id"),
            id: "id"
        },
        {
            value: prop.attr("template"),
            id: "template"
        },
        {
            value: prop.attr("x"),
            id: "x"
        },
        {
            value: prop.attr("y"),
            id: "y"
        },
        {
            value: prop.attr("layer"),
            id: "layer"
        },
        {
            value: prop.attr("dir"),
            id: "dir"
        },
        {
            value: prop.attr("stance"),
            id: "stance"
        }
    ]);
}

function showEditorPosition(position) {
    editorOpen = "position";
    showEditor([
        {
            value: position.attr("id"),
            id: "id"
        },
        {
            value: position.find("alias").attr("actor"),
            id: "actor"
        },
        {
            value: position.find("alias").text(),
            id: "alias"
        },
        {
            value: position.attr("x"),
            id: "x"
        },
        {
            value: position.attr("y"),
            id: "y"
        },
        {
            value: position.attr("layer"),
            id: "layer"
        },
        {
            value: position.attr("dir"),
            id: "dir"
        },
        {
            value: position.attr("stance"),
            id: "stance"
        }
    ]);
}

function showEditorTrace(trace) {
    editorOpen = "trace";
    showEditor([
        {
            value: trace.attr("id"),
            id: "id"
        },
        {
            value: trace.attr("type"),
            id: "type"
        },
        {
            value: prop.attr("reference"),
            id: "reference"
        },
        {
            value: prop.text(),
            id: "definition"
        }
    ]);
}
