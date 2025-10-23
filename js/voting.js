// voting.js - система голосования с Firebase
function initializeVoting() {
    console.log('Инициализация системы голосования...');
    
    // Загружаем голоса пользователя и рендерим номинации
    loadUserVotesAndRender();
}

async function loadUserVotesAndRender() {
    try {
        const userVotes = await getCurrentUserVotes();
        renderNominations(userVotes);
    } catch (error) {
        console.error('Ошибка загрузки голосов:', error);
        showMessage('Ошибка загрузки данных', 'error');
    }
}

function renderNominations(userVotes = {}) {
    console.log('Рендеринг номинаций...');
    const container = document.getElementById('nominations-container');
    if (!container) {
        console.error('Контейнер номинаций не найден!');
        return;
    }
    
    container.innerHTML = '';
    
    nominations.forEach(nomination => {
        const hasVoted = userVotes && userVotes[nomination.id];
        const currentVote = hasVoted ? userVotes[nomination.id] : null;
        
        const card = document.createElement('div');
        card.className = `nomination-card ${hasVoted ? 'voted-card' : ''}`;
        card.setAttribute('data-category', nomination.id);
        
        card.innerHTML = `
            <h2 class="nomination-title">${nomination.title}</h2>
            <p class="nomination-description">${nomination.description}</p>
            <div class="nomination-status">
                ${hasVoted ? 
                    `<span class="voted-text"><i class="fas fa-check"></i> Вы проголосовали за: ${currentVote.nomineeName}</span>` :
                    '<span class="not-voted-text"><i class="fas fa-vote-yea"></i> Ожидает вашего голоса</span>'
                }
            </div>
            <button class="view-nominees-btn ocean-btn" data-id="${nomination.id}">
                <i class="fas fa-users"></i>
                ${hasVoted ? 'Изменить голос' : 'Посмотреть номинантов'}
            </button>
        `;
        
        container.appendChild(card);
        
        // Обработчик для кнопки
        const viewBtn = card.querySelector('.view-nominees-btn');
        viewBtn.addEventListener('click', function() {
            openNominationModal(nomination.id, userVotes);
        });
    });
    
    console.log('Номинации отрендерены');
}

