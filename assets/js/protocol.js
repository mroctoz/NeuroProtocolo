// Obtém parâmetros da URL
const urlParams = new URLSearchParams(window.location.search);
const currentDay = parseInt(urlParams.get('day')) || 1;

// Mapeamento de Dias para Arquivos
function getModuleIdForDay(day) {
    if (day <= 7) return 'module_01';
    if (day <= 14) return 'module_02';
    if (day <= 21) return 'module_03';
    return 'module_04';
}

const els = {
    dayNumber: document.getElementById('dayNumber'),
    taskProgress: document.getElementById('taskProgress'),
    miniBar: document.getElementById('miniBar'),
    readTime: document.getElementById('readTime'),
    bookletTitle: document.getElementById('bookletTitle'),
    bookletContent: document.getElementById('bookletContent'),
    bookletSource: document.getElementById('bookletSource'),
    taskList: document.getElementById('taskList'),
    completeDayBtn: document.getElementById('completeDayBtn')
};

async function initProtocol() {
    // Verifica se o DB está carregado
    if (typeof db === 'undefined') {
        console.error("Database não carregado.");
        return;
    }

    const moduleId = getModuleIdForDay(currentDay);
    
    // Busca dados com tratamento de erro
    const moduleData = await db.getDayContent(moduleId);

    if (!moduleData || !moduleData.days || !moduleData.days[currentDay]) {
        alert(`Erro: Conteúdo do dia ${currentDay} não encontrado.`);
        window.location.href = 'dashboard.html';
        return;
    }

    const dayData = moduleData.days[currentDay];
    
    // Renderiza
    // Busca o livreto completo para exibir o resumo na tela
    const fullBooklet = await db.getBooklet(moduleId, currentDay);
    
    renderBookletInfo(dayData, fullBooklet);
    renderTaskList(dayData.challenges);
    updateProgress(dayData.challenges);
}

function renderBookletInfo(dayData, fullBooklet) {
    els.dayNumber.innerText = currentDay;
    // Usa o tempo do livreto completo
    els.readTime.innerText = fullBooklet.read_time || "10 min";
    // Usa o título do resumo do dia
    els.bookletTitle.innerText = dayData.title;
    // Usa o resumo do dia para a introdução
    els.bookletContent.innerHTML = `<p>${dayData.summary}</p>`; 
    els.bookletSource.innerText = "NeuroProtocolo";
}

function renderTaskList(tasks) {
    let html = '';
    
    tasks.forEach(task => {
        const isCompleted = db.isTaskCompleted(task.id);
        const statusClass = isCompleted ? 'completed' : '';
        const action = isCompleted ? '' : `onclick="openChallenge('${task.id}')"`;

        html += `
            <div class="task-card ${statusClass}" ${action}>
                <span class="task-category">${task.category || 'Geral'}</span>
                <h3>${task.title}</h3>
                <span class="task-xp">+${task.xp} XP</span>
            </div>
        `;
    });

    els.taskList.innerHTML = html;
}

function openChallenge(taskId) {
    window.location.href = `challenge.html?taskId=${taskId}&day=${currentDay}`;
}

function updateProgress(tasks) {
    const total = tasks.length;
    let completed = 0;
    tasks.forEach(t => {
        if (db.isTaskCompleted(t.id)) completed++;
    });

    els.taskProgress.innerText = `${completed}/${total} Tarefas`;
    const percent = (completed / total) * 100;
    els.miniBar.style.width = `${percent}%`;

    // Mostra o botão se tudo estiver completo
    if (completed === total) {
        els.completeDayBtn.classList.remove('hidden');
    }
}

// CORREÇÃO: Função de Finalizar Dia
window.finishDay = function() {
    // Tenta desbloquear o próximo dia
    const unlocked = db.unlockNextDay();
    
    if (unlocked) {
        alert("Parabéns! Neuroplasticidade consolidada. Próximo dia desbloqueado.");
    } else {
        alert("Dia concluído! (Você já havia desbloqueado os dias seguintes anteriormente).");
    }
    
    window.location.href = 'dashboard.html';
}

initProtocol();
