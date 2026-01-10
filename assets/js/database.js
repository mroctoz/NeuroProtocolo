const DB_NAME = 'NeuroProtocol_v1';
const DEV_MODE_ENABLED = true; // Mude para false para desativar em produção

class Database {
    constructor() {
        this.state = this.loadState();
        this.modulesCache = null;
        this.contentCache = {}; // Cache para conteúdos carregados
        this.initDevListener();
    }

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
                    stats: { // Novo: Para estatísticas
                        focus: 0,
                        resilience: 0,
                        social: 0,
                        awareness: 0
                    }
                },
                settings: { theme: 'dark', notifications: true }
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
            // Shift + X + Z
            if (keys['Shift'] && (keys['X'] || keys['x']) && (keys['Z'] || keys['z'])) {
                this.activateGodMode();
                keys = {}; // Reset
            }
        });

        document.addEventListener('keyup', (e) => {
            delete keys[e.key];
        });
    }

    activateGodMode() {
        if (confirm("⚠️ MODEV DEV: Desbloquear todo o conteúdo?")) {
            this.state.progress.unlockedDays = 28;
            this.state.progress.level = 10;
            this.state.progress.xp = 5000;
            this.saveState();
            alert("Protocolo 100% Desbloqueado. Recarregando...");
            window.location.reload();
        }
    }

    // --- Data Fetching ---
    async getModules() {
        if (this.modulesCache) return this.modulesCache;
        const res = await fetch('assets/data/modules.json');
        this.modulesCache = await res.json();
        return this.modulesCache;
    }

    async getDayContent(moduleId) {
        if (this.contentCache[moduleId]) return this.contentCache[moduleId];
        const res = await fetch(`assets/data/content/${moduleId}.json`);
        const data = await res.json();
        this.contentCache[moduleId] = data;
        return data;
    }

    // --- Logic ---
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
            
            // Atualiza estatísticas por categoria
            const catMap = {
                'Neurociência': 'awareness', 'Cognitivo': 'awareness',
                'Físico': 'resilience', 'Metabolismo': 'resilience',
                'Social': 'social', 'Comunicação': 'social',
                'Foco': 'focus', 'Produtividade': 'focus'
            };
            const statKey = catMap[category] || 'awareness';
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

    updateLevel() {
        const newLevel = Math.floor(this.state.progress.xp / 1000) + 1;
        if (newLevel > this.state.progress.level) this.state.progress.level = newLevel;
    }

    // Helper para resetar dados (Configurações)
    resetData() {
        localStorage.removeItem(DB_NAME);
        window.location.href = 'index.html';
    }
}

const db = new Database();
