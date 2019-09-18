dependsOn("/SLVD/SLVD.js");

SplitTime.Audio = {};

var AUDIO_ROOT = SLVD.getScriptDirectory() + "audio/";
var MUSIC_DIR = "music/";
var SOUND_EFFECT_DIR = "soundeffects/";
var map = {};

var currentAudio;
// TODO: expose this volume
var volume = 1;

SplitTime.Audio.registerMusic = function(relativePath) {
    var audio = registerAudio(MUSIC_DIR + relativePath, relativePath);
    audio.loop = true;
};

SplitTime.Audio.registerSoundEffect = function(relativePath) {
	var audio = registerAudio(SOUND_EFFECT_DIR + relativePath, relativePath);
	audio.loop = false;
};

function registerAudio(relativePath, handle) {
    var audio = document.createElement("audio");
    audio.setAttribute("src", AUDIO_ROOT + relativePath);
    audio.setAttribute("id", "audio:" + relativePath.replace("/", ":"));
    map[handle] = audio;
    return audio;
    //document.write('<SplitTime.audio preload src="' + source + '" id="' + iden + '"></SplitTime.audio>');
    //return document.getElementById(iden);
}

//Pause current SplitTime.audio
SplitTime.Audio.pause = function() {
	currentAudio.pause();
};

SplitTime.Audio.play = function(handle, boolContinue) {
	var audio = map[handle];
	//Set SplitTime.volume to current SplitTime.volume
    audio.volume = volume;
	if(!boolContinue) {
        audio.currentTime = 0;
	}
    //audio.play();
    
    var sound = new Howl({ src: [audio.src] });
    sound.play();
    
	currentAudio = audio;
};

//Resume current SplitTime.audio
SplitTime.Audio.resume = function() {
	currentAudio.play();
};
