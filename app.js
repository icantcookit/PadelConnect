// =================================================================================
// СИМУЛЯЦИЯ API БЭКЕНДА (для имитации работы с Google Apps Script)
// Этот слой полностью имитирует асинхронную работу с сервером.
// Для перехода на реальный бэкенд нужно заменить только этот объект.
// =================================================================================
const api = {
    _delay: 200, // Имитация задержки сети
    _data: {
        users: [],
        games: [],
        trainings: [],
    },

    // Инициализация данных из localStorage или создание тестовых данных
    async init() {
        console.log('API: Initializing data...');
        const storedData = localStorage.getItem('padelClubData');
        if (storedData) {
            this._data = JSON.parse(storedData);
        } else {
            // Создание тестовых данных при первом запуске
            this._data.users = [
                 { id: 1, name: "Иван", surname: "Петров", level: 3.5, availability: "ПН-ПТ 18-21", reliability: 4.8, telegram: "@ivan_padel", role: "user", matchesPlayed: 15, trainingsAttended: 8 },
                 { id: 2, name: "Мария", surname: "Сидорова", level: 2.5, availability: "СР/ПТ/ВС 19-21", reliability: 4.9, telegram: "@maria_sports", role: "user", matchesPlayed: 12, trainingsAttended: 5 },
                 { id: 3, name: "Алексей", surname: "Кузнецов", level: 4.0, availability: "ВТ/ЧТ/СБ 18-22", reliability: 4.7, telegram: "@admin", role: "admin", matchesPlayed: 25, trainingsAttended: 15 }
            ];
             this._data.games = [
                { id: 101, dateTime: new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 16), creatorId: 1, participants: [1, 2], minLevel: 2.5, maxLevel: 4.0, status: 'open', description: "Ищем еще двоих" },
                { id: 102, dateTime: new Date(Date.now() + 48 * 3600 * 1000).toISOString().slice(0, 16), creatorId: 3, participants: [3], minLevel: 3.5, maxLevel: 4.5, status: 'open', description: "" }
             ];
            this._save();
        }
        return new Promise(resolve => setTimeout(() => resolve(true), this._delay));
    },

    _save() {
        localStorage.setItem('padelClubData', JSON.stringify(this._data));
    },

    async getUsers() {
        return new Promise(resolve => setTimeout(() => resolve([...this._data.users]), this._delay));
    },
    
    async getUserByTelegram(telegram) {
        return new Promise(resolve => setTimeout(() => resolve(this._data.users.find(u => u.telegram === telegram)), this._delay));
    },

    async createUser(userData) {
        const newUser = {
            id: Date.now(),
            ...userData,
            reliability: 5.0, // Начальный рейтинг надежности
            role: 'user',
            matchesPlayed: 0,
            trainingsAttended: 0
        };
        this._data.users.push(newUser);
        this._save();
        return new Promise(resolve => setTimeout(() => resolve(newUser), this._delay));
    },

    async updateUser(userId, updates) {
        const userIndex = this._data.users.findIndex(u => u.id === userId);
        if (userIndex !== -1) {
            this._data.users[userIndex] = { ...this._data.users[userIndex], ...updates };
            this._save();
            return new Promise(resolve => setTimeout(() => resolve(this._data.users[userIndex]), this._delay));
        }
        return Promise.reject('User not found');
    },
    
    async deleteUser(userId) {
        const userIndex = this._data.users.findIndex(u => u.id === userId);
        if (userIndex !== -1) {
            this._data.users.splice(userIndex, 1);
            this._save();
            return new Promise(resolve => setTimeout(() => resolve({success: true}), this._delay));
        }
        return Promise.reject('User not found');
    },

    async getGames() {
        return new Promise(resolve => setTimeout(() => resolve([...this._data.games]), this._delay));
    },

    async createGame(gameData) {
        const newGame = { id: Date.now(), ...gameData, status: 'open' };
        this._data.games.push(newGame);
        this._save();
        return new Promise(resolve => setTimeout(() => resolve(newGame), this._delay));
    },
    
    async updateGame(gameId, updates) {
        const gameIndex = this._data.games.findIndex(g => g.id === gameId);
        if (gameIndex !== -1) {
            this._data.games[gameIndex] = { ...this._data.games[gameIndex], ...updates };
            this._save();
            return new Promise(resolve => setTimeout(() => resolve(this._data.games[gameIndex]), this._delay));
        }
        return Promise.reject('Game not found');
    },

    async deleteGame(gameId) {
        this._data.games = this._data.games.filter(g => g.id !== gameId);
        this._save();
        return new Promise(resolve => setTimeout(() => resolve({ success: true }), this._delay));
    },
    
    async getTrainings() {
         return new Promise(resolve => setTimeout(() => resolve([...this._data.trainings]), this._delay));
    },
    
    async createTraining(trainingData) {
        const newTraining = { id: Date.now(), ...trainingData, waitlist: [] };
        this._data.trainings.push(newTraining);
        this._save();
        return new Promise(resolve => setTimeout(() => resolve(newTraining), this._delay));
    },
    
     async updateTraining(trainingId, updates) {
        const trainingIndex = this._data.trainings.findIndex(t => t.id === trainingId);
        if (trainingIndex !== -1) {
            this._data.trainings[trainingIndex] = { ...this._data.trainings[trainingIndex], ...updates };
            this._save();
            return new Promise(resolve => setTimeout(() => resolve(this._data.trainings[trainingIndex]), this._delay));
        }
        return Promise.reject('Training not found');
    },
};

