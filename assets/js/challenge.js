const urlParams = new URLSearchParams(window.location.search);
const taskId = urlParams.get('taskId');
const currentDay = parseInt(urlParams.get('day'));

// --- Mapeamento (Igual ao protocol.js) ---
function getModuleIdForDay(day) {
    if (day <= 7) return 'module_01';
    if (day <= 14) return 'module_02';
    if (day <= 21) return 'module_03';
    return 'module_04';
}

async function initChallenge() {
    const moduleId = getModuleIdForDay(currentDay);
    const moduleData = await db.getDayContent(moduleId);
    
    if (!moduleData || !moduleData.days || !moduleData.days[currentDay]) {
        alert("Erro de dados. Retornando.");
        window.location.href = 'dashboard.html';
        return;
    }

    const dayData = moduleData.days[currentDay];
    const task = dayData.challenges.find(t => t.id === taskId);

    if (!task) {
        alert("Tarefa não encontrada.");
        history.back();
        return;
    }

    // Injeta o botão de voltar fora do card
    document.body.insertAdjacentHTML('afterbegin', `
        <div class="back-link-wrapper">
            <a href="protocol.html?day=${currentDay}" class="back-link">
                <i class="fas fa-arrow-left"></i> Voltar ao Protocolo
            </a>
        </div>
    `);

    // Renderiza UI baseada no tipo
    if (task.type === 'reading') {
        // Busca o livreto completo
        const fullBooklet = await db.getBooklet(moduleId, currentDay);
        renderReadingUI(task, fullBooklet);
    } else {
        renderChallengeUI(task);
    }
}

// UI: Leitura
function renderReadingUI(task, booklet) {
    const container = document.getElementById('challengeContent');
    const bookletTitle = booklet ? booklet.title : "Leitura do Dia";
    const bookletContent = booklet ? booklet.content : "<p>Conteúdo indisponível.</p>";
    const readTime = booklet ? booklet.read_time : "10 min";

    // Estrutura em Card/Popup
    container.outerHTML = `
        <div class="challenge-card">
            <div class="challenge-header">
                <div class="icon-badge"><i class="fas fa-book-reader"></i></div>
                <h1 class="challenge-title">${task.title}</h1>
                <span class="challenge-xp">+${task.xp} XP</span>
            </div>

            <div class="content-block">
                <span class="block-label">Instrução</span>
                <p class="instruction-text">A neuroplasticidade exige atenção plena. Acesse o material abaixo, coloque seus fones e dedique-se exclusivamente a esta leitura.</p>
            </div>

            <!-- Preview do Livreto Clicável -->
            <div class="booklet-preview" onclick="ui.openReader('${bookletTitle}', \`${bookletContent}\`)">
                <div class="booklet-icon"><i class="fas fa-file-alt"></i></div>
                <div class="booklet-info">
                    <h4>${bookletTitle}</h4>
                    <p>Tempo estimado: ${readTime} • Clique para abrir</p>
                </div>
                <i class="fas fa-external-link-alt" style="margin-left: auto; color: var(--text-muted)"></i>
            </div>

            <div class="action-area">
                <button class="btn btn-primary btn-large" onclick="completeGeneric('${task.id}', ${task.xp}, '${task.category}')">
                    <i class="fas fa-check-circle"></i> Confirmar Leitura e Compreensão
                </button>
            </div>
        </div>
    `;
}

