const urlParams = new URLSearchParams(window.location.search);
const taskId = urlParams.get('taskId');
const currentDay = parseInt(urlParams.get('day'));

// --- Mapeamento (Crucial estar igual ao protocol.js) ---
function getModuleIdForDay(day) {
    if (day <= 7) return 'module_01';
    if (day <= 14) return 'module_02';
    if (day <= 21) return 'module_03';
    return 'module_04';
}

async function initChallenge() {
    const moduleId = getModuleIdForDay(currentDay);
    const moduleData = await db.getDayContent(moduleId);
    
    // Verificações de segurança
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

    // Renderiza UI baseada no tipo
    if (task.type === 'reading') {
        // Passa o livreto do dia para a função de renderização
        renderReadingUI(task, dayData.booklet);
    } else {
        renderChallengeUI(task);
    }
}

// Auxiliar: Mapeia dias para módulos
function getModuleIdForDay(day) {
    if (day <= 7) return 'module_01';
    if (day <= 14) return 'module_02';
    if (day <= 21) return 'module_03';
    return 'module_04';
}

// UI Específica para Tarefas de Leitura
function renderReadingUI(task, booklet) {
    const container = document.getElementById('challengeContent');
    
    // Se por acaso não houver livreto, usa uma mensagem padrão
    const bookletTitle = booklet ? booklet.title : "Leitura do Dia";
    const bookletContent = booklet ? booklet.content : "<p>Conteúdo de leitura principal do dia.</p>";

    container.innerHTML = `
        <div class="icon-circle"><i class="fas fa-book-reader"></i></div>
        <h1>${task.title}</h1>
        
        <div class="booklet-review-card">
            <h3>Material de Referência: ${bookletTitle}</h3>
            <div class="booklet-snippet">
                ${bookletContent} 
            </div>
        </div>

        <p class="instruction-text">Você leu e compreendeu o material acima com atenção plena? A neuroplasticidade exige foco, não apenas 'scrolling'.</p>
        
        <div class="interaction-area">
            <button class="btn btn-primary" onclick="completeGeneric('${task.id}', ${task.xp}, '${task.category || 'Cognitivo'}')">
                <i class="fas fa-check-circle"></i> Confirmar Leitura Profunda
            </button>
        </div>
    `;
}

// UI para Outros Desafios (Timer, Journaling, Ação)
function renderChallengeUI(task) {
    const container = document.getElementById('challengeContent');
    let interactionHTML = '';

    // Lógica de UI baseada no tipo de tarefa
    if (task.type === 'journaling') {
        interactionHTML = `
            <textarea id="journalText" class="journal-input" placeholder="Escreva sua reflexão aqui... (Mínimo 10 caracteres)"></textarea>
            <button class="btn btn-primary" onclick="completeJournal('${task.id}', ${task.xp}, '${task.category}')">Salvar e Completar</button>
        `;
    } else if (task.type === 'meditation' || task.type === 'timer') {
        interactionHTML = `
            <div class="timer-display" id="timerDisplay">${formatTime(task.timer || 60)}</div>
            <button id="startTimerBtn" class="btn btn-primary" onclick="startTimer(${task.timer || 60}, '${task.id}', ${task.xp}, '${task.category}')">
                <i class="fas fa-play"></i> Iniciar
            </button>
        `;
    } else {
        // Ação genérica, física, social
        interactionHTML = `
            <button class="btn btn-primary" onclick="completeGeneric('${task.id}', ${task.xp}, '${task.category}')">
                <i class="fas fa-check"></i> Marcar como Concluído
            </button>
        `;
    }

    container.innerHTML = `
        <div class="icon-circle"><i class="fas ${getIconForType(task.type)}"></i></div>
        <h1>${task.title}</h1>
        <p class="instruction-text">${task.instruction || task.desc || "Siga as instruções do protocolo."}</p>
        
        <div class="interaction-area">
            ${interactionHTML}
        </div>
    `;
}

// --- Funções Auxiliares ---

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

// --- Lógica de Ação (Completion) ---

function completeGeneric(id, xp, category) {
    db.completeTask(id, xp, category);
    window.location.href = `protocol.html?day=${currentDay}`;
}

function completeJournal(id, xp, category) {
    const text = document.getElementById('journalText').value;
    if (text.trim().length < 10) {
        alert("Por favor, aprofunde sua reflexão. O cérebro precisa de elaboração.");
        return;
    }
    db.saveJournalEntry(id, text);
    db.completeTask(id, xp, category);
    window.location.href = `protocol.html?day=${currentDay}`;
}

function startTimer(duration, id, xp, category) {
    const display = document.getElementById('timerDisplay');
    const btn = document.getElementById('startTimerBtn');
    btn.disabled = true;
    btn.style.opacity = "0.5";
    btn.innerText = "Em progresso...";
    
    let timer = duration;
    
    const interval = setInterval(() => {
        timer--;
        display.innerText = formatTime(timer);
        
        if (timer <= 0) {
            clearInterval(interval);
            display.style.color = "var(--success)";
            btn.innerText = "Concluir Desafio";
            btn.style.opacity = "1";
            btn.disabled = false;
            
            // Redefine o botão para finalizar a tarefa
            btn.onclick = () => completeGeneric(id, xp, category);
            
            // Feedback vibratório (se suportado mobile)
            if (navigator.vibrate) navigator.vibrate(200);
        }
    }, 1000);
}

// Inicia o script
initChallenge();