// =================================================================================
// ГЛОБАЛЬНОЕ СОСТОЯНИЕ ПРИЛОЖЕНИЯ
// =================================================================================
let state = {
    currentUser: null,
    users: [],
    games: [],
    trainings: [],
    isLoading: false,
};

const padelLevels = { "0": "Новичок", "1": "Начинающий", "2": "Базовый", "3": "Средний", "3.5": "Средний+", "4": "Продвинутый", "5": "Высокий", "6": "Эксперт", "7": "Профи" };
const trainingScheduleConfig = {
    fixedDays: [3, 5, 0], // Среда, Пятница, Воскресенье
    times: ["18:00", "19:00", "20:00"],
    coach: "Алексей",
    baseCost: 4000,
    maxParticipants: 4
};

// =================================================================================
// ИНИЦИАЛИЗАЦИЯ
// =================================================================================
document.addEventListener('DOMContentLoaded', initializeApp);

async function initializeApp() {
    setLoading(true);
    await api.init();
    
    setupEventListeners();
    populateLevelSelects();

    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
        state.currentUser = JSON.parse(storedUser);
        await loadInitialData();
        showMainApp();
    } else {
        showAuthModal();
    }
    setLoading(false);
}

async function loadInitialData() {
    setLoading(true);
    [state.users, state.games, state.trainings] = await Promise.all([
        api.getUsers(),
        api.getGames(),
        api.getTrainings()
    ]);
    setLoading(false);
}

// =================================================================================
// ОБРАБОТЧИКИ СОБЫТИЙ
// =================================================================================
function setupEventListeners() {
    document.getElementById('authForm').addEventListener('submit', handleAuth);
    document.getElementById('authToggle').addEventListener('click', toggleAuthMode);
    document.querySelectorAll('.nav-tab').forEach(tab => tab.addEventListener('click', e => switchSection(e.target.dataset.section)));
    document.getElementById('profileForm').addEventListener('submit', handleProfileUpdate);
    document.getElementById('createGameForm').addEventListener('submit', handleCreateGame);
    document.getElementById('createTrainingForm').addEventListener('submit', handleCreateTraining);
    document.querySelectorAll('.records-tab').forEach(tab => tab.addEventListener('click', e => switchRecordsTab(e.target.dataset.type)));
    document.querySelectorAll('.admin-tab').forEach(tab => tab.addEventListener('click', e => switchAdminTab(e.target.dataset.type)));
}

