// Currently, this class isn't intended to be used but to provide JSDoc for level file format JSON
SplitTime.LevelFileData = function() {
    this.type = "action";
    this.region = "";
    this.background = "";
    /** @type {LevelFileDataLayer[]} */
    this.layers = [];
    this.props = [];
    this.positions = [];
};

function LevelFileDataLayer() {
    this.id = "";
    /**
     * @type {int}
     */
    this.z = 0;
    /** @type {LevelFileDataTrace[]} */
    this.traces = [];
}

function LevelFileDataTrace() {
    this.id = "";
    this.type = "";
    this.vertices = "";
    this.parameter = "";
}