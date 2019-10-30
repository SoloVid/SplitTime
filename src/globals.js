//TODO: don't attach to window
// Global namespace for all things game-engine
window.SplitTime = {};
// Global namespace for all random globals in game code
// ("G" is for "Global" or "Game")
window.G = {};

//implied SplitTime.SAVE object from load.js
SplitTime.SAVE = {};

//var SplitTime.seeB, SplitTime.see;

SplitTime.location = {};
SplitTime.location.images = "images/";
SplitTime.location.audio = "audio/";
SplitTime.location.levels = "levels/";

SplitTime.player = [];
SplitTime.Actor = [];
SplitTime.Teams = {};

SplitTime.process = "hold"; //Input of master setInterval switch-case

SplitTime.SCREENX = 640;
SplitTime.SCREENY = 360;

SplitTime.FPS = 60;
SplitTime.msPerFrame = (1/SplitTime.FPS)*1000;

window.dependsOn = function(filename) {
    // This function should never be called. Ordered concat uses a pretend function of this name.
    console.error("dependsOn() (" + filename + ") should have been removed by ordered concat");
};