// =================================================================================
// АУТЕНТИФИКАЦИЯ
// =================================================================================
async function handleAuth(e) {
    e.preventDefault();
    setLoading(true);
    const telegram = document.getElementById('authTelegram').value.trim();
    if (!telegram.startsWith('@')) {
        showNotification('Telegram должен начинаться с @', 'error');
        setLoading(false);
        return;
    }
    
    const isRegister = !document.getElementById('registerFields').classList.contains('hidden');
    
    if (isRegister) {
        // Логика регистрации
        const name = document.getElementById('authName').value.trim();
        const surname = document.getElementById('authSurname').value.trim();
        const level = parseFloat(document.getElementById('authLevel').value);
        const availability = document.getElementById('authAvailability').value.trim();

        if (!name || !surname || !availability) {
            showNotification('Заполните все поля для регистрации', 'error');
            setLoading(false);
            return;
        }

        const existingUser = await api.getUserByTelegram(telegram);
        if (existingUser) {
            showNotification('Пользователь с таким Telegram уже существует', 'error');
            setLoading(false);
            return;
        }

        state.currentUser = await api.createUser({ name, surname, level, availability, telegram });
        localStorage.setItem('currentUser', JSON.stringify(state.currentUser));
        showNotification(`Добро пожаловать, ${state.currentUser.name}!`, 'success');

    } else {
        // Логика входа
        const user = await api.getUserByTelegram(telegram);
        if (user) {
            state.currentUser = user;
            localStorage.setItem('currentUser', JSON.stringify(state.currentUser));
            showNotification(`С возвращением, ${user.name}!`, 'success');
        } else {
            showNotification('Пользователь не найден. Пожалуйста, зарегистрируйтесь.', 'error');
            setLoading(false);
            return;
        }
    }
    
    await loadInitialData();
    hideAuthModal();
    showMainApp();
    setLoading(false);
}

window.logout = function() {
    state.currentUser = null;
    localStorage.removeItem('currentUser');
    document.getElementById('authForm').reset();
    document.querySelector('.admin-only').classList.add('hidden');
    showAuthModal();
    showNotification('Вы вышли из системы', 'info');
}

// =================================================================================
// РЕНДЕРИНГ И ОБНОВЛЕНИЕ UI
// =================================================================================
function showMainApp() {
    document.querySelector('.nav').style.display = 'block';
    document.querySelector('.main').style.display = 'block';
    document.getElementById('userGreeting').textContent = `Привет, ${state.currentUser.name}!`;

    if (state.currentUser.role === 'admin') {
        document.querySelector('.admin-only').classList.remove('hidden');
    }
    
    // Установка значения по умолчанию для фильтра игр
    document.getElementById('filterLevel').value = state.currentUser.level;
    
    updateAllSections();
}

function updateAllSections() {
    updateDashboard();
    updateProfile();
    updateMyRecords();
    updateTrainingSchedule();
    updateOpenGamesList();
    if(state.currentUser.role === 'admin') {
        updateAdminPanel();
    }
}

function updateDashboard() {
    document.getElementById('activePlayersCount').textContent = state.users.length;
    const openGames = state.games.filter(game => game.status === 'open' && new Date(game.dateTime) > new Date());
    document.getElementById('openGamesCount').textContent = openGames.length;
    document.getElementById('totalTrainingsCount').textContent = state.trainings.length;
}

function updateProfile() {
    const user = state.currentUser;
    document.getElementById('profileName').value = user.name;
    document.getElementById('profileSurname').value = user.surname;
    document.getElementById('profileTelegram').value = user.telegram;
    document.getElementById('profileLevel').value = user.level;
    document.getElementById('profileAvailability').value = user.availability;
    document.getElementById('profileReliability').textContent = `${user.reliability.toFixed(1)} ⭐`;
    document.getElementById('profileMatches').textContent = user.matchesPlayed;
    document.getElementById('profileTrainings').textContent = user.trainingsAttended;
}

window.searchOpenGames = function() {
    const filterDate = document.getElementById('filterDate').value;
    const filterLevel = parseFloat(document.getElementById('filterLevel').value);
    updateOpenGamesList({ date: filterDate, level: filterLevel });
}

window.resetSearch = function() {
    document.getElementById('filterDate').value = '';
    document.getElementById('filterLevel').value = state.currentUser.level;
    updateOpenGamesList();
}

