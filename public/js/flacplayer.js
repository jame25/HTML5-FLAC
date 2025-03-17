/**
 * HTML5 FLAC Player
 * A lightweight HTML5 music player with FLAC support
 */
class FlacPlayer {
    constructor(options = {}) {
        this.audioContext = null;
        this.audioElement = new Audio();
        this.audioElement.preload = 'auto';
        
        // Set default options
        this.options = {
            container: options.container || '#flac-player',
            playlist: options.playlist || [],
            autoplay: options.autoplay || false,
            volume: options.volume !== undefined ? options.volume : 0.7,
            callbacks: options.callbacks || {}
        };
        
        // Player state
        this.state = {
            currentTrack: 0,
            isPlaying: false,
            isMuted: false,
            duration: 0,
            currentTime: 0
        };
        
        // Initialize the player
        this.init();
    }
    
    init() {
        // Don't initialize AudioContext until user interaction
        // We'll create it in the play method
        
        // Set initial volume
        this.audioElement.volume = this.options.volume;
        
        // Add event listeners
        this.addEventListeners();
        
        // Load the first track if playlist is not empty
        if (this.options.playlist.length > 0) {
            this.loadTrack(0);
            if (this.options.autoplay) {
                this.play();
            }
        }
        
        // Call onInit callback if provided
        if (typeof this.options.callbacks.onInit === 'function') {
            this.options.callbacks.onInit(this);
        }
    }
    
    addEventListeners() {
        // Audio element events
        this.audioElement.addEventListener('timeupdate', () => this.updateProgress());
        this.audioElement.addEventListener('ended', () => this.next());
        this.audioElement.addEventListener('loadedmetadata', () => {
            this.state.duration = this.audioElement.duration;
            if (typeof this.options.callbacks.onTrackLoaded === 'function') {
                this.options.callbacks.onTrackLoaded(this.getCurrentTrack(), this);
            }
        });
        this.audioElement.addEventListener('play', () => {
            this.state.isPlaying = true;
            if (typeof this.options.callbacks.onPlay === 'function') {
                this.options.callbacks.onPlay(this.getCurrentTrack(), this);
            }
        });
        this.audioElement.addEventListener('pause', () => {
            this.state.isPlaying = false;
            if (typeof this.options.callbacks.onPause === 'function') {
                this.options.callbacks.onPause(this.getCurrentTrack(), this);
            }
        });
        this.audioElement.addEventListener('volumechange', () => {
            if (typeof this.options.callbacks.onVolumeChange === 'function') {
                this.options.callbacks.onVolumeChange(this.audioElement.volume, this);
            }
        });
        this.audioElement.addEventListener('error', (e) => {
            console.error('Audio error:', e);
            if (typeof this.options.callbacks.onError === 'function') {
                this.options.callbacks.onError(e, this);
            }
        });
    }
    
    loadTrack(index) {
        if (index >= 0 && index < this.options.playlist.length) {
            this.state.currentTrack = index;
            const track = this.options.playlist[index];
            
            // Set the audio source
            this.audioElement.src = track.url;
            this.audioElement.load();
            
            // Call onTrackChange callback if provided
            if (typeof this.options.callbacks.onTrackChange === 'function') {
                this.options.callbacks.onTrackChange(track, this);
            }
            
            return track;
        }
        return null;
    }
    
