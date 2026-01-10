const urlParams = new URLSearchParams(window.location.search);
const taskId = urlParams.get('taskId');
const currentDay = parseInt(urlParams.get('day'));

async function initChallenge() {
    // Precisamos buscar os dados da tarefa. 
    // Como os dados estão nos arquivos de módulo, precisamos saber o módulo.
    const moduleId = getModuleIdForDay(currentDay);
    const moduleData = await db.getDayContent(moduleId);
    
    // Encontrar a tarefa específica dentro do dia
    const task = moduleData.days[currentDay].challenges.find(t => t.id === taskId);

    if (!task) {
        alert("Tarefa não encontrada.");
        history.back();
        return;
    }

    renderChallengeUI(task);
}

function getModuleIdForDay(day) {
    if (day <= 7) return 'module_01';
    if (day <= 14) return 'module_02';
    if (day <= 21) return 'module_03';
    return 'module_04';
}

function renderChallengeUI(task) {
    const container = document.getElementById('challengeContent');
    
    let interactionHTML = '';

    // Lógica de UI baseada no tipo de tarefa
    if (task.type === 'journaling') {
        interactionHTML = `
            <textarea id="journalText" class="journal-input" placeholder="Escreva sua reflexão aqui..."></textarea>
            <button class="btn btn-primary" onclick="completeJournal('${task.id}', ${task.xp})">Salvar e Completar</button>
        `;
    } else if (task.type === 'meditation' || task.type === 'timer') {
        interactionHTML = `
            <div class="timer-display" id="timerDisplay">${formatTime(task.timer || 60)}</div>
            <button id="startTimerBtn" class="btn btn-primary" onclick="startTimer(${task.timer || 60}, '${task.id}', ${task.xp})">
                <i class="fas fa-play"></i> Iniciar
            </button>
        `;
    } else {
        // Ação genérica ou Leitura
        interactionHTML = `
            <button class="btn btn-primary" onclick="completeGeneric('${task.id}', ${task.xp})">
                <i class="fas fa-check"></i> Marcar como Concluído
            </button>
        `;
    }

    container.innerHTML = `
        <div class="icon-circle" style="font-size: 3rem; color: var(--accent); margin-bottom: 1rem;">
            <i class="fas ${getIconForType(task.type)}"></i>
        </div>
        <h1 style="margin-bottom: 1rem;">${task.title}</h1>
        <p style="color: var(--text-muted); font-size: 1.2rem; margin-bottom: 2rem;">${task.instruction || task.desc}</p>
        
        <div class="interaction-area">
            ${interactionHTML}
        </div>
    `;
}

// --- Helpers e Handlers ---

function getIconForType(type) {
    const icons = {
        'journaling': 'fa-pen-fancy',
        'meditation': 'fa-spa',
        'reading': 'fa-book-open',
        'physical': 'fa-dumbbell',
        'action': 'fa-bolt'
    };
    return icons[type] || 'fa-star';
}

function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
}

// --- Action Logic ---

function completeGeneric(id, xp) {
    db.completeTask(id, xp);
    window.location.href = `protocol.html?day=${currentDay}`;
}

function completeJournal(id, xp) {
    const text = document.getElementById('journalText').value;
    if (text.length < 10) {
        alert("Por favor, escreva uma reflexão mais detalhada.");
        return;
    }
    db.saveJournalEntry(id, text); // Salva o texto no "banco"
    db.completeTask(id, xp);
    window.location.href = `protocol.html?day=${currentDay}`;
}

function startTimer(duration, id, xp) {
    const display = document.getElementById('timerDisplay');
    const btn = document.getElementById('startTimerBtn');
    btn.disabled = true;
    
    let timer = duration;
    const interval = setInterval(() => {
        timer--;
        display.innerText = formatTime(timer);
        
        if (timer <= 0) {
            clearInterval(interval);
            btn.innerText = "Concluído!";
            btn.disabled = false;
            btn.onclick = () => completeGeneric(id, xp);
            // Som de sino opcional aqui
        }
    }, 1000);
}

// Inicia
initChallenge();