function updateOpenGamesList(filters = {}) {
    const openGamesListContainer = document.getElementById('openGamesList');
    
    let openGames = state.games.filter(game => game.status === 'open' && new Date(game.dateTime) > new Date());

    // Применение фильтров
    if (filters.date) {
        openGames = openGames.filter(game => game.dateTime.startsWith(filters.date));
    }
    if (filters.level) {
        openGames = openGames.filter(game => filters.level >= game.minLevel && filters.level <= game.maxLevel);
    }
    
    if (openGames.length === 0) {
        openGamesListContainer.innerHTML = `<div class="empty-state"><h3>Нет подходящих открытых игр</h3><p>Создайте свою или сбросьте фильтры.</p></div>`;
        return;
    }

    openGamesListContainer.innerHTML = openGames.map(game => {
        const isParticipant = game.participants.includes(state.currentUser.id);
        const date = new Date(game.dateTime);
        const participantsNames = game.participants.map(pId => {
            const user = state.users.find(u => u.id === pId);
            return user ? `${user.name} ${user.surname[0]}.` : '...';
        }).join(', ');

        const slotsNeeded = 4 - game.participants.length;

        // Проверка, подходит ли текущий пользователь по уровню
        const canJoinByLevel = state.currentUser.level >= game.minLevel && state.currentUser.level <= game.maxLevel;

        let actionButton;
        if (isParticipant) {
            actionButton = `<button class="btn btn--sm btn--secondary" disabled>Вы участвуете</button>`;
        } else if (canJoinByLevel) {
            actionButton = `<button class="btn btn--sm btn--primary" onclick="joinGame(${game.id})">Присоединиться</button>`;
        } else {
            actionButton = `<button class="btn btn--sm btn--secondary" disabled title="Ваш уровень не соответствует требованиям">Уровень не подходит</button>`;
        }

        return `
            <div class="game-card">
                <div class="game-card__header">
                    <h4>${date.toLocaleDateString('ru-RU')} в ${date.toLocaleTimeString('ru-RU', {hour: '2-digit', minute:'2-digit'})}</h4>
                    <span class="game-card__level">Уровень: ${game.minLevel} - ${game.maxLevel}</span>
                </div>
                <div class="game-card__body">
                    <p><strong>Участники:</strong> ${participantsNames}</p>
                    <p><strong>Нужно еще:</strong> <span class="slots-needed">${slotsNeeded}</span> ${slotsNeeded > 1 ? 'игрока' : 'игрок'}</p>
                    ${game.description ? `<p class="game-card__description"><i>${game.description}</i></p>` : ''}
                </div>
                <div class="game-card__footer">
                    ${actionButton}
                </div>
            </div>
        `;
    }).join('');
}


function updateTrainingSchedule() {
    const scheduleContainer = document.getElementById('trainingSchedule');
    const availableTrainings = state.trainings.filter(t => new Date(t.dateTime) > new Date()).sort((a,b) => new Date(a.dateTime) - new Date(b.dateTime));
    
    if (availableTrainings.length === 0) {
        scheduleContainer.innerHTML = `<div class="empty-state"><p>Нет запланированных тренировок.</p></div>`;
        return;
    }

    scheduleContainer.innerHTML = availableTrainings.map(training => {
        const isFull = training.participants.length >= training.maxParticipants;
        const isParticipant = training.participants.includes(state.currentUser.id);
        const isInWaitlist = training.waitlist.includes(state.currentUser.id);
        const date = new Date(training.dateTime);
        const cost = Math.ceil(trainingScheduleConfig.baseCost / (training.participants.length || 1));

        let actionButton;
        if (isParticipant) {
            actionButton = `<button class="btn btn--sm btn--secondary" onclick="leaveTraining(${training.id})">Отменить запись</button>`;
        } else if (isInWaitlist) {
            actionButton = `<button class="btn btn--sm btn--secondary" onclick="leaveWaitlist(${training.id})">Выйти из очереди</button>`;
        } else if (isFull) {
            actionButton = `<button class="btn btn--sm btn--primary" onclick="joinWaitlist(${training.id})">Записаться в очередь</button>`;
        } else {
            actionButton = `<button class="btn btn--sm btn--primary" onclick="joinTraining(${training.id})">Записаться</button>`;
        }

        return `
            <div class="training-slot ${isFull ? 'full' : ''}">
                <div class="training-details">
                    <h4>${date.toLocaleDateString('ru-RU')} в ${date.toLocaleTimeString('ru-RU', {hour: '2-digit', minute:'2-digit'})}</h4>
                    <p>Тренер: ${training.coach || 'Самостоятельная'}</p>
                    <p>Стоимость: ~${cost}₽ с человека</p>
                    <div class="participant-count">Участников: ${training.participants.length}/${training.maxParticipants}</div>
                    ${training.waitlist.length > 0 ? `<div class="waitlist-count">В очереди: ${training.waitlist.length}</div>` : ''}
                </div>
                ${actionButton}
            </div>
        `;
    }).join('');
}