function openNominationModal(nominationId, userVotes = {}) {
    console.log('Открытие модального окна для номинации:', nominationId);
    
    const nomination = nominations.find(n => n.id === nominationId);
    if (!nomination) {
        console.error('Номинация не найдена:', nominationId);
        return;
    }
    
    const modal = document.getElementById('nomination-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalDescription = document.getElementById('modal-description');
    const modalNominees = document.getElementById('modal-nominees');
    
    if (!modal || !modalTitle || !modalDescription || !modalNominees) {
        console.error('Элементы модального окна не найдены!');
        return;
    }
    
    const currentVote = userVotes[nominationId];
    
    modalTitle.innerHTML = `<i class="fas fa-award"></i> ${nomination.title}`;
    modalDescription.textContent = nomination.description;
    modalNominees.innerHTML = '';
    
    // Добавляем номинантов
    nomination.nominees.forEach(nominee => {
        const isVotedFor = currentVote && currentVote.nomineeId === nominee.id;
        
        const nomineeElement = document.createElement('div');
        nomineeElement.className = 'modal-nominee';
        nomineeElement.innerHTML = `
            <div class="nominee-image-container">
                <img src="${nominee.image}" alt="${nominee.name}" class="modal-nominee-image" 
                     onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTI3OCIgaGVpZ2h0PSIxMjc4IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMjc4IiBoZWlnaHQ9IjEyNzgiIGZpbGw9IiMyYzJjMmMiLz48dGV4dCB4PSI2MzkiIHk9IjY1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjQ4IiBmaWxsPSIjODg4ODg4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iMC4zNWVtIj7QndC+INC40LzQtdC90Lg8L3RleHQ+PC9zdmc+'">
            </div>
            <h3 class="modal-nominee-name">${nominee.name}</h3>
            <button class="modal-vote-btn ${isVotedFor ? 'voted' : ''}" 
                    data-id="${nominee.id}">
                <i class="fas ${isVotedFor ? 'fa-check' : 'fa-vote-yea'}"></i>
                ${isVotedFor ? 'Ваш выбор' : 'Голосовать'}
            </button>
        `;
        modalNominees.appendChild(nomineeElement);
        
        // Обработчик голосования
        const voteBtn = nomineeElement.querySelector('.modal-vote-btn');
        voteBtn.addEventListener('click', async function() {
            const success = await submitVote(nominationId, nominee.id, nominee.name);
            if (success) {
                closeNominationModal();
                // Перезагружаем голоса и обновляем интерфейс
                await loadUserVotesAndRender();
            }
        });
    });
    
    modal.classList.remove('hidden');
    document.getElementById('overlay').classList.remove('hidden');
}

async function submitVote(nominationId, nomineeId, nomineeName) {
    if (!firebase.auth().currentUser) {
        showMessage('Сначала войдите в систему', 'error');
        return false;
    }
    
    try {
        showMessage('Сохранение голоса...', 'info');
        const success = await saveVote(nominationId, nomineeId, nomineeName);
        
        if (success) {
            showMessage(`Вы проголосовали за ${nomineeName} в номинации "${getNominationTitle(nominationId)}"`, 'success');
            return true;
        } else {
            showMessage('Ошибка при сохранении голоса', 'error');
            return false;
        }
    } catch (error) {
        console.error('Ошибка голосования:', error);
        showMessage('Ошибка при сохранении голоса', 'error');
        return false;
    }
}

function getNominationTitle(nominationId) {
    const nomination = nominations.find(n => n.id === nominationId);
    return nomination ? nomination.title : 'Неизвестная номинация';
}

function closeNominationModal() {
    const modal = document.getElementById('nomination-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
    closeOverlay();
}

function closeOverlay() {
    const overlay = document.getElementById('overlay');
    if (overlay) {
        overlay.classList.add('hidden');
    }
}

// Вспомогательная функция для показа сообщений
function showMessage(text, type) {
    const messageEl = document.getElementById('message');
    if (!messageEl) {
        // Создаем элемент если его нет
        const messageDiv = document.createElement('div');
        messageDiv.id = 'message';
        messageDiv.className = `message hidden`;
        document.querySelector('.voting-interface').insertBefore(messageDiv, document.querySelector('.nominations-main'));
    }
    
    const finalMessageEl = document.getElementById('message');
    finalMessageEl.textContent = text;
    finalMessageEl.className = `message ${type}`;
    finalMessageEl.classList.remove('hidden');
    
    setTimeout(() => {
        finalMessageEl.classList.add('hidden');
    }, 4000);
}
// voting.js - функции для голосования
function initializeVoting() {
    console.log('Инициализация системы голосования...');
    renderNominations();
}

function renderNominations() {
    const container = document.getElementById('nominations-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    nominations.forEach(nomination => {
        const card = createNominationCard(nomination);
        container.appendChild(card);
    });
}

function createNominationCard(nomination) {
    const card = document.createElement('div');
    card.className = 'nomination-card';
    card.setAttribute('data-category', nomination.id);
    
    card.innerHTML = `
        <div class="nomination-title">${nomination.title}</div>
        <div class="nomination-description">${nomination.description}</div>
        <button class="view-nominees-btn ocean-btn" onclick="openNominationModal(${nomination.id})">
            <i class="fas fa-users"></i> Посмотреть номинантов
        </button>
    `;
    
    return card;
}

function openNominationModal(nominationId) {
    const nomination = nominations.find(n => n.id === nominationId);
    if (!nomination) return;
    
    document.getElementById('modal-title').innerHTML = `<i class="fas fa-award"></i> ${nomination.title}`;
    document.getElementById('modal-description').textContent = nomination.description;
    
    const nomineesContainer = document.getElementById('modal-nominees');
    nomineesContainer.innerHTML = '';
    
    nomination.nominees.forEach(nominee => {
        const nomineeElement = document.createElement('div');
        nomineeElement.className = 'modal-nominee';
        nomineeElement.innerHTML = `
            <div class="nominee-image-container">
                <img src="${nominee.image}" alt="${nominee.name}" class="modal-nominee-image" 
                     onerror="this.src='images/placeholder.jpg'">
            </div>
            <div class="modal-nominee-name">${nominee.name}</div>
            <button class="modal-vote-btn" onclick="castVote(${nomination.id}, ${nominee.id}, '${nominee.name}')">
                <i class="fas fa-vote-yea"></i> Голосовать
            </button>
        `;
        nomineesContainer.appendChild(nomineeElement);
    });
    
    document.getElementById('overlay').classList.remove('hidden');
    document.getElementById('nomination-modal').classList.remove('hidden');
}

function closeNominationModal() {
    document.getElementById('overlay').classList.add('hidden');
    document.getElementById('nomination-modal').classList.add('hidden');
}

// ДОБАВЛЯЕМ ФУНКЦИЮ CASTVOTE
async function castVote(nominationId, nomineeId, nomineeName) {
    if (!firebase.auth().currentUser) {
        showMessage('Необходимо войти в систему', 'error');
        return;
    }
    
    try {
        showMessage('Сохранение голоса...', 'info');
        const success = await saveVote(nominationId, nomineeId, nomineeName);
        
        if (success) {
            showMessage('Ваш голос сохранен!', 'success');
            closeNominationModal();
            // Обновляем интерфейс чтобы показать что проголосовали
            updateVotingUI();
        } else {
            showMessage('Ошибка сохранения голоса', 'error');
        }
    } catch (error) {
        console.error('Ошибка голосования:', error);
        showMessage('Ошибка при голосовании', 'error');
    }
}

function updateVotingUI() {
    // Здесь можно обновить интерфейс после голосования
    // Например, показать какие номинации уже проголосованы
}