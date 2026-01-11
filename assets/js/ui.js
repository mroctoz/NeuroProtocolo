class UIManager {
    constructor() {
        this.audio = new Audio();
        this.isPlaying = false;
        this.currentTrackIndex = 0;
        
        // Playlist de Foco e Relaxamento (Links de exemplo livres de direitos autorais ou placeholders)
        // Nota: Para produção, substitua por arquivos locais em assets/audio/
        this.playlist = [
            { title: "Ondas Alpha (Foco)", src: "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3" },
            { title: "Chuva Suave (Calma)", src: "https://cdn.pixabay.com/download/audio/2021/08/09/audio_88447e769f.mp3" },
            { title: "Binaural 40Hz (Deep)", src: "https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3" }
        ];

        this.init();
    }

    init() {
        // Injetar HTML do Modal e Player no corpo da página
        this.injectComponents();
        
        // Restaurar estado do áudio (se o usuário estava ouvindo antes de mudar de página)
        const savedState = JSON.parse(localStorage.getItem('neuro_audio_state'));
        if (savedState && savedState.isPlaying) {
            // Nota: Browsers bloqueiam autoplay sem interação. 
            // O usuário precisará clicar uma vez para retomar.
            this.currentTrackIndex = savedState.track;
            // this.toggleAudio(); // Comentado para evitar erro de autoplay
        }
    }

    injectComponents() {
        const body = document.body;

        // 1. Modal de Leitura
        const modalHTML = `
            <div id="immersiveReader" class="modal-overlay">
                <div class="modal-content slide-up">
                    <div class="modal-header">
                        <span class="modal-title" id="readerContext">Módulo 1 • Leitura</span>
                        <button class="close-modal-btn" onclick="ui.closeReader()"><i class="fas fa-times"></i></button>
                    </div>
                    <div class="modal-body" id="readerContent">
                        <!-- Conteúdo injetado aqui -->
                    </div>
                </div>
            </div>
        `;

        // 2. Widget de Música
        const musicHTML = `
            <div class="music-widget">
                <div class="equalizer paused" id="musicEq">
                    <div class="bar"></div>
                    <div class="bar"></div>
                    <div class="bar"></div>
                </div>
                <div class="music-track-info" id="trackName">Foco Neural</div>
                <div class="music-controls">
                    <button class="music-btn" onclick="ui.prevTrack()"><i class="fas fa-step-backward"></i></button>
                    <button class="music-btn" onclick="ui.toggleAudio()"><i class="fas fa-play" id="playIcon"></i></button>
                    <button class="music-btn" onclick="ui.nextTrack()"><i class="fas fa-step-forward"></i></button>
                </div>
            </div>
        `;

        body.insertAdjacentHTML('beforeend', modalHTML);
        body.insertAdjacentHTML('beforeend', musicHTML);
    }

    // --- Lógica do Leitor ---
    
    openReader(title, content, context = "Leitura Profunda") {
        const modal = document.getElementById('immersiveReader');
        const body = document.getElementById('readerContent');
        
        document.getElementById('readerContext').innerText = context;
        
        // Constrói o conteúdo com título grande
        body.innerHTML = `
            <h1 style="font-family: 'Inter', sans-serif; font-size: 2.5rem; color: white; margin-bottom: 2rem; line-height: 1.2;">
                ${title}
            </h1>
            ${content}
            <div style="margin-top: 4rem; text-align: center; color: var(--text-muted); font-size: 0.9rem;">
                <i class="fas fa-check-circle" style="color: var(--primary)"></i> Fim da Leitura
            </div>
        `;

        modal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Impede scroll da página de trás
    }

    closeReader() {
        const modal = document.getElementById('immersiveReader');
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }

    // --- Lógica de Áudio ---

    toggleAudio() {
        const icon = document.getElementById('playIcon');
        const eq = document.getElementById('musicEq');

        if (this.isPlaying) {
            this.audio.pause();
            icon.classList.remove('fa-pause');
            icon.classList.add('fa-play');
            eq.classList.add('paused');
        } else {
            if (!this.audio.src) this.loadTrack(this.currentTrackIndex);
            this.audio.play().catch(e => console.log("Interação necessária para áudio"));
            icon.classList.remove('fa-play');
            icon.classList.add('fa-pause');
            eq.classList.remove('paused');
        }
        this.isPlaying = !this.isPlaying;
        this.saveAudioState();
    }

    loadTrack(index) {
        this.currentTrackIndex = index;
        this.audio.src = this.playlist[index].src;
        this.audio.loop = true;
        this.audio.volume = 0.5;
        document.getElementById('trackName').innerText = this.playlist[index].title;
        
        if(this.isPlaying) this.audio.play();
    }

    nextTrack() {
        let next = this.currentTrackIndex + 1;
        if (next >= this.playlist.length) next = 0;
        this.loadTrack(next);
        if (!this.isPlaying) this.toggleAudio(); // Auto play ao mudar
    }

    prevTrack() {
        let prev = this.currentTrackIndex - 1;
        if (prev < 0) prev = this.playlist.length - 1;
        this.loadTrack(prev);
        if (!this.isPlaying) this.toggleAudio();
    }

    saveAudioState() {
        localStorage.setItem('neuro_audio_state', JSON.stringify({
            isPlaying: this.isPlaying,
            track: this.currentTrackIndex
        }));
    }
}

// Inicializa a UI globalmente
const ui = new UIManager();