function updateMyRecords() {
    // Игры
    const myGamesContainer = document.getElementById('myGames');
    const myGames = state.games.filter(g => g.participants.includes(state.currentUser.id));
    if (myGames.length > 0) {
        myGamesContainer.innerHTML = myGames.map(game => {
             const date = new Date(game.dateTime);
             // Проверка, можно ли отменить игру без штрафа (более чем за 4 часа)
             const canCancelFreely = (date.getTime() - Date.now()) > 4 * 60 * 60 * 1000;
             const participantsNames = game.participants
                .map(pId => state.users.find(u => u.id === pId)?.name || '...')
                .join(', ');

             return `
                <div class="record-item">
                    <div class="record-info">
                        <h4>Игра ${game.status === 'full' ? '(Состав набран)' : ''}</h4>
                        <p><strong>Дата:</strong> ${date.toLocaleString('ru-RU')}</p>
                        <p><strong>Участники:</strong> ${participantsNames}</p>
                    </div>
                    <button class="btn btn--sm btn--outline" onclick="leaveGame(${game.id}, ${canCancelFreely})">Покинуть игру</button>
                </div>
             `
        }).join('');
    } else {
         myGamesContainer.innerHTML = `<div class="empty-state"><p>Вы не участвуете в играх.</p></div>`;
    }

    // Тренировки
    const myTrainingsContainer = document.getElementById('myTrainings');
    const myTrainings = state.trainings.filter(t => t.participants.includes(state.currentUser.id));
    if (myTrainings.length > 0) {
        myTrainingsContainer.innerHTML = myTrainings.map(training => {
            const date = new Date(training.dateTime);
            return `
                 <div class="record-item">
                    <div class="record-info">
                        <h4>Тренировка с ${training.coach || '...'}</h4>
                        <p>${date.toLocaleString('ru-RU')}</p>
                    </div>
                    <button class="btn btn--sm btn--outline" onclick="leaveTraining(${training.id})">Отменить</button>
                </div>
            `;
        }).join('');
    } else {
        myTrainingsContainer.innerHTML = `<div class="empty-state"><p>Вы не записаны на тренировки.</p></div>`;
    }
}

function updateAdminPanel() {
    const usersListContainer = document.getElementById('usersListAdmin');
    usersListContainer.innerHTML = state.users.map(user => `
        <div class="user-card">
            <div class="user-info">
                <h4>${user.name} ${user.surname} (${user.telegram})</h4>
                <p>Уровень: ${user.level} | Надежность: ${user.reliability.toFixed(1)} | Роль: ${user.role}</p>
            </div>
            <div class="user-actions">
                <button class="btn btn--sm btn--secondary" onclick="editUserPrompt(${user.id})">Изм.</button>
                <button class="btn btn--sm btn--outline" onclick="deleteUser(${user.id})">Удл.</button>
            </div>
        </div>
    `).join('');
}


// =================================================================================
// ЛОГИКА ПРИЛОЖЕНИЯ
// =================================================================================
async function handleProfileUpdate(e) {
    e.preventDefault();
    setLoading(true);
    const updates = {
        name: document.getElementById('profileName').value.trim(),
        surname: document.getElementById('profileSurname').value.trim(),
        level: parseFloat(document.getElementById('profileLevel').value),
        availability: document.getElementById('profileAvailability').value.trim(),
    };
    
    try {
        const updatedUser = await api.updateUser(state.currentUser.id, updates);
        state.currentUser = updatedUser;
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        
        // Обновляем пользователя в общем списке
        const userIndex = state.users.findIndex(u => u.id === updatedUser.id);
        if(userIndex !== -1) state.users[userIndex] = updatedUser;

        showNotification('Профиль обновлен успешно', 'success');
        document.getElementById('userGreeting').textContent = `Привет, ${state.currentUser.name}!`;
    } catch(error) {
        showNotification('Ошибка обновления профиля', 'error');
    } finally {
        setLoading(false);
    }
}

