const DB_NAME = 'NeuroProtocol_v1';

class Database {
    constructor() {
        this.state = this.loadState();
        this.modulesCache = null;
        this.currentContentCache = null;
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
                    completedTasks: [], // Array de IDs de tarefas
                    journalEntries: {}, // Map de diaId -> texto
                    xp: 0,
                    level: 1
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

    // --- Data Fetching (Simulando API local) ---

    async getModules() {
        if (this.modulesCache) return this.modulesCache;
        try {
            const response = await fetch('assets/data/modules.json');
            this.modulesCache = await response.json();
            return this.modulesCache;
        } catch (e) {
            console.error("Erro ao carregar módulos:", e);
            return [];
        }
    }

    async getDayContent(moduleId) {
        // Carrega o JSON do módulo específico
        try {
            const response = await fetch(`assets/data/content/${moduleId}.json`);
            const data = await response.json();
            return data;
        } catch (e) {
            console.error(`Erro ao carregar conteúdo de ${moduleId}:`, e);
            return null;
        }
    }

    // --- User & Progress Logic ---

    registerUser(name) {
        this.state.user = {
            name: name,
            startDate: new Date().toISOString()
        };
        this.saveState();
    }

    getUser() { return this.state.user; }

    getUnlockStatus() {
        return {
            currentDay: this.state.progress.currentDay,
            unlockedDays: this.state.progress.unlockedDays,
            xp: this.state.progress.xp,
            level: this.state.progress.level
        };
    }

    isTaskCompleted(taskId) {
        return this.state.progress.completedTasks.includes(taskId);
    }

    completeTask(taskId, xpReward) {
        if (!this.isTaskCompleted(taskId)) {
            this.state.progress.completedTasks.push(taskId);
            this.state.progress.xp += xpReward;
            this.updateLevel();
            this.saveState();
            return true;
        }
        return false;
    }

    saveJournalEntry(dayId, text) {
        this.state.progress.journalEntries[dayId] = text;
        this.saveState();
    }

    getJournalEntry(dayId) {
        return this.state.progress.journalEntries[dayId] || "";
    }

    // Verifica se todas as tarefas de um dia foram completadas para liberar o próximo
    async checkDayCompletion(dayId, moduleId, totalTasksInDay) {
        // Lógica simples: conta quantas tarefas desse dia estão no array de completas
        // Nota: Isso requer que os IDs das tarefas contenham o ID do dia (ex: d1_t1)
        const completedCount = this.state.progress.completedTasks.filter(t => t.startsWith(`d${dayId}_`)).length;
        
        if (completedCount >= totalTasksInDay) {
            if (this.state.progress.unlockedDays === dayId) {
                this.state.progress.unlockedDays++;
                this.state.progress.currentDay++; // Avança o foco
                this.saveState();
                return { dayCompleted: true };
            }
        }
        return { dayCompleted: false, progress: completedCount / totalTasksInDay };
    }

    updateLevel() {
        // Nível sobe a cada 1000 XP (exponencial simplificado)
        const newLevel = Math.floor(this.state.progress.xp / 1000) + 1;
        if (newLevel > this.state.progress.level) {
            this.state.progress.level = newLevel;
            // Aqui poderia disparar um alerta visual
        }
    }
}

const db = new Database();
