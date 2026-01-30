// --- Proteção de Rota ---
// Verifica autenticação antes de qualquer coisa
const user = db.getUser();
if (!user) {
    // Se não tem usuário, manda pro login
    // window.top garante que saia do iframe se estiver dentro de um
    window.top.location.href = 'index.html';
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
    if(!user) return; // Segurança extra

    renderUserProfile();
    
    // Carrega dados
    const modules = await db.getModules();
    const progress = db.getUnlockStatus();
    
    // Identifica Módulo Atual (Encontra o módulo que contém o dia atual)
    let currentModule = modules.find(m => m.days.includes(progress.currentDay)) || modules[modules.length - 1];
    
    // Renderiza
    if(currentModule) {
        renderCurrentModule(currentModule, progress.currentDay);
        renderTimeline(modules, progress);
    }
}

function renderUserProfile() {
    const progress = db.getUnlockStatus();
    
    // Preenche dados do usuário com segurança
    const firstName = user.name ? user.name.split(' ')[0] : 'Viajante';
    
    els.userName.innerText = user.name || "Usuário";
    els.userAvatar.innerText = user.name ? user.name.charAt(0).toUpperCase() : "U";
    els.userLevel.innerText = `Nível ${progress.level}`;
    
    const xpPercent = Math.min(100, (progress.xp % 1000) / 1000 * 100);
    
    els.xpBar.style.width = `${xpPercent}%`;
    els.xpText.innerText = `${progress.xp} XP Total`;
    
    els.welcomeHeader.innerText = `Olá, ${firstName}`;
    els.currentDayDisplay.innerText = progress.currentDay;
    
    const globalPercent = Math.min(100, Math.round((progress.unlockedDays - 1) / 28 * 100));
    els.globalProgress.innerText = `${globalPercent}%`;
}

function renderCurrentModule(module, currentDay) {
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
    els.currentModuleContainer.style.background = `linear-gradient(135deg, ${module.color}22, rgba(15, 17, 26, 0.9))`;
    els.currentModuleContainer.style.borderColor = module.color;
}

function renderTimeline(modules, progress) {
    let html = '';
    
    modules.forEach(module => {
        // Verifica status do módulo
        const isCurrentModule = module.days.includes(progress.currentDay);
        
        // Gera Grid de Dias
        let daysHtml = '';
        module.days.forEach(day => {
            let dayStatusClass = 'locked';
            let icon = 'fa-lock';
            let label = 'Bloqueado';
            
            // Lógica de Estado do Dia
            if (day < progress.currentDay) {
                dayStatusClass = 'unlocked completed';
                icon = 'fa-check-circle';
                label = 'Concluído';
            } else if (day === progress.currentDay) {
                dayStatusClass = 'unlocked current';
                icon = 'fa-play-circle';
                label = 'Atual';
            } else if (day <= progress.unlockedDays) {
                // Caso o usuário tenha voltado para dias anteriores, 
                // dias futuros já desbloqueados aparecem como disponíveis
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
                <div class="timeline-module-header ${isCurrentModule ? 'active' : ''}">
                    <h3 style="color: white">${module.title}</h3>
                </div>
                <div class="timeline-days-grid">
                    ${daysHtml}
                </div>
            </div>
        `;
    });
    
    els.timelineContainer.innerHTML = html;
}

// Função Global de Navegação
window.goToDay = function(day) {
    const progress = db.getUnlockStatus();
    // Permite acessar qualquer dia menor ou igual ao máximo já desbloqueado
    if (day <= progress.unlockedDays) {
        window.location.href = `protocol.html?day=${day}`;
    } else {
        alert("Complete o dia atual para desbloquear o próximo passo da sua evolução.");
    }
}

window.logout = function() {
    if(confirm("Deseja sair do sistema?")) {
        // window.top.location para quebrar o iframe e ir para a tela de login real
        window.top.location.href = 'index.html';
    }
}

// Inicia
initDashboard();
// 