async function handleCreateGame(e) {
    e.preventDefault();
    setLoading(true);
    
    const gameData = {
        dateTime: document.getElementById('newGameDateTime').value,
        creatorId: state.currentUser.id,
        participants: [state.currentUser.id],
        minLevel: parseFloat(document.getElementById('gameMinLevel').value),
        maxLevel: parseFloat(document.getElementById('gameMaxLevel').value),
        description: document.getElementById('newGameDescription').value.trim(),
    };
    
    if (gameData.minLevel > gameData.maxLevel) {
        showNotification('Минимальный уровень не может быть больше максимального', 'error');
        setLoading(false);
        return;
    }

    try {
        const newGame = await api.createGame(gameData);
        state.games.push(newGame);
        showNotification('Игра успешно создана!', 'success');
        updateAllSections();
        document.getElementById('createGameForm').reset();
    } catch(error) {
        showNotification('Не удалось создать игру', 'error');
    } finally {
        setLoading(false);
    }
}

async function handleCreateTraining(e) {
     e.preventDefault();
     setLoading(true);
     const trainingData = {
        dateTime: document.getElementById('customTrainingDateTime').value,
        maxParticipants: parseInt(document.getElementById('customTrainingParticipants').value, 10),
        participants: [state.currentUser.id],
        coach: 'Самостоятельная'
     };
     try {
        const newTraining = await api.createTraining(trainingData);
        state.trainings.push(newTraining);
        showNotification('Тренировка успешно создана', 'success');
        updateTrainingSchedule();
        updateMyRecords();
        document.getElementById('createTrainingForm').reset();
     } catch (error) {
        showNotification('Ошибка при создании тренировки', 'error');
     } finally {
        setLoading(false);
     }
}

window.joinGame = async function(gameId) {
    setLoading(true);
    const game = state.games.find(g => g.id === gameId);
    if (!game) {
        showNotification('Игра не найдена', 'error');
        setLoading(false);
        return;
    }

    if (game.participants.length >= 4) {
        showNotification('В этой игре уже достаточно участников', 'warning');
        setLoading(false);
        return;
    }

    game.participants.push(state.currentUser.id);
    const updates = { participants: game.participants };
    if (game.participants.length === 4) {
        updates.status = 'full';
        showNotification('Команда собрана! Игра укомплектована.', 'success');
    }

    try {
        await api.updateGame(gameId, updates);
        showNotification('Вы присоединились к игре!', 'success');
        updateAllSections();
    } catch (error) {
        showNotification('Не удалось присоединиться к игре', 'error');
        game.participants.pop(); // Откатываем локальное изменение
    } finally {
        setLoading(false);
    }
};

window.leaveGame = async function(gameId, canCancelFreely) {
    if (!canCancelFreely) {
        if (!confirm('Отмена менее чем за 4 часа до начала повлияет на ваш рейтинг надежности. Продолжить?')) {
            return;
        }
        // Снижаем рейтинг
        const newReliability = Math.max(0, state.currentUser.reliability - 0.5);
        await api.updateUser(state.currentUser.id, { reliability: newReliability });
        state.currentUser.reliability = newReliability;
        localStorage.setItem('currentUser', JSON.stringify(state.currentUser));
        updateProfile();
        showNotification('Ваш рейтинг надежности был снижен', 'warning');
    }
    
    setLoading(true);
    const game = state.games.find(g => g.id === gameId);
    if (!game) {
        setLoading(false);
        return;
    }
    
    game.participants = game.participants.filter(pId => pId !== state.currentUser.id);

    // Если участников не осталось, удаляем игру. Иначе - обновляем.
    if (game.participants.length === 0) {
        try {
            await api.deleteGame(gameId);
            state.games = state.games.filter(g => g.id !== gameId);
            showNotification('Вы покинули игру, и она была удалена', 'success');
            updateAllSections();
        } catch(error) {
            showNotification('Ошибка при удалении игры', 'error');
        }
    } else {
        const updates = { participants: game.participants, status: 'open' };
         try {
            await api.updateGame(gameId, updates);
            showNotification('Вы покинули игру', 'success');
            updateAllSections();
        } catch(error) {
            showNotification('Ошибка при выходе из игры', 'error');
        }
    }

    setLoading(false);
}

