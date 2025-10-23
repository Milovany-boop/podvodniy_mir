// main.js - основной файл инициализации приложения

// Глобальные переменные (убрали currentUser - он теперь в auth.js)
const endTime = new Date('2026-01-01T00:00:00+07:00'); // 01.01.2026 00:00 по Новосибирску

// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM загружен, инициализация приложения...');
    
    // Инициализируем Firebase
    if (initializeFirebase()) {
        console.log('Firebase успешно инициализирован');
    } else {
        console.error('Ошибка инициализации Firebase');
        showMessage('Ошибка подключения к базе данных', 'error');
    }
    
    // Инициализируем аутентификацию
    initializeAuth();
    
    // Инициализируем UI
    initializeUI();
    
    // Инициализируем админ-панель
    initializeAdminPanel();
    
    // Запускаем таймер
    updateTimer();
    setInterval(updateTimer, 1000);
    
    console.log('Приложение полностью инициализировано');
});

// Таймер обратного отсчета
function updateTimer() {
    const timerElement = document.getElementById('timer-text');
    if (!timerElement) return;
    
    const now = new Date();
    // Конвертируем в Новосибирское время (UTC+7)
    const nowNovosibirsk = new Date(now.getTime() + (7 * 60 * 60 * 1000));
    const timeLeft = endTime - nowNovosibirsk;
    
    if (timeLeft <= 0) {
        timerElement.textContent = 'Голосование завершено!';
        disableVoting();
        return;
    }
    
    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
    
    if (days > 0) {
        timerElement.textContent = `${days}д ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
        timerElement.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
}

// Отключение голосования при завершении
function disableVoting() {
    document.querySelectorAll('.view-nominees-btn, .modal-vote-btn').forEach(btn => {
        btn.disabled = true;
        btn.style.opacity = '0.6';
        btn.style.cursor = 'not-allowed';
    });
}

// Глобальная функция для показа сообщений
function showMessage(text, type) {
    const messageEl = document.getElementById('message');
    if (!messageEl) {
        console.error('Элемент для сообщений не найден');
        return;
    }
    
    messageEl.textContent = text;
    messageEl.className = `message ${type}`;
    messageEl.classList.remove('hidden');
    
    setTimeout(() => {
        messageEl.classList.add('hidden');
    }, 4000);
}

// Глобальная функция для обновления статуса Firebase
function updateFirebaseStatus(status, message) {
    const statusElement = document.getElementById('firebase-status');
    if (statusElement) {
        statusElement.innerHTML = `<i class="fas fa-database ${status}"></i><span>${message}</span>`;
        statusElement.className = `firebase-status ${status}`;
    }
}