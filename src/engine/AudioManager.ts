namespace SplitTime.audio {
    var AUDIO_ROOT = SLVD.getScriptDirectory() + "audio/";
    var MUSIC_DIR = "music/";
    var SOUND_EFFECT_DIR = "fx/";
    var FADE_DURATION_MS = 2000;
    
    var registeredPaths = {};
    var loadedSounds = {};
    var loadedIDs = {};
    var loopSetting = {};
    var musicGroup = {};
    var currentBkgSound;
    
    // TODO: expose this volume
    var globalVolume = 1;
    
    
    export function registerMusic(relativePath, loop = true) {
        registerAudio(MUSIC_DIR + relativePath, relativePath, loop);
    };
    
    export function registerSoundEffect(relativePath, loop = false) {
        registerAudio(SOUND_EFFECT_DIR + relativePath, relativePath, loop);
    };
    
    function registerAudio(relativePath, handle, loopAudio) {
        registeredPaths[handle] = AUDIO_ROOT + relativePath;
        loopSetting[handle] = loopAudio;
    }
    
    /**
    * @desc plays specified audio
    * @param string handle - the name of the audio file to be played (e.g. "dirge.mp3")
    * @param bool loop - specify true/false to override default loop setting for this audio
    * @param bool restartIfPlaying - Defaults to false.  Set to true if the audio should start over
    *                                if it's currently playing (this is for looping sounds, such as music)
    */
    export function play(handle, loop?, restartIfPlaying?) {
        var sound = loadedSounds[handle];
        var soundID = loadedIDs[handle];
        var currentVolume;
        var fadeIn = false;
        
        //If not set, this will be set to the default for this audio file.
        loop = typeof loop !== 'undefined' ?  loop : loopSetting[handle];
        
        if(typeof sound !== 'undefined'){
            if(restartIfPlaying) {
                sound.currentTime = 0;
            }
            if(loop){  //Note: this assumes we only have one looping background track at a time.
                fadeIn = crossFadeSimilar(sound);
            }
            sound.play(soundID);
            if(fadeIn){
                currentVolume = sound.volume();
                sound.fade(currentVolume, 1, FADE_DURATION_MS);
            } else {
                sound.volume(1);
            }
        } else {
            //Set up the audio file to be used with howler.js API 
            //(howler.js documentation: https://github.com/goldfire/howler.js#documentation )
            
            var startVolume = 1;
            
            // TODO: get Howler TypeScript types
            // sound = new Howl({
            //     src: registeredPaths[handle],
            //     autoplay: false,
            //     volume: startVolume,
            //     loop: loop,
            //     onload: function(){
            //         //Music files will be considered to be in the same group if the file names share the first 5 chars
            //         sound.musicGroup = handle.substr(0, 5);
            //         if(loop){  //Note: this assumes we only have one looping background track at a time.
            //             fadeIn = crossFadeSimilar(sound);
            //         }
                    
            //         if(fadeIn){
            //             sound.volume(0);
            //             sound.fade(startVolume, 1, FADE_DURATION_MS);
            //         }
            //     },
            //     onfade: function(){
            //         currentVolume = sound.volume();
            //         if(currentVolume == 0){
            //             if(sound.isPausing) {
            //                 sound.pause();
            //                 sound.isPausing = false;
            //             } else {
            //                 sound.stop();
            //             }
            //         } 
            //     }
            // });
            // soundID = sound.play();
            // loadedSounds[handle] = sound;
            // loadedIDs[handle] = soundID;
        }
    };
    
    //Cross-fade settings for similar background themes: start where we left off
    //Returns true if new sound is similar to the currently playing sound
    function crossFadeSimilar(sound) {
        var similar = false;
        if(typeof currentBkgSound !== 'undefined' && sound.musicGroup == currentBkgSound.musicGroup){
            similar = true;
            var timeOffset = currentBkgSound.seek();
            sound.seek(timeOffset);
        }
        currentBkgSound = sound;
        return similar;
    }
    
    //Pause current SplitTime.audio
    export function pause() {
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
    export function stop() {
        for(var handle in loadedSounds) {
            var sound = loadedSounds[handle];
            if(sound.playing()){
                var currentVolume = sound.volume();
                sound.fade(currentVolume, 0, FADE_DURATION_MS);
            } 
        }
    };
}
