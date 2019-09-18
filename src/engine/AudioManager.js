dependsOn("/SLVD/SLVD.js");

SplitTime.Audio = {};

var AUDIO_ROOT = SLVD.getScriptDirectory() + "audio/";
var MUSIC_DIR = "music/";
var SOUND_EFFECT_DIR = "soundeffects/";
var registeredSounds = {};
var activeSounds = {};

// TODO: expose this volume
var globalVolume = 1;


SplitTime.Audio.registerMusic = function(relativePath) {
    registerAudio(MUSIC_DIR + relativePath, relativePath, true);
};

SplitTime.Audio.registerSoundEffect = function(relativePath) {
    registerAudio(SOUND_EFFECT_DIR + relativePath, relativePath, false);
};

function registerAudio(relativePath, handle, loopAudio) {
    //Set up audio using howler.js API
    var sound = new Howl({
        src: [AUDIO_ROOT + relativePath],
        loop: loopAudio,
        autoplay: false,
        volume: globalVolume
    });   
    registeredSounds[handle] = sound;
}

SplitTime.Audio.play = function(handle, boolContinue) {
    var sound = registeredSounds[handle];
    //Set volume to current SplitTime.volume
    sound.volume = globalVolume;
    if(!boolContinue) {
        sound.currentTime = 0;
    }
    var soundID = sound.play();
    activeSounds[soundID] = sound;
};

//Pause current SplitTime.audio
SplitTime.Audio.pause = function() {
    for(var soundID in activeSounds) {
        var sound = activeSounds[soundID];
        if(sound.playing()){
            sound.pause();
        } else {
            //TODO: Remove any inactive sounds that have finished and aren't looping
        }
    }
};

//Resume current SplitTime.audio
SplitTime.Audio.resume = function() {
    //TODO: this needs to be tested before it gets called from somewhere.
    for(var soundID in activeSounds) {
        var sound = activeSounds[soundID];
        sound.play(soundID);
    }
};

//Stop current SplitTime.audio
SplitTime.Audio.stop = function() {
    for(var soundID in activeSounds) {
        var sound = activeSounds[soundID];
        sound.stop();
    }
    //Remove all sounds from activeSounds
    activeSounds = [];
};


