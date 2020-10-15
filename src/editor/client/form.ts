namespace splitTime.editor.level {
    
    interface FieldSpec {
        key: string
        readonly?: boolean
        type?: string
        title?: string
    }

    let editingLevel: Level | null = null
    var editingThing: unknown
    var editFields: FieldSpec[] = []
    
    $(document).ready(function() {
        const backId = "#XMLEditorBack"
        const fieldsId = "#XMLEditorFields"
        const saveButtonId = "#saveChanges"
        var $back = $(backId)
        var $fields = $(fieldsId)
        var $saveButton = $(saveButtonId)
        $back.hide()

        $back.click(function(event) {
            if(event.target == this) {
                $back.hide()
            }
        })

        $fields.on("keyup", "input", function(event) {
            if(event.which == controls.keyboard.keycode.ENTER) {
                $saveButton.click()
            }
        })
        
        $saveButton.click(function(event) {
            for(const field of editFields) {
                Vue.set(editingThing as object, field.key, getEditorValue(field))
                // editingThing[field.key] = getEditorValue(field)
            }
            
            $back.hide()
        })
        
        $("#deleteThing").click(function(event) {
            if(editingLevel === null) {
                console.error("No level from which to delete")
                return
            }
            if(!confirm("Are you sure you want to delete this?")) {
                return
            }
            
            for(var iLayer = 0; iLayer < editingLevel.layers.length; iLayer++) {
                var layer = editingLevel.layers[iLayer]
                if(layer === editingThing) {
                    editingLevel.layers.splice(iLayer, 1)
                    iLayer--
                }
            }
            for(var iTrace = 0; iTrace < editingLevel.traces.length; iTrace++) {
                if(editingLevel.traces[iTrace] === editingThing) {
                    editingLevel.traces.splice(iTrace, 1)
                    iTrace--
                }
            }
            for(var iProp = 0; iProp < editingLevel.props.length; iProp++) {
                if(editingLevel.props[iProp] === editingThing) {
                    editingLevel.props.splice(iProp, 1)
                    iProp--
                }
            }
            for(var iPos = 0; iPos < editingLevel.positions.length; iPos++) {
                if(editingLevel.positions[iPos] === editingThing) {
                    editingLevel.positions.splice(iPos, 1)
                    iPos--
                }
            }
            
            $back.hide()
        })
    })
    
    function showEditor(thing: any, fields: FieldSpec[]) {
        $("#XMLEditorFields").empty()
        editingThing = thing
        editFields = fields
        
        for(const field of fields) {
            var container = $("<div></div>")
            var element
            
            if(!field.type) {
                field.type = "input"
            }
            if(!field.title) {
                field.title = field.key
            }
            
            var value = thing[field.key]
            switch(field.type) {
                case "input":
                element = $("<input/>")
                element.val(value)
                break
                case "number":
                element = $("<input type='number'/>")
                element.val(value)
                break
                case "textarea":
                element = $("<textarea></textarea>")
                element.val(value)
                break
                case "title":
                element = $("<h2>" + value + "</h2>")
                break
                default:
                throw new Error("Unrecognized type: " + field.type)
            }
            
            if(field.readonly) {
                element.attr("readonly", "true")
            }
            
            if(field.key) {
                element.attr("id", "FIELD" + field.key)
            }
            if(field.title) {
                container.append($("<span>" + field.title + ": </span>"))
            }
            container.append(element)
            // container.append("<br />")
            
            $("#XMLEditorFields").append(container)
        }
        
        $("#XMLEditorBack").show()
        var inputs = $("#XMLEditorFields").find("input, textarea")
        var firstInput = inputs.first()
        firstInput.focus()
    }
    
    function getEditorValue(field: any) {
        var strVal = $("#FIELD" + field.key).val()
        switch(field.type) {
            case "number":
            return +(strVal || 0)
        }
        return strVal
    }
    
    export function showEditorLevel(level: Level) {
        showEditor(level, [
            {
                key: "region"
            },
            {
                key: "width",
                type: "number"
            },
            {
                key: "height",
                type: "number"
            },
            {
                key: "background"
            },
            {
                key: "backgroundOffsetX",
                type: "number"
            },
            {
                key: "backgroundOffsetY",
                type: "number"
            }
        ])
    }
    
    export function showEditorLayer(layer: Layer) {
        showEditor(layer.obj, [
            {
                key: "id"
            },
            {
                key: "z",
                type: "number"
            }
        ])
    }
    
    export function showEditorProp(prop: Prop) {
        showEditor(prop.obj, [
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
        ])
    }
    
    export function showEditorPosition(position: Position) {
        showEditor(position.obj, [
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
        ])
    }
    
    export function showEditorTrace(trace: Trace) {
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
        ]
        
        switch(trace.obj.type) {
            case splitTime.trace.Type.STAIRS:
            fields.push({key: "direction"})
            break
            case splitTime.trace.Type.EVENT:
            fields.push({key: "event"})
            break
            case splitTime.trace.Type.POINTER:
            case splitTime.trace.Type.TRANSPORT:
            fields.push({key: "level"})
            fields.push({key: "offsetX", type: "number"})
            fields.push({key: "offsetY", type: "number"})
            fields.push({key: "offsetZ", type: "number"})
            break
        }
        
        showEditor(trace.obj, fields)
    }
}
