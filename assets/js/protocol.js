// Obtém parâmetros da URL
const urlParams = new URLSearchParams(window.location.search);
const currentDay = parseInt(urlParams.get('day')) || 1;

// Mapeamento CORRIGIDO de Dias para Arquivos
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
    const moduleId = getModuleIdForDay(currentDay);
    
    // Busca dados com tratamento de erro
    const moduleData = await db.getDayContent(moduleId);

    // Verificação robusta se os dados existem
    if (!moduleData || !moduleData.days || !moduleData.days[currentDay]) {
        console.error("Dados não encontrados para o dia:", currentDay, "no módulo:", moduleId);
        alert(`Erro: Conteúdo do dia ${currentDay} não encontrado.`);
        window.location.href = 'dashboard.html';
        return;
    }

    const dayData = moduleData.days[currentDay];
    
    // Renderiza
    renderBooklet(dayData.booklet);
    renderTaskList(dayData.challenges);
    updateProgress(dayData.challenges);
}

function renderBooklet(booklet) {
    if(!booklet) return; // Segurança
    els.dayNumber.innerText = currentDay;
    els.readTime.innerText = booklet.read_time || "10 min";
    els.bookletTitle.innerText = booklet.title;
    els.bookletContent.innerHTML = booklet.content;
    els.bookletSource.innerText = "NeuroProtocolo Base";
}

function renderTaskList(tasks) {
    let html = '';
    
    tasks.forEach(task => {
        const isCompleted = db.isTaskCompleted(task.id);
        const statusClass = isCompleted ? 'completed' : '';
        
        // Se completa, não clica. Se incompleta, abre desafio.
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

    if (completed === total) {
        els.completeDayBtn.classList.remove('hidden');
    }
}

function finishDay() {
    db.unlockNextDay(currentDay);
    alert("Dia concluído! Neuroplasticidade consolidada.");
    window.location.href = 'dashboard.html';
}

initProtocol();
