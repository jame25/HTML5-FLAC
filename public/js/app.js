document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const playBtn = document.getElementById('play-btn');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const volumeBtn = document.getElementById('volume-btn');
    const volumeSlider = document.getElementById('volume-slider');
    const volumeSliderContainer = document.querySelector('.volume-slider-container');
    const trackTitleEl = document.getElementById('track-title');
    const trackArtistEl = document.getElementById('track-artist');
    const coverArtEl = document.getElementById('cover-art');
    const nextCoverArtEl = document.getElementById('next-cover-art');
    const artworkContainer = document.querySelector('.artwork-container');
    const currentArt = document.querySelector('.current-art');
    const nextArt = document.querySelector('.next-art');

    // Default cover image
    const DEFAULT_COVER = 'img/default-cover.svg';

    // Initialize with empty playlist
    let playlist = [];
    
    // Player instance
    let player;
    
    // Track if animation is in progress
    let animationInProgress = false;
    
    // Keep track of current album art for comparison
    let currentAlbumArt = DEFAULT_COVER;

    // Helper function to format time (mm:ss)
    function formatTime(seconds) {
        seconds = Math.floor(seconds || 0);
        const minutes = Math.floor(seconds / 60);
        seconds = seconds % 60;
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    }

    // Scan for FLAC files and initialize player
    scanForFlacFiles()
        .then(files => {
            playlist = files;
            initializePlayer();
        })
        .catch(error => {
            console.error('Error scanning for FLAC files:', error);
            // Initialize with empty playlist if scan fails
            initializePlayer();
        });

    // Function to scan for FLAC files
    async function scanForFlacFiles() {
        try {
            const response = await fetch('/api/scan');
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const files = await response.json();
            
            // Add local fallback images instead of placeholder.com
            return files.map(file => ({
                ...file,
                cover: file.cover || DEFAULT_COVER
            }));
        } catch (error) {
            console.error('Error scanning for FLAC files:', error);
            return [];
        }
    }

    // Initialize the player
    function initializePlayer() {
        // If no files found, use sample playlist
        if (playlist.length === 0) {
            console.log('No FLAC files found, using sample playlist');
            playlist = [
                {
                    title: 'Sample Track 1',
                    artist: 'Artist 1',
                    url: 'music/sample1.flac',
                    cover: DEFAULT_COVER
                },
                {
                    title: 'Sample Track 2',
                    artist: 'Artist 2',
                    url: 'music/sample2.flac',
                    cover: DEFAULT_COVER
                },
                {
                    title: 'Sample Track 3',
                    artist: 'Artist 3',
                    url: 'music/sample3.flac',
                    cover: DEFAULT_COVER
                }
            ];
        } else {
            console.log(`Found ${playlist.length} FLAC files`);
        }

        // If player already exists, destroy it
        if (player) {
            player.destroy();
        }

        player = new FlacPlayer({
            container: '#flac-player',
            playlist: playlist,
            autoplay: false,
            volume: 0.7,
            callbacks: {
                onInit: () => {
                    console.log('Player initialized');
                },
                onTrackChange: (track) => {
                    // Update track info
                    trackTitleEl.textContent = track.title;
                    trackArtistEl.textContent = track.artist;
                    
                    const newAlbumArt = track.cover || DEFAULT_COVER;
                    
                    // Only animate if the album art is actually different
                    if (newAlbumArt !== currentAlbumArt) {
                        if (!animationInProgress) {
                            animateArtworkChange(track);
                        }
                    } else {
                        // Just update the image without animation
                        coverArtEl.src = newAlbumArt;
                        nextCoverArtEl.src = newAlbumArt;
                    }
                    
                    // Update current album art
                    currentAlbumArt = newAlbumArt;
                },
                onTrackLoaded: (track) => {
                    if (!animationInProgress) {
                        // Initialize the current album art on first load
                        if (currentAlbumArt === DEFAULT_COVER) {
                            currentAlbumArt = track.cover || DEFAULT_COVER;
                        }
                        
                        coverArtEl.src = track.cover || DEFAULT_COVER;
                        nextCoverArtEl.src = track.cover || DEFAULT_COVER;
                    }
                },
                onPlay: () => {
                    playBtn.textContent = '⏸';
                },
                onPause: () => {
                    playBtn.textContent = '▶';
                },
                onTimeUpdate: (currentTime, duration) => {
                    // We no longer update the progress bar
                },
                onVolumeChange: (volume) => {
                    volumeSlider.value = volume;
                    updateVolumeIcon(volume);
                },
                onMute: () => {
                    volumeBtn.textContent = '🔇';
                },
                onUnmute: () => {
                    updateVolumeIcon(player.audioElement.volume);
                },
                onError: (error) => {
                    console.error('Player error:', error);
                    alert('Error playing track. Please try another one.');
                }
            }
        });

        // Event Listeners
        playBtn.addEventListener('click', () => {
            player.togglePlay();
        });

        prevBtn.addEventListener('click', () => {
            if (!animationInProgress) {
                player.prev();
            }
        });

        nextBtn.addEventListener('click', () => {
            if (!animationInProgress) {
                player.next();
            }
        });

        // Volume control
        volumeBtn.addEventListener('click', () => {
            volumeSliderContainer.classList.toggle('active');
        });

        volumeSlider.addEventListener('input', () => {
            const volume = parseFloat(volumeSlider.value);
            player.setVolume(volume);
        });

        // Hide volume slider when clicking outside
        document.addEventListener('click', (e) => {
            if (!volumeBtn.contains(e.target) && !volumeSlider.contains(e.target)) {
                volumeSliderContainer.classList.remove('active');
            }
        });
    }

    // Animate the artwork change
    function animateArtworkChange(track) {
        if (!track || animationInProgress) return;
        
        animationInProgress = true;
        
        // Set the next image
        nextCoverArtEl.src = track.cover || DEFAULT_COVER;
        
        // Position the next image to come from the right
        nextArt.style.transform = 'translateX(100%)';
        
        // Force a reflow to ensure styles are applied
        void artworkContainer.offsetWidth;
        
        // Add the slide transition class
        artworkContainer.classList.add('slide-transition');
        
        // Listen for transition end
        const transitionEndHandler = () => {
            // Update the current image after transition
            coverArtEl.src = track.cover || DEFAULT_COVER;
            
            // Reset positions
            artworkContainer.classList.remove('slide-transition');
            currentArt.style.transform = '';
            nextArt.style.transform = 'translateX(100%)';
            
            // Reset animation flag
            animationInProgress = false;
            
            // Remove event listener
            artworkContainer.removeEventListener('transitionend', transitionEndHandler);
        };
        
        artworkContainer.addEventListener('transitionend', transitionEndHandler);
    }

    function updateVolumeIcon(volume) {
        if (volume === 0) {
            volumeBtn.textContent = '🔇';
        } else if (volume < 0.5) {
            volumeBtn.textContent = '🔉';
        } else {
            volumeBtn.textContent = '🔊';
        }
    }
}); 
