// ui.js - управление пользовательским интерфейсом
function initializeUI() {
    console.log('Инициализация UI...');
    
    // Обработчики для модального окна
    const closeModalBtn = document.getElementById('close-modal');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeNominationModal);
    }
    
    const overlay = document.getElementById('overlay');
    if (overlay) {
        overlay.addEventListener('click', closeAllModals);
    }
    
    // Обработчики для кнопок категорий
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const category = this.getAttribute('data-category');
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            filterNominations(category);
        });
    });
    
    console.log('UI инициализирован');
}

function renderNominations() {
    const container = document.getElementById('nominations-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    nominations.forEach(nomination => {
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
        
        container.appendChild(card);
    });
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

function closeAllModals() {
    closeNominationModal();
}

function filterNominations(category) {
    const cards = document.querySelectorAll('.nomination-card');
    cards.forEach(card => {
        if (category === 'all' || card.getAttribute('data-category') === category) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}