window.joinTraining = async function(trainingId) {
    setLoading(true);
    const training = state.trainings.find(t => t.id === trainingId);
    if (training && training.participants.length < training.maxParticipants) {
        training.participants.push(state.currentUser.id);
        try {
            await api.updateTraining(trainingId, { participants: training.participants });
            showNotification('Вы успешно записаны на тренировку!', 'success');
            updateTrainingSchedule();
            updateMyRecords();
        } catch(error) {
            showNotification('Ошибка записи на тренировку', 'error');
            training.participants.pop(); // Откатываем изменение в локальном состоянии
        }
    }
    setLoading(false);
}

window.leaveTraining = async function(trainingId) {
    setLoading(true);
    const training = state.trainings.find(t => t.id === trainingId);
    if (training) {
        const initialParticipants = [...training.participants];
        training.participants = training.participants.filter(pId => pId !== state.currentUser.id);
        
        // Логика для waitlist: если кто-то был в очереди, добавляем его в участники
        if (training.waitlist && training.waitlist.length > 0) {
            const nextInLineId = training.waitlist.shift(); // Берем первого из очереди
            training.participants.push(nextInLineId);
            const nextUser = state.users.find(u => u.id === nextInLineId);
            showNotification(`Игрок ${nextUser?.name} из списка ожидания добавлен на тренировку!`, 'info');
            // Здесь в реальном приложении нужно отправить уведомление игроку nextInLineId
        }

        try {
            await api.updateTraining(trainingId, { participants: training.participants, waitlist: training.waitlist });
            showNotification('Запись на тренировку отменена', 'success');
            updateTrainingSchedule();
            updateMyRecords();
        } catch(error) {
            showNotification('Ошибка отмены записи', 'error');
            training.participants = initialParticipants; // Откатываем
        }
    }
    setLoading(false);
}

window.joinWaitlist = async function(trainingId) {
    setLoading(true);
    const training = state.trainings.find(t => t.id === trainingId);
    if (training && !training.waitlist.includes(state.currentUser.id)) {
        training.waitlist.push(state.currentUser.id);
        try {
            await api.updateTraining(trainingId, { waitlist: training.waitlist });
            showNotification('Вы добавлены в список ожидания!', 'success');
            updateTrainingSchedule();
        } catch (error) {
            showNotification('Ошибка при добавлении в очередь', 'error');
            training.waitlist.pop();
        }
    }
    setLoading(false);
}

window.leaveWaitlist = async function(trainingId) {
    setLoading(true);
    const training = state.trainings.find(t => t.id === trainingId);
    if (training) {
        training.waitlist = training.waitlist.filter(id => id !== state.currentUser.id);
         try {
            await api.updateTraining(trainingId, { waitlist: training.waitlist });
            showNotification('Вы удалены из списка ожидания', 'success');
            updateTrainingSchedule();
        } catch (error) {
            showNotification('Ошибка при удалении из очереди', 'error');
        }
    }
    setLoading(false);
}

// Функции администратора
window.editUserPrompt = async function(userId) {
    const user = state.users.find(u => u.id === userId);
    if (!user) return;
    
    const newLevel = prompt(`Введите новый уровень для ${user.name} ${user.surname} (текущий: ${user.level}):`, user.level);
    const newRole = prompt(`Введите новую роль (user/admin) для ${user.name} (текущая: ${user.role}):`, user.role);

    if (newLevel !== null && newRole !== null) {
        setLoading(true);
        try {
            await api.updateUser(userId, { level: parseFloat(newLevel), role: newRole });
            state.users = await api.getUsers(); // Обновляем список всех пользователей
            showNotification('Данные пользователя обновлены', 'success');
            updateAdminPanel();
        } catch(error) {
            showNotification('Ошибка обновления', 'error');
        } finally {
            setLoading(false);
        }
    }
}

window.deleteUser = async function(userId) {
    if(userId === state.currentUser.id) {
        showNotification('Нельзя удалить самого себя', 'error');
        return;
    }
    if (confirm('Вы уверены, что хотите удалить этого пользователя? Это действие необратимо.')) {
        setLoading(true);
        try {
            await api.deleteUser(userId);
            state.users = state.users.filter(u => u.id !== userId);
            showNotification('Пользователь успешно удален', 'success');
            updateAdminPanel();
        } catch(error) {
             showNotification('Ошибка удаления пользователя', 'error');
        } finally {
            setLoading(false);
        }
    }
}

