const DB_NAME = 'NeuroProtocol_v1';
const DEV_MODE_ENABLED = true; 

class Database {
    constructor() {
        this.state = this.loadState();
        this.modulesCache = null;
        this.contentCache = {}; 
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
                    stats: { 
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

    // --- Dev Tools ---
    initDevListener() {
        if (!DEV_MODE_ENABLED) return;
        let keys = {};
        document.addEventListener('keydown', (e) => {
            keys[e.key] = true;
            if (keys['Shift'] && (keys['X'] || keys['x']) && (keys['Z'] || keys['z'])) {
                this.activateGodMode();
                keys = {}; 
            }
        });
        document.addEventListener('keyup', (e) => { delete keys[e.key]; });
    }

    activateGodMode() {
        if (confirm("⚠️ MODO DESENVOLVEDOR:\nDesbloquear tudo?")) {
            this.state.progress.unlockedDays = 28;
            this.state.progress.level = 10;
            this.state.progress.xp += 5000;
            // Popula stats para o gráfico não ficar vazio
            this.state.progress.stats = { awareness: 10, resilience: 8, social: 5, focus: 12 };
            this.saveState();
            window.location.reload();
        }
    }

    // --- Data Fetching (CORRIGIDO) ---

    async getModules() {
        if (this.modulesCache) return this.modulesCache;
        try {
            const res = await fetch('assets/data/modules.json');
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            this.modulesCache = await res.json();
            return this.modulesCache;
        } catch (e) {
            console.error("Erro crítico ao carregar modules.json:", e);
            alert("Erro ao carregar estrutura. Verifique o console.");
            return [];
        }
    }

    // ... (Mantenha o código anterior até a parte de Data Fetching)

    async getDayContent(moduleId) {
        if (this.contentCache[moduleId]) return this.contentCache[moduleId];
        try {
            const res = await fetch(`assets/data/content/${moduleId}.json`);
            if (!res.ok) throw new Error("Arquivo de módulo não encontrado");
            const data = await res.json();
            this.contentCache[moduleId] = data;
            return data;
        } catch (e) {
            console.error(`Erro ao carregar ${moduleId}.json`, e);
            return null;
        }
    }

    // NOVO MÉTODO: Busca o livreto denso específico
    async getBooklet(moduleId, dayId) {
        // Formata o dia para ter 2 dígitos (ex: 1 -> d01)
        const dayFormatted = dayId.toString().padStart(2, '0');
        const path = `assets/data/booklets/${moduleId}/d${dayFormatted}.json`;
        
        try {
            const res = await fetch(path);
            if (!res.ok) throw new Error(`Livreto não encontrado: ${path}`);
            return await res.json();
        } catch (e) {
            console.error("Erro ao carregar livreto:", e);
            // Fallback para caso o arquivo não exista ainda
            return {
                title: "Conteúdo em Desenvolvimento",
                read_time: "N/A",
                content: "<p>O conteúdo profundo deste dia está sendo compilado pelos neurocientistas.</p>"
            };
        }
    }

    // ... (Mantenha o restante do código)

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
            
            const catMap = {
                'Neurociência': 'awareness', 'Cognitivo': 'awareness', 'Introspecção': 'awareness',
                'Físico': 'resilience', 'Metabolismo': 'resilience', 'Ação': 'resilience', 'Detox': 'resilience',
                'Social': 'social', 'Comunicação': 'social', 'Liderança': 'social',
                'Foco': 'focus', 'Produtividade': 'focus', 'Planejamento': 'focus', 'Timer': 'focus'
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

    resetData() {
        localStorage.removeItem(DB_NAME);
        window.location.href = 'index.html';
    }
}

const db = new Database();