// UI: Outros Desafios
function renderChallengeUI(task) {
    const container = document.getElementById('challengeContent');
    let contentHTML = '';

    // Bloco de Instrução Padrão
    const instructionBlock = `
        <div class="content-block">
            <span class="block-label">O Desafio</span>
            <p class="instruction-text">${task.instruction || task.desc}</p>
        </div>
    `;

    // Conteúdo Dinâmico
    if (task.type === 'journaling') {
        contentHTML = `
            ${instructionBlock}
            <div class="content-block" style="border-left-color: var(--accent);">
                <span class="block-label">Seu Registro</span>
                <textarea id="journalText" class="journal-input" placeholder="Escreva sua reflexão aqui..."></textarea>
            </div>
            <div class="action-area">
                <button class="btn btn-primary btn-large" onclick="completeJournal('${task.id}', ${task.xp}, '${task.category}')">
                    <i class="fas fa-save"></i> Salvar e Completar
                </button>
            </div>
        `;
    } else if (task.type === 'meditation' || task.type === 'timer') {
        contentHTML = `
            ${instructionBlock}
            <div class="timer-display" id="timerDisplay">${formatTime(task.timer || 60)}</div>
            <div class="action-area">
                <button id="startTimerBtn" class="btn btn-primary btn-large" onclick="startTimer(${task.timer || 60}, '${task.id}', ${task.xp}, '${task.category}')">
                    <i class="fas fa-play"></i> Iniciar Timer
                </button>
            </div>
        `;
    } else {
        // Ação Genérica
        contentHTML = `
            ${instructionBlock}
            <div class="action-area">
                <button class="btn btn-primary btn-large" onclick="completeGeneric('${task.id}', ${task.xp}, '${task.category}')">
                    <i class="fas fa-check"></i> Marcar como Concluído
                </button>
            </div>
        `;
    }

    // Renderiza o Card Completo
    container.outerHTML = `
        <div class="challenge-card">
            <div class="challenge-header">
                <div class="icon-badge"><i class="fas ${getIconForType(task.type)}"></i></div>
                <h1 class="challenge-title">${task.title}</h1>
                <span class="challenge-xp">+${task.xp} XP</span>
            </div>
            ${contentHTML}
        </div>
    `;
}

// --- Funções Auxiliares (Mantidas) ---

function getIconForType(type) {
    const icons = {
        'journaling': 'fa-pen-fancy',
        'meditation': 'fa-spa',
        'timer': 'fa-hourglass-half',
        'reading': 'fa-book-open',
        'physical': 'fa-dumbbell',
        'action': 'fa-bolt',
        'social': 'fa-users',
        'quiz': 'fa-question-circle'
    };
    return icons[type] || 'fa-star';
}

function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
}

// --- Ações ---

function completeGeneric(id, xp, category) {
    if(confirm("Você realmente completou esta tarefa com foco total?")) {
        db.completeTask(id, xp, category);
        window.location.href = `protocol.html?day=${currentDay}`;
    }
}

function completeJournal(id, xp, category) {
    const text = document.getElementById('journalText').value;
    if (text.trim().length < 10) {
        alert("Aprofunde sua reflexão. O cérebro precisa de elaboração.");
        return;
    }
    db.saveJournalEntry(id, text);
    db.completeTask(id, xp, category);
    window.location.href = `protocol.html?day=${currentDay}`;
}

function startTimer(duration, id, xp, category) {
    const display = document.getElementById('timerDisplay');
    const btn = document.getElementById('startTimerBtn');
    
    // Inicia som automaticamente se disponível
    if(typeof ui !== 'undefined' && !ui.isPlaying) {
        // Tenta tocar música suave se não estiver tocando
        // ui.loadTrack(1); // Opcional
    }

    btn.disabled = true;
    btn.style.opacity = "0.5";
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Foco Total...';
    
    let timer = duration;
    
    const interval = setInterval(() => {
        timer--;
        display.innerText = formatTime(timer);
        
        if (timer <= 0) {
            clearInterval(interval);
            display.style.color = "var(--success)";
            btn.innerHTML = '<i class="fas fa-check"></i> Concluir Desafio';
            btn.style.opacity = "1";
            btn.classList.replace('btn-primary', 'btn-success'); // Se tiver classe de sucesso
            btn.style.background = "var(--success)";
            btn.style.boxShadow = "0 4px 15px rgba(0,184,148,0.4)";
            btn.disabled = false;
            
            // Redefine o botão para finalizar
            btn.onclick = () => completeGeneric(id, xp, category);
            
            if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
        }
    }, 1000);
}

initChallenge();
