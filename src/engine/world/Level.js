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
    return [];
};

SplitTime.Level.prototype.getBodies = function() {
    // TODO: implement
    return [];
};

//Sort all board characters into the array SplitTime.onBoard.bodies in order of y location (in order to properly render sprite overlap).
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
        obj.setX(+prop.getAttribute("x"));
        obj.setY(+prop.getAttribute("y"));
        obj.setZ(+prop.getAttribute("layer"));
        obj.dir = +prop.getAttribute("dir");
        obj.stance = prop.getAttribute("stance");

        putObjOnBoard(obj);
    }

    // TODO: better implementation of players
    for(index = 0; index < SplitTime.player.length; index++) {
        if(index == SplitTime.currentPlayer || this.type == "TRPG") {
            this.agents.push(SplitTime.player[index]);
            this.insertBody(SplitTime.player[index]);
        }
    }
};

//Sort the array SplitTime.onBoard.bodies in order of y location (in order to properly render sprite overlap).
SplitTime.Level.prototype.sortBodies = function() {
    if(SplitTime.onBoard.bodies.length === 0) SplitTime.onBoard.refetchBodies();
    else {
        for(var index = 1; index < SplitTime.onBoard.bodies.length; index++) {
            var second = index;
            while(second > 0 && SplitTime.onBoard.bodies[second].y < SplitTime.onBoard.bodies[second - 1].y) {
                var tempC = SplitTime.onBoard.bodies[second];
                SplitTime.onBoard.bodies[second] = SplitTime.onBoard.bodies[second - 1];
                SplitTime.onBoard.bodies[second - 1] = tempC;
                second--;
            }
        }
    }
};

SplitTime.Level.prototype.insertBody = function(element) {
    var index = 0;
    while(index < SplitTime.onBoard.bodies.length && element.y > SplitTime.onBoard.bodies[index].y) {
        index++;
    }
    SplitTime.onBoard.bodies.splice(index, 0, element);
};

SplitTime.Level.prototype.removeBody = function(element) {
    for(var index = 0; index < SplitTime.onBoard.bodies.length; index++) {
        if(element == SplitTime.onBoard.bodies[index]) {
            SplitTime.onBoard.bodies.splice(index, 1);
            index = SplitTime.onBoard.bodies.length;
        }
    }
};

(function() {
    var levelMap = {};
    var currentLevel = null;

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
                var holder = SplitTime.holderCanvas;
                holder.width = currentLevel.width/(SplitTime.currentLevel.type == "overworld" ? 32 : 1);
                holder.height = currentLevel.height/(SplitTime.currentLevel.type == "overworld" ? 32 : 1);
                var holderCtx = holder.getContext("2d");
                holderCtx.clearRect(0, 0, holder.width, holder.height);

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