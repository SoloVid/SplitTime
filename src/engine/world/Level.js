SplitTime.Level = function(levelId) {
    this.id = levelId;
    this.functions = {};
    this.positions = {};
    this.region = null;
    this.agents = [];
    this.bodies = [];
};

SplitTime.Level.prototype.getRegion = function() {
    return this.region;
};

SplitTime.Level.prototype.getPosition = function(positionId) {
    return this.positions[positionId];
};

SplitTime.Level.prototype.registerFunction = function(functionId, fun) {
    this.functions[functionId] = fun;
};

SplitTime.Level.prototype.registerPosition = function(positionId, position) {
    this.positions[positionId] = position;
};

SplitTime.Level.prototype.runFunction = function(functionId) {
    var fun = this.functions[functionId] || function() { };
    fun();
};

SplitTime.Level.prototype.getAgents = function() {
    // TODO: implement
    var agents = [];
    for(var i = 0; i < this.bodies.length; i++) {
        var agent = this.bodies[i].getAgent();
        if(agent) {
            agents.push(agent);
        }
    }
    return agents;
};

SplitTime.Level.prototype.getBodies = function() {
    // TODO: implement
    return this.bodies;
};

//Sort all board characters into the array this.bodies in order of y location (in order to properly render sprite overlap).
SplitTime.Level.prototype.refetchBodies = function() {
    this.agents.length = 0;
    this.bodies.length = 0;
    var index;
    //Figure out which Actors are on board
    for(var id in SplitTime.Actor) {
        var actor = SplitTime.Actor[id];
        if(actor.getLevel() === this) {
            this.agents.push(actor);
            this.insertBody(actor);
        }
    }

    var me = this;
    function putObjOnBoard(obj) {
        me.insertBody(obj);
        var children = obj.getChildren();
        for(var i = 0; i < children.length; i++) {
            putObjOnBoard(children[i]);
        }
    }

    //Pull board objects from file
    for(index = 0; index < this.filedata.getElementsByTagName("prop").length; index++) {
        var prop = this.filedata.getElementsByTagName("prop")[index];
        var template = prop.getAttribute("template");

        var obj;
        if(template) {
            obj = new SplitTime.BodyTemplate[template]();
        }
        else {
            obj = new SplitTime.Body(null, null);
        }

        obj.id = prop.getAttribute("id");
        obj.put(this, +prop.getAttribute("x"), +prop.getAttribute("y"), +prop.getAttribute("layer"));
        obj.dir = +prop.getAttribute("dir");
        obj.stance = prop.getAttribute("stance");

        putObjOnBoard(obj);
    }

    // TODO: better implementation of players
    // for(index = 0; index < SplitTime.player.length; index++) {
    //     if(index == SplitTime.currentPlayer || this.type == "TRPG") {
    //         this.agents.push(SplitTime.player[index]);
    //         this.insertBody(SplitTime.player[index]);
    //     }
    // }
};

//Sort the array this.bodies in order of y location (in order to properly render sprite overlap).
SplitTime.Level.prototype.sortBodies = function() {
    if(this.bodies.length === 0) this.refetchBodies();
    else {
        for(var index = 1; index < this.bodies.length; index++) {
            var second = index;
            while(second > 0 && this.bodies[second].y < this.bodies[second - 1].y) {
                var tempC = this.bodies[second];
                this.bodies[second] = this.bodies[second - 1];
                this.bodies[second - 1] = tempC;
                second--;
            }
        }
    }
};

SplitTime.Level.prototype.insertBody = function(element) {
    var index = 0;
    while(index < this.bodies.length && element.y > this.bodies[index].y) {
        index++;
    }
    this.bodies.splice(index, 0, element);
};

SplitTime.Level.prototype.removeBody = function(element) {
    for(var index = 0; index < this.bodies.length; index++) {
        if(element == this.bodies[index]) {
            this.bodies.splice(index, 1);
            index = this.bodies.length;
        }
    }
};

(function() {
    var levelMap = {};
    var currentLevel = null;

    var holderCanvas;

    SplitTime.Level.createCanvases = function(screenWidth, screenHeight) {
        holderCanvas = document.createElement("canvas");
        holderCanvas.setAttribute("width", SplitTime.SCREENX);
        holderCanvas.setAttribute("height", SplitTime.SCREENY);
    };

    SplitTime.Level.get = function(levelId) {
        if(!levelMap[levelId]) {
            levelMap[levelId] = new SplitTime.Level(levelId);
        }
        return levelMap[levelId];
    };

    SplitTime.Level.setCurrent = function(level) {
        if(typeof level === "string") {
            level = SplitTime.Level.get(level);
        }

        var exitingLevel = currentLevel;
        currentLevel = level;

        //********Leave current board

        //TODO: give agents a chance to clean up

        if(exitingLevel) {
            var exitFunctionId = exitingLevel.filedata.getElementsByTagName("exitFunction")[0].textContent;
            exitingLevel.runFunction(exitFunctionId);

            //Clear out all functional maps
            exitingLevel.layerFuncData.length = 0;
        }

        //********Enter new board

        SplitTime.process = "loading";
        currentLevel.load.then(function() {
            SplitTime.process = currentLevel.type;
            if(SplitTime.process == "action")
            {
                SplitTime.cTeam = SplitTime.player;
            }
            else if(SplitTime.process == "overworld")
            {
                SplitTime.cTeam = SplitTime.player;
                SplitTime.currentPlayer = -1;
                SplitTime.TRPGNextTurn();
            }

            currentLevel.refetchBodies();

            //Initialize functional map
            for(var iLayer = 0; iLayer < currentLevel.filedata.getElementsByTagName("layer").length; iLayer++)
            {
                holderCanvas.width = currentLevel.width/(currentLevel.type == "overworld" ? 32 : 1);
                holderCanvas.height = currentLevel.height/(currentLevel.type == "overworld" ? 32 : 1);
                var holderCtx = holderCanvas.getContext("2d");
                holderCtx.clearRect(0, 0, holderCanvas.width, holderCanvas.height);

                //Draw traces
                var layerTraces = currentLevel.filedata.getElementsByTagName("layer")[iLayer].getElementsByTagName("trace");

                holderCtx.translate(0.5, 0.5);

                for(var iLayerTrace = 0; iLayerTrace < layerTraces.length; iLayerTrace++) {
                    SplitTime.Trace.draw(layerTraces[iLayerTrace].textContent, holderCtx, layerTraces[iLayerTrace].getAttribute("type"));
                }
                var bodies = currentLevel.getBodies();
                for(var iBody = 0; iBody < bodies.length; iBody++)
                {
                    var cBody = bodies[iBody];
                    if(cBody.z == iLayer)
                    {
                        for(var iStaticTrace = 0; iStaticTrace < cBody.staticTrace.length; iStaticTrace++)
                        {
                            SplitTime.Trace.draw(cBody.staticTrace[iStaticTrace].traceStr, holderCtx, cBody.staticTrace[iStaticTrace].type, cBody);
                        }
                    }
                }
                holderCtx.translate(-0.5, -0.5);

                currentLevel.layerFuncData[iLayer] = holderCtx.getImageData(0, 0, currentLevel.width, currentLevel.height);
            }

            var enterFunctionId = currentLevel.filedata.getElementsByTagName("enterFunction")[0].textContent;
            currentLevel.runFunction(enterFunctionId);
        });
    };

    SplitTime.Level.getCurrent = function() {
        return currentLevel;
    };
} ());