window.generateWeeklyTrainings = async function() {
    if (!confirm('Создать стандартное расписание тренировок на следующую неделю?')) return;
    setLoading(true);
    const today = new Date();
    const promises = [];
    for (let i = 1; i <= 7; i++) {
        const nextDay = new Date(today);
        nextDay.setDate(today.getDate() + i);
        if (trainingScheduleConfig.fixedDays.includes(nextDay.getDay())) {
            trainingScheduleConfig.times.forEach(time => {
                const [hours, minutes] = time.split(':');
                const trainingDateTime = new Date(nextDay);
                trainingDateTime.setHours(hours, minutes, 0, 0);

                const promise = api.createTraining({
                    dateTime: trainingDateTime.toISOString().slice(0, 16),
                    maxParticipants: trainingScheduleConfig.maxParticipants,
                    participants: [],
                    coach: trainingScheduleConfig.coach,
                });
                promises.push(promise);
            });
        }
    }

    try {
        const newTrainings = await Promise.all(promises);
        state.trainings.push(...newTrainings);
        showNotification(`Создано ${newTrainings.length} новых тренировок`, 'success');
        updateTrainingSchedule();
    } catch(error) {
        showNotification('Ошибка при генерации расписания', 'error');
    } finally {
        setLoading(false);
    }
}

// =================================================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// =================================================================================
function showAuthModal() {
    document.getElementById('authModal').style.display = 'flex';
    document.querySelector('.nav').style.display = 'none';
    document.querySelector('.main').style.display = 'none';
}

function hideAuthModal() {
    document.getElementById('authModal').style.display = 'none';
}

function toggleAuthMode() {
    const registerFields = document.getElementById('registerFields');
    const isLogin = registerFields.classList.toggle('hidden');
    document.getElementById('authTitle').textContent = isLogin ? 'Вход в систему' : 'Регистрация';
    document.getElementById('authSubmit').textContent = isLogin ? 'Войти' : 'Зарегистрироваться';
    document.getElementById('authToggle').textContent = isLogin ? 'Регистрация' : 'Вход';
}

function switchSection(sectionName) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById(sectionName)?.classList.add('active');
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`.nav-tab[data-section="${sectionName}"]`)?.classList.add('active');

    // Загрузка/обновление данных для активной секции
    switch(sectionName) {
        case 'dashboard': updateDashboard(); break;
        case 'findgame': updateOpenGamesList(); break;
        case 'training': updateTrainingSchedule(); break;
        case 'myrecords': updateMyRecords(); break;
        case 'profile': updateProfile(); break;
        case 'admin': updateAdminPanel(); break;
    }
}

function switchRecordsTab(type) {
    document.querySelectorAll('.records-tab').forEach(t=>t.classList.remove('active'));
    document.querySelector(`.records-tab[data-type="${type}"]`).classList.add('active');
    document.querySelectorAll('.records-section').forEach(s=>s.classList.remove('active'));
    document.getElementById(type === 'games' ? 'myGames' : 'myTrainings').classList.add('active');
}

function switchAdminTab(type) {
    document.querySelectorAll('.admin-tab').forEach(t=>t.classList.remove('active'));
    document.querySelector(`.admin-tab[data-type="${type}"]`).classList.add('active');
    document.querySelectorAll('.admin-section').forEach(s=>s.classList.remove('active'));
    document.getElementById(type === 'users' ? 'adminUsers' : 'adminSchedule').classList.add('active');
}

function setLoading(isLoading) {
    state.isLoading = isLoading;
    document.body.classList.toggle('loading', isLoading);
}

function showNotification(message, type = 'info') {
    const container = document.getElementById('notifications');
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    container.appendChild(notification);
    setTimeout(() => notification.remove(), 4000);
}

function populateLevelSelects() {
    const selects = document.querySelectorAll('#authLevel, #profileLevel, #filterLevel, #gameMinLevel, #gameMaxLevel');
    let options = '';
    for (const level in padelLevels) {
        options += `<option value="${level}">${level} - ${padelLevels[level]}</option>`;
    }
    selects.forEach(select => select.innerHTML = options);
}
