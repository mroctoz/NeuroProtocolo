class UIManager {
    constructor() {
        // Agora foca apenas na UI visual (Modais)
        this.init();
    }

    init() {
        this.injectComponents();
    }

    injectComponents() {
        const modalHTML = `
            <div id="immersiveReader" class="modal-overlay">
                <div class="modal-content slide-up">
                    <div class="modal-header">
                        <span class="modal-title" id="readerContext">Leitura Profunda</span>
                        <button class="close-modal-btn" onclick="ui.closeReader()"><i class="fas fa-times"></i></button>
                    </div>
                    <div class="modal-body" id="readerContent"></div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    openReader(title, content, context = "NeuroProtocolo") {
        const modal = document.getElementById('immersiveReader');
        const body = document.getElementById('readerContent');
        const contextEl = document.getElementById('readerContext');
        
        if(contextEl) contextEl.innerText = context;
        
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
        document.body.style.overflow = 'hidden';
    }

    closeReader() {
        const modal = document.getElementById('immersiveReader');
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

const ui = new UIManager();
