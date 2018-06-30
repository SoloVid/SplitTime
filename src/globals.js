var t, T; //Used in various places; declared here to avoid multiple declarations

var SplitTime = { counter: 0 };

//implied SplitTime.SAVE object from load.js
SplitTime.SAVE = {};

//var SplitTime.seeB, SplitTime.see, SplitTime.buffer, SplitTime.bufferCtx, SplitTime.snapShot, SplitTime.snapShotCtx;
SplitTime.image = [];
SplitTime.audio = [];
SplitTime.level = [];

SplitTime.location = {};
SplitTime.location.images = "images/";
SplitTime.location.audio = "audio/";
SplitTime.location.levels = "levels/";

SplitTime.player = [];
SplitTime.Actor = [];
SplitTime.NPC = []; //Universal, absolute list of SplitTime.NPC objects (on all boards)
SplitTime.Teams = {};

SplitTime.process = "hold"; //Input of master setInterval switch-case

SplitTime.currentAudio = undefined;
SplitTime.volume = 1;

SplitTime.frameClock = 0; //= 1 every 8 ticks
SplitTime.SAVE.timeSeconds = 0; //Second hand displayed on clock out of 2560
SplitTime.SAVE.timeMinutes = 0;
SplitTime.SAVE.timeHours = 0;
SplitTime.SAVE.timeDays = 0;

SplitTime.keyDown = {}; //1 if down, null if up

SplitTime.currentPlayer = 0;
SplitTime.cTeam = undefined; //For TRPG, either SplitTime.player or boardNPC

SplitTime.loading = 0;
SplitTime.loadCheck = [];

SplitTime.weather = { rain: false, clouds: false, dark: 0};

//Somehow related to relative positioning of board to player
SplitTime.wX = 0;
SplitTime.wY = 0;

SplitTime.SCREENX = 640;
SplitTime.SCREENY = 480;

SplitTime.FPS = 50;
SplitTime.msPerFrame = (1/SplitTime.FPS)*1000;
SplitTime.showFPS = false;

function dependsOn(filename) {
    // This function should never be called. Ordered concat uses a pretend function of this name.
    console.error("dependsOn() (" + filename + ") should have been removed by ordered concat");
}
