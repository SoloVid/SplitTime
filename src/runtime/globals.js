var t;

var SLVDE = { counter: 0 };

//implied SLVDE.SAVE object from load.js
SLVDE.SAVE = {};

//var SLVDE.seeB, SLVDE.see, SLVDE.buffer, SLVDE.bufferCtx, SLVDE.snapShot, SLVDE.snapShotCtx;
SLVDE.image = [];
SLVDE.audio = [];
SLVDE.level = [];

SLVDE.player = [];
SLVDE.NPC = []; //Universal, absolute list of SLVDE.NPC objects (on all boards)
SLVDE.boardAgent = []; //NPCs and players, for functional interaction
SLVDE.boardBody = []; //NPCs, players, and props, for drawing purposes
SLVDE.Teams = {};

SLVDE.process = "loading"; //Input of master setInterval switch-case

SLVDE.currentAudio = undefined;
SLVDE.volume = 1;

SLVDE.frameClock = 0; //= 1 every 8 ticks
SLVDE.SAVE.timeSeconds = 0; //Second hand displayed on clock out of 2560
SLVDE.SAVE.timeMinutes = 0;
SLVDE.SAVE.timeHours = 0;
SLVDE.SAVE.timeDays = 0;

SLVDE.keyDown = {}; //1 if down, null if up

SLVDE.currentPlayer = 0;
SLVDE.cTeam = undefined; //For TRPG, either SLVDE.player or boardNPC

SLVDE.loading = 0;
SLVDE.loadCheck = [];

SLVDE.weather = { rain: false, clouds: false, dark: 0};

//Somehow related to relative positioning of board to player
SLVDE.wX = 0;
SLVDE.wY = 0;

SLVDE.SCREENX = 640;
SLVDE.SCREENY = 480;

SLVDE.FPS = 50;
SLVDE.showFPS = false;
