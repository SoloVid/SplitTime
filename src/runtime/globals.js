var t;

var SplitTime = { counter: 0 };

//implied SplitTime.SAVE object from load.js
SplitTime.SAVE = {};

//var SplitTime.seeB, SplitTime.see, SplitTime.buffer, SplitTime.bufferCtx, SplitTime.snapShot, SplitTime.snapShotCtx;
SplitTime.image = [];
SplitTime.audio = [];
SplitTime.level = [];

SplitTime.player = [];
SplitTime.Actor = [];
SplitTime.NPC = []; //Universal, absolute list of SplitTime.NPC objects (on all boards)
SplitTime.boardAgent = []; //NPCs and players, for functional interaction
SplitTime.boardBody = []; //NPCs, players, and props, for drawing purposes
SplitTime.Teams = {};

SplitTime.process = "loading"; //Input of master setInterval switch-case

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
SplitTime.showFPS = false;
