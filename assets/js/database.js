const DB_NAME = 'NeuroProtocol_v1';
const DEV_MODE_ENABLED = true; // Permite o atalho Shift+X+Z

class Database {
    constructor() {
        this.state = this.loadState();
        this.modulesCache = null;
        this.contentCache = {}; // Cache para evitar múltiplos fetchs
        this.initDevListener();
    }

    // --- Core Methods ---
    
    loadState() {
        const stored = localStorage.getItem(DB_NAME);
        if (!stored) {
            const initialState = {
                user: null,
                progress: {
                    currentDay: 1,
                    unlockedDays: 1,
                    completedTasks: [], 
                    journalEntries: {},
                    xp: 0,
                    level: 1,
                    stats: { // Estatísticas para o gráfico
                        focus: 0,
                        resilience: 0,
                        social: 0,
                        awareness: 0
                    }
                },
                settings: { theme: 'dark' }
            };
            localStorage.setItem(DB_NAME, JSON.stringify(initialState));
            return initialState;
        }
        return JSON.parse(stored);
    }

    saveState() {
        localStorage.setItem(DB_NAME, JSON.stringify(this.state));
    }

    // --- Dev Tools (God Mode) ---
    initDevListener() {
        if (!DEV_MODE_ENABLED) return;
        
        let keys = {};
        document.addEventListener('keydown', (e) => {
            keys[e.key] = true;
            // Atalho: Shift + X + Z
            if (keys['Shift'] && (keys['x'] || keys['X']) && (keys['z'] || keys['Z'])) {
                this.activateGodMode();
                keys = {}; 
            }
        });

        document.addEventListener('keyup', (e) => {
            delete keys[e.key];
        });
    }

    activateGodMode() {
        if (confirm("⚠️ MODO DESENVOLVEDOR:\nDeseja desbloquear todos os dias e aumentar o nível?")) {
            this.state.progress.unlockedDays = 28;
            this.state.progress.level = 5;
            this.state.progress.xp += 2000;
            
            // Popula stats fake para teste
            this.state.progress.stats.awareness = 10;
            this.state.progress.stats.resilience = 8;
            this.state.progress.stats.social = 5;
            this.state.progress.stats.focus = 12;

            this.saveState();
            alert("Sistema desbloqueado. Recarregando...");
            window.location.reload();
        }
    }

    // --- Data Fetching ---

    async getModules() {
        if (this.modulesCache) return this.modulesCache;
        try {
            const res = await fetch('assets/data/modules.json');
            this.modulesCache = await res.json();
            return this.modulesCache;
        } catch (e) {
            console.error("Erro ao carregar modules.json", e);
            return [];
        }
    }

    async getDayContent(moduleId) {
        if (this.contentCache[moduleId]) return this.contentCache[moduleId];
        try {
            const res = await fetch(`assets/data/content/${moduleId}.json`);
            const data = await res.json();
            this.contentCache[moduleId] = data;
            return data;
        } catch (e) {
            console.error(`Erro ao carregar ${moduleId}.json`, e);
            return null;
        }
    }

    // --- Métodos de Usuário e Progresso ---

    registerUser(name) {
        this.state.user = { name, startDate: new Date().toISOString() };
        this.saveState();
    }

    getUser() { return this.state.user; }
    
    getUnlockStatus() { return this.state.progress; }

    isTaskCompleted(taskId) {
        return this.state.progress.completedTasks.includes(taskId);
    }

    completeTask(taskId, xpReward, category = 'awareness') {
        if (!this.isTaskCompleted(taskId)) {
            this.state.progress.completedTasks.push(taskId);
            this.state.progress.xp += xpReward;
            
            // Mapeamento de categorias do JSON para categorias das Estatísticas
            const catMap = {
                'Neurociência': 'awareness', 
                'Cognitivo': 'awareness',
                'Introspecção': 'awareness',
                'Físico': 'resilience', 
                'Metabolismo': 'resilience',
                'Ação': 'resilience',
                'Social': 'social', 
                'Comunicação': 'social',
                'Liderança': 'social',
                'Foco': 'focus', 
                'Produtividade': 'focus',
                'Planejamento': 'focus',
                'Timer': 'focus'
            };
            
            // Se a categoria não estiver no mapa, usa 'awareness' como padrão
            const statKey = catMap[category] || 'awareness';
            
            // Incrementa estatística
            this.state.progress.stats[statKey] = (this.state.progress.stats[statKey] || 0) + 1;

            this.updateLevel();
            this.saveState();
            return true;
        }
        return false;
    }

    saveJournalEntry(taskId, text) {
        this.state.progress.journalEntries[taskId] = text;
        this.saveState();
    }

    // Atualiza dias desbloqueados
    unlockNextDay(currentDay) {
        if (this.state.progress.unlockedDays === currentDay) {
            this.state.progress.unlockedDays++;
            this.state.progress.currentDay++; 
            this.saveState();
            return true;
        }
        return false;
    }

    updateLevel() {
        // Nível sobe a cada 1000 XP
        const newLevel = Math.floor(this.state.progress.xp / 1000) + 1;
        if (newLevel > this.state.progress.level) this.state.progress.level = newLevel;
    }

    resetData() {
        localStorage.removeItem(DB_NAME);
        window.location.href = 'index.html';
    }
}

const db = new Database();
