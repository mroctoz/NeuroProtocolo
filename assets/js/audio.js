class AudioManager {
    constructor() {
        this.audio = new Audio();
        this.isPlaying = false;
        this.currentTrackIndex = 0;
        this.hasUserInteracted = false;
        
        // Playlist Neuro-Acústica
        this.playlist = [
            { title: "Foco Profundo (40Hz)", src: "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3" },
            { title: "Neuro-Relaxamento", src: "https://cdn.pixabay.com/download/audio/2021/08/09/audio_88447e769f.mp3" },
            { title: "Binaural Theta", src: "https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3" }
        ];

        this.init();
    }

    init() {
        this.injectPlayer();
        this.audio.volume = 0.5;
        this.audio.loop = true;
    }

    injectPlayer() {
        const musicHTML = `
            <div class="music-widget" id="musicWidget">
                <div class="equalizer paused" id="musicEq">
                    <div class="bar"></div>
                    <div class="bar"></div>
                    <div class="bar"></div>
                </div>
                <div class="music-track-info" id="trackName">Foco Neural</div>
                <div class="music-controls">
                    <button class="music-btn" onclick="audioManager.prevTrack()"><i class="fas fa-step-backward"></i></button>
                    <button class="music-btn" onclick="audioManager.toggleAudio()"><i class="fas fa-play" id="playIcon"></i></button>
                    <button class="music-btn" onclick="audioManager.nextTrack()"><i class="fas fa-step-forward"></i></button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', musicHTML);
    }

    async toggleAudio() {
        const icon = document.getElementById('playIcon');
        const eq = document.getElementById('musicEq');

        if (this.isPlaying) {
            this.audio.pause();
            icon.classList.remove('fa-pause');
            icon.classList.add('fa-play');
            eq.classList.add('paused');
            this.isPlaying = false;
        } else {
            // Tenta tocar. Se falhar (bloqueio do browser), pede interação.
            try {
                if (!this.audio.src) this.loadTrack(this.currentTrackIndex, false);
                await this.audio.play();
                icon.classList.remove('fa-play');
                icon.classList.add('fa-pause');
                eq.classList.remove('paused');
                this.isPlaying = true;
            } catch (error) {
                console.log("Aguardando interação do usuário para iniciar áudio.");
            }
        }
    }

    loadTrack(index, autoPlay = true) {
        this.currentTrackIndex = index;
        this.audio.src = this.playlist[index].src;
        document.getElementById('trackName').innerText = this.playlist[index].title;
        
        if(autoPlay && this.isPlaying) this.audio.play();
    }

    nextTrack() {
        let next = this.currentTrackIndex + 1;
        if (next >= this.playlist.length) next = 0;
        this.loadTrack(next);
    }

    prevTrack() {
        let prev = this.currentTrackIndex - 1;
        if (prev < 0) prev = this.playlist.length - 1;
        this.loadTrack(prev);
    }
}

const audioManager = new AudioManager();
