window.SplitTime = {};

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
SplitTime.SCREENY = 480;

SplitTime.FPS = 60;
SplitTime.msPerFrame = (1/SplitTime.FPS)*1000;

window.dependsOn = function(filename) {
    // This function should never be called. Ordered concat uses a pretend function of this name.
    console.error("dependsOn() (" + filename + ") should have been removed by ordered concat");
};
