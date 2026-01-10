// Verifica autenticação
const user = db.getUser();
if (!user) {
    window.location.href = 'index.html';
}

// Elementos da UI
const els = {
    userName: document.getElementById('userName'),
    userAvatar: document.getElementById('userAvatar'),
    userLevel: document.getElementById('userLevel'),
    xpBar: document.getElementById('xpBar'),
    xpText: document.getElementById('xpText'),
    welcomeHeader: document.getElementById('welcomeHeader'),
    currentDayDisplay: document.getElementById('currentDayDisplay'),
    currentModuleContainer: document.getElementById('currentModuleContainer'),
    timelineContainer: document.getElementById('timelineContainer'),
    globalProgress: document.getElementById('globalProgress')
};

// Inicialização
async function initDashboard() {
    renderUserProfile();
    
    // Carrega dados
    const modules = await db.getModules();
    const progress = db.getUnlockStatus();
    
    // Identifica Módulo Atual
    // Lógica: Encontra o módulo que contém o dia atual
    let currentModule = modules.find(m => m.days.includes(progress.currentDay)) || modules[modules.length - 1];
    
    renderCurrentModule(currentModule, progress.currentDay);
    renderTimeline(modules, progress);
}

function renderUserProfile() {
    const progress = db.getUnlockStatus();
    
    els.userName.innerText = user.name;
    els.userAvatar.innerText = user.name.charAt(0).toUpperCase();
    els.userLevel.innerText = `Nível ${progress.level}`;
    
    // Cálculo simples de XP para a barra (apenas visual por enquanto)
    const xpForNextLevel = progress.level * 1000;
    const xpPercent = Math.min(100, (progress.xp % 1000) / 1000 * 100);
    
    els.xpBar.style.width = `${xpPercent}%`;
    els.xpText.innerText = `${progress.xp} XP Total`;
    
    els.welcomeHeader.innerText = `Olá, ${user.name.split(' ')[0]}`;
    els.currentDayDisplay.innerText = progress.currentDay;
    
    // Progresso global (Dias desbloqueados / 28)
    const globalPercent = Math.min(100, Math.round((progress.currentDay - 1) / 28 * 100));
    els.globalProgress.innerText = `${globalPercent}%`;
}

function renderCurrentModule(module, currentDay) {
    // Calcula o dia relativo ao módulo (ex: Dia 9 é o dia 2 do Módulo 2)
    const dayIndex = module.days.indexOf(currentDay) + 1;
    
    const html = `
        <div class="module-info">
            <span class="module-tag" style="background-color: ${module.color}">Módulo Atual</span>
            <h2 class="module-title">${module.title}</h2>
            <p class="module-subtitle" style="color: ${module.color}; margin-bottom: 1rem; font-weight: 600;">${module.subtitle}</p>
            <p class="module-desc">${module.description}</p>
            
            <button class="btn btn-primary" onclick="goToDay(${currentDay})" style="background: ${module.color}; border: none;">
                <i class="fas fa-play"></i> Iniciar Dia ${currentDay}
            </button>
        </div>
        <i class="fas ${module.icon} module-icon-bg"></i>
    `;
    
    els.currentModuleContainer.innerHTML = html;
    // Ajusta o gradiente do card baseado na cor do módulo
    els.currentModuleContainer.style.background = `linear-gradient(135deg, ${module.color}22, rgba(15, 17, 26, 0.9))`;
    els.currentModuleContainer.style.borderColor = module.color;
}

function renderTimeline(modules, progress) {
    let html = '';
    
    modules.forEach(module => {
        // Verifica se o módulo está ativo, passado ou futuro
        const isPastModule = module.days[module.days.length - 1] < progress.currentDay;
        const isCurrentModule = module.days.includes(progress.currentDay);
        
        let headerClass = '';
        if (isCurrentModule) headerClass = 'active';
        
        // Gera Grid de Dias
        let daysHtml = '';
        module.days.forEach(day => {
            let dayStatusClass = 'locked';
            let icon = 'fa-lock';
            let label = 'Bloqueado';
            
            if (day < progress.currentDay) {
                dayStatusClass = 'unlocked completed';
                icon = 'fa-check-circle';
                label = 'Concluído';
            } else if (day === progress.currentDay) {
                dayStatusClass = 'unlocked current';
                icon = 'fa-play-circle';
                label = 'Em andamento';
            } else if (day <= progress.unlockedDays) {
                // Caso tenhamos lógica de desbloquear dias futuros sem completar o anterior (opcional)
                dayStatusClass = 'unlocked';
                icon = 'fa-unlock';
                label = 'Disponível';
            }
            
            daysHtml += `
                <div class="day-card ${dayStatusClass}" onclick="goToDay(${day})">
                    <span class="day-number">${day}</span>
                    <span class="day-status">
                        <i class="fas ${icon}"></i> ${label}
                    </span>
                </div>
            `;
        });

        html += `
            <div class="timeline-module-group">
                <div class="timeline-module-header ${headerClass}">
                    <h3 style="color: ${isCurrentModule || isPastModule ? 'white' : 'var(--text-muted)'}">
                        ${module.title}
                    </h3>
                </div>
                <div class="timeline-days-grid">
                    ${daysHtml}
                </div>
            </div>
        `;
    });
    
    els.timelineContainer.innerHTML = html;
}

function goToDay(day) {
    const progress = db.getUnlockStatus();
    if (day <= progress.unlockedDays) {
        // Redireciona para a página de protocolo passando o dia via URL parameter
        window.location.href = `protocol.html?day=${day}`;
    } else {
        alert("Este dia ainda está bloqueado. Complete os desafios anteriores para avançar sua neuroplasticidade.");
    }
}

function logout() {
    if(confirm("Deseja sair do sistema?")) {
        localStorage.removeItem('NeuroProtocol_DB'); // Opcional: Limpar dados ou apenas 'session'
        window.location.href = 'index.html';
    }
}

// Inicia
initDashboard();
