// Obtém parâmetros da URL (ex: ?day=1)
const urlParams = new URLSearchParams(window.location.search);
const currentDay = parseInt(urlParams.get('day')) || 1;

// Elementos UI
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

// Mapeamento de Dias para Módulos (Simplificado para o MVP)
// Em produção, isso viria de uma lógica mais robusta no database
function getModuleIdForDay(day) {
    if (day <= 7) return 'module_01';
    if (day <= 14) return 'module_02';
    if (day <= 21) return 'module_03';
    return 'module_04';
}

async function initProtocol() {
    const moduleId = getModuleIdForDay(currentDay);
    const moduleData = await db.getDayContent(moduleId); // Busca o JSON do módulo

    if (!moduleData || !moduleData.days[currentDay]) {
        alert("Conteúdo ainda não disponível ou erro no carregamento.");
        window.location.href = 'dashboard.html';
        return;
    }

    const dayData = moduleData.days[currentDay];
    renderBooklet(dayData.booklet);
    renderTaskList(dayData.challenges);
    updateProgress(dayData.challenges);
}

function renderBooklet(booklet) {
    els.dayNumber.innerText = currentDay;
    els.readTime.innerText = booklet.read_time || "10 min";
    els.bookletTitle.innerText = booklet.title;
    els.bookletContent.innerHTML = booklet.content;
    // Marca a tarefa de leitura como completa automaticamente se o usuário ficar na página por X segundos?
    // Por enquanto, deixaremos como uma tarefa clicável na lista para confirmação explícita.
}

function renderTaskList(tasks) {
    let html = '';
    
    tasks.forEach(task => {
        const isCompleted = db.isTaskCompleted(task.id);
        const statusClass = isCompleted ? 'completed' : '';
        
        // Se a tarefa for apenas de leitura, usamos uma lógica simples
        // Se for complexa, redirecionamos
        const action = isCompleted ? '' : `onclick="openChallenge('${task.id}')"`;

        html += `
            <div class="task-card ${statusClass}" ${action}>
                <span class="task-category">${task.category}</span>
                <h3>${task.title}</h3>
                <span class="task-xp">+${task.xp} XP</span>
            </div>
        `;
    });

    els.taskList.innerHTML = html;
}

function openChallenge(taskId) {
    // Salva o ID da tarefa na sessão ou URL para a página de desafio
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
    // Lógica para desbloquear o próximo dia
    // Por agora, apenas volta ao dashboard
    alert("Dia concluído! Neuroplasticidade consolidada.");
    window.location.href = 'dashboard.html';
}

initProtocol();
