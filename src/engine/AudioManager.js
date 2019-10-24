dependsOn("/SLVD/SLVD.js");

SplitTime.Audio = {};

var AUDIO_ROOT = SLVD.getScriptDirectory() + "audio/";
var MUSIC_DIR = "music/";
var SOUND_EFFECT_DIR = "soundeffects/";
var FADE_DURATION_MS = 2000;

var registeredPaths = {};
var loadedSounds = {};
var loadedIDs = {};
var loopSetting = {};
var fadeSetting = {};

// TODO: expose this volume
var globalVolume = 1;


SplitTime.Audio.registerMusic = function(relativePath, loop) {
    //loop parameter defaults to true
    loop = typeof loop !== 'undefined' ?  loop : true;
    registerAudio(MUSIC_DIR + relativePath, relativePath, loop, true);
};

SplitTime.Audio.registerSoundEffect = function(relativePath, loop) {
    //loop parameter defaults to true
    loop = typeof loop !== 'undefined' ?  loop : false;
    registerAudio(SOUND_EFFECT_DIR + relativePath, relativePath, loop, false);
};

function registerAudio(relativePath, handle, loopAudio, fadeAudio) {
    registeredPaths[handle] = AUDIO_ROOT + relativePath;
    loopSetting[handle] = loopAudio;
    fadeSetting[handle] = fadeAudio;
}

/**
  * @desc plays specified audio
  * @param string handle - the name of the audio file to be played (e.g. "dirge.mp3")
  * @param bool loop - specify true/false to override default loop setting for this audio
  * @param bool fade - specify true/false to override default fade setting for this audio
  * @param bool restartIfPlaying - Defaults to false.  Set to true if the audio should start over
  *                                if it's currently playing (this is for looping sounds, such as music)
  */
SplitTime.Audio.play = function(handle, loop, fade, restartIfPlaying) {
    var sound = loadedSounds[handle];
    var soundID = loadedIDs[handle];
    var currentVolume;
    
    //If not set, these settings will be set to the default for this audio file.
    loop = typeof loop !== 'undefined' ?  loop : loopSetting[handle];
    fade = typeof fade !== 'undefined' ?  fade : fadeSetting[handle];
    
    //TODO: implement fade option
    
    if(typeof sound !== 'undefined'){
        if(restartIfPlaying) {
            sound.currentTime = 0;
        }        
        sound.play(soundID);
        currentVolume = sound.volume();
        sound.fade(currentVolume, 1, FADE_DURATION_MS);
    } else {
        //Set up the audio file to be used with howler.js API 
        //(howler.js documentation: https://github.com/goldfire/howler.js#documentation)

        sound = new Howl({
            src: registeredPaths[handle],
            autoplay: false,
            volume: 0,
            loop: loop,
            onload: function(){
                sound.fade(0, 1, FADE_DURATION_MS);
            },
            onfade: function(){
                currentVolume = sound.volume();
                if(currentVolume == 0){
                    if(sound.isPausing) {
                        sound.pause();
                        sound.isPausing = false;
                    } else {
                        sound.stop();
                    }
                } 
            }
        });
        
        soundID = sound.play();
        loadedSounds[handle] = sound;
        loadedIDs[handle] = soundID;
    }
};

//Pause current SplitTime.audio
SplitTime.Audio.pause = function() {
    for(var handle in loadedSounds) {
        var sound = loadedSounds[handle];
        if(sound.playing()){
            var currentVolume = sound.volume();
            sound.fade(currentVolume, 0, FADE_DURATION_MS);
            //this will make it so that the audio will pause (rather than stopping)
            //after the onfade event is triggered (after the fading is finished)
            sound.isPausing = true;
        }
    }
};

//Stop current SplitTime.audio
SplitTime.Audio.stop = function() {
    for(var handle in loadedSounds) {
        var sound = loadedSounds[handle];
        if(sound.playing()){
            var currentVolume = sound.volume();
            sound.fade(currentVolume, 0, FADE_DURATION_MS);
        } 
    }
};


