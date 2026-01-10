const DB_NAME = 'NeuroProtocol_DB';

class Database {
    constructor() {
        this.init();
    }

    init() {
        if (!localStorage.getItem(DB_NAME)) {
            // Inicialização do "Banco de Dados" no primeiro acesso
            const initialState = {
                user: null, // { name, startDate, level }
                progress: {
                    currentDay: 1,
                    completedChallenges: [], // IDs dos desafios
                    xp: 0,
                    level: 1,
                    unlockedModules: ['modulo_01']
                },
                settings: {
                    theme: 'dark'
                }
            };
            this.saveState(initialState);
            console.log('Database initialized.');
        }
    }

    getState() {
        return JSON.parse(localStorage.getItem(DB_NAME));
    }

    saveState(state) {
        localStorage.setItem(DB_NAME, JSON.stringify(state));
    }

    // Métodos de Usuário
    registerUser(name) {
        const state = this.getState();
        state.user = {
            name: name,
            startDate: new Date().toISOString()
        };
        this.saveState(state);
        return state.user;
    }

    getUser() {
        return this.getState().user;
    }

    // Métodos de Progresso
    getProgress() {
        return this.getState().progress;
    }

    completeChallenge(challengeId, xpReward) {
        const state = this.getState();
        if (!state.progress.completedChallenges.includes(challengeId)) {
            state.progress.completedChallenges.push(challengeId);
            state.progress.xp += xpReward;
            
            // Lógica simples de Level Up (a cada 500xp)
            const newLevel = Math.floor(state.progress.xp / 500) + 1;
            if (newLevel > state.progress.level) {
                state.progress.level = newLevel;
                // Lógica futura: Desbloquear módulos baseados no nível
            }
            
            this.saveState(state);
            return { success: true, newXp: state.progress.xp, level: state.progress.level };
        }
        return { success: false, message: 'Já completado' };
    }

    checkDayUpdate() {
        const state = this.getState();
        const start = new Date(state.user.startDate);
        const now = new Date();
        
        // Calcula a diferença em dias
        const diffTime = Math.abs(now - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        
        // Se o cálculo de dias reais for maior que o dia atual registrado, avança
        // (Nota: Em um app real, faríamos validações mais rígidas)
        if (diffDays > state.progress.currentDay) {
            state.progress.currentDay = diffDays;
            this.saveState(state);
        }
        return state.progress.currentDay;
    }
}

const db = new Database();