    play() {
        // Initialize AudioContext on first user interaction
        if (!this.audioContext) {
            try {
                window.AudioContext = window.AudioContext || window.webkitAudioContext;
                this.audioContext = new AudioContext();
            } catch (e) {
                console.error('Web Audio API is not supported in this browser', e);
            }
        }
        
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        const playPromise = this.audioElement.play();
        
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.error('Playback failed:', error);
                // Autoplay was prevented, show play button
                this.state.isPlaying = false;
                if (typeof this.options.callbacks.onPlaybackFailed === 'function') {
                    this.options.callbacks.onPlaybackFailed(error, this);
                }
            });
        }
    }
    
    pause() {
        this.audioElement.pause();
    }
    
    togglePlay() {
        if (this.state.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }
    
    next() {
        const nextIndex = (this.state.currentTrack + 1) % this.options.playlist.length;
        this.loadTrack(nextIndex);
        this.play();
    }
    
    prev() {
        let prevIndex = this.state.currentTrack - 1;
        if (prevIndex < 0) {
            prevIndex = this.options.playlist.length - 1;
        }
        this.loadTrack(prevIndex);
        this.play();
    }
    
    setVolume(volume) {
        if (volume >= 0 && volume <= 1) {
            this.audioElement.volume = volume;
        }
    }
    
    mute() {
        this.state.isMuted = true;
        this.audioElement.muted = true;
        if (typeof this.options.callbacks.onMute === 'function') {
            this.options.callbacks.onMute(this);
        }
    }
    
    unmute() {
        this.state.isMuted = false;
        this.audioElement.muted = false;
        if (typeof this.options.callbacks.onUnmute === 'function') {
            this.options.callbacks.onUnmute(this);
        }
    }
    
    toggleMute() {
        if (this.state.isMuted) {
            this.unmute();
        } else {
            this.mute();
        }
    }
    
    seek(time) {
        if (time >= 0 && time <= this.audioElement.duration) {
            this.audioElement.currentTime = time;
        }
    }
    
    seekByPercentage(percentage) {
        if (percentage >= 0 && percentage <= 1) {
            const seekTime = this.audioElement.duration * percentage;
            this.seek(seekTime);
        }
    }
    
    updateProgress() {
        this.state.currentTime = this.audioElement.currentTime;
        
        if (typeof this.options.callbacks.onTimeUpdate === 'function') {
            this.options.callbacks.onTimeUpdate(
                this.audioElement.currentTime,
                this.audioElement.duration,
                this
            );
        }
    }
    
    getCurrentTrack() {
        return this.options.playlist[this.state.currentTrack];
    }
    
    getPlaylist() {
        return this.options.playlist;
    }
    
    setPlaylist(playlist) {
        this.options.playlist = playlist;
        this.state.currentTrack = 0;
        
        if (playlist.length > 0) {
            this.loadTrack(0);
        }
        
        if (typeof this.options.callbacks.onPlaylistChange === 'function') {
            this.options.callbacks.onPlaylistChange(playlist, this);
        }
    }
    
    addTrack(track) {
        this.options.playlist.push(track);
        
        if (typeof this.options.callbacks.onPlaylistChange === 'function') {
            this.options.callbacks.onPlaylistChange(this.options.playlist, this);
        }
        
        return this.options.playlist.length - 1;
    }
    
    removeTrack(index) {
        if (index >= 0 && index < this.options.playlist.length) {
            // If removing current track, load next track
            if (index === this.state.currentTrack) {
                const wasPlaying = this.state.isPlaying;
                
                if (this.options.playlist.length > 1) {
                    const nextIndex = index === this.options.playlist.length - 1 ? 0 : index;
                    this.loadTrack(nextIndex);
                    if (wasPlaying) {
                        this.play();
                    }
                } else {
                    this.audioElement.src = '';
                    this.state.isPlaying = false;
                }
            } else if (index < this.state.currentTrack) {
                // If removing track before current, adjust current track index
                this.state.currentTrack--;
            }
            
            // Remove the track
            this.options.playlist.splice(index, 1);
            
            if (typeof this.options.callbacks.onPlaylistChange === 'function') {
                this.options.callbacks.onPlaylistChange(this.options.playlist, this);
            }
            
            return true;
        }
        return false;
    }
    
    formatTime(seconds) {
        seconds = Math.floor(seconds || 0);
        const minutes = Math.floor(seconds / 60);
        seconds = seconds % 60;
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    }
    
    destroy() {
        this.pause();
        this.audioElement.src = '';
        this.audioElement.load();
        
        // Remove event listeners
        this.audioElement.removeEventListener('timeupdate', this.updateProgress);
        this.audioElement.removeEventListener('ended', this.next);
        
        if (typeof this.options.callbacks.onDestroy === 'function') {
            this.options.callbacks.onDestroy(this);
        }
    }
} 
