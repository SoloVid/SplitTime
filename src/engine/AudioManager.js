dependsOn("/SLVD/SLVD.js");

SplitTime.Audio = {};

var AUDIO_ROOT = SLVD.getScriptDirectory() + "audio/";
var MUSIC_DIR = "music/";
var SOUND_EFFECT_DIR = "fx/";
var registeredSounds = {};
var activeSounds = {};

// TODO: expose this volume
var globalVolume = 1;


SplitTime.Audio.registerMusic = function(relativePath, loop) {
    //loop parameter defaults to true
    loop = typeof loop !== 'undefined' ?  loop : true;
    registerAudio(MUSIC_DIR + relativePath, relativePath, loop);
};

SplitTime.Audio.registerSoundEffect = function(relativePath, loop) {
    //loop parameter defaults to true
    loop = typeof loop !== 'undefined' ?  loop : false;
    registerAudio(SOUND_EFFECT_DIR + relativePath, relativePath, loop);
};

function registerAudio(relativePath, handle, loopAudio) {
    //Set up the audio file to be used with howler.js API
    var sound = new Howl({
        src: [AUDIO_ROOT + relativePath],
        loop: loopAudio,
        autoplay: false,
        volume: globalVolume
    });   
    registeredSounds[handle] = sound;
}

/**
  * @desc plays specified audio
  * @param string handle - the name of the audio file to be played (e.g. "dirge.mp3")
  * @param bool loopOverride - Specify true or false to override the default setting for this audio.
  *                    Defaults to the loop value that was set when registered.
  * @param bool restartIfPlaying - Defaults to false.  Set to true if the audio should start over
  *                                if it's currently playing (this is for looping sounds, such as music)
  */
SplitTime.Audio.play = function(handle, loopOverride, restartIfPlaying) {
    var sound = registeredSounds[handle];
    //Set volume to current SplitTime.volume
    sound.volume = globalVolume;
    
    //If loop parameter is set, override this sound's loop setting
    if (typeof loopOverride !== 'undefined'){
        sound.loop(loopOverride);
    }
    
    if(restartIfPlaying) {
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


