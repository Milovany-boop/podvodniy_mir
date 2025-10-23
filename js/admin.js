// admin.js - функции для администрирования
function initializeAdminPanel() {
    console.log('Инициализация админ-панели...');
    
    const adminBtn = document.getElementById('admin-btn');
    if (adminBtn) {
        adminBtn.addEventListener('click', showAdminPanel);
    }
}

async function showAdminPanel() {
    // Проверяем права админа
    const user = firebase.auth().currentUser;
    if (!user) return;
    
    const userProfile = await getUserProfile(user.uid);
    if (!userProfile.isAdmin) {
        showMessage('У вас нет прав администратора', 'error');
        return;
    }
    
    // Удаляем существующую панель если есть
    const existingPanel = document.querySelector('.admin-panel');
    if (existingPanel) {
        existingPanel.remove();
    }
    
    const adminPanel = document.createElement('div');
    adminPanel.className = 'admin-panel';
    adminPanel.innerHTML = `
        <div style="text-align: center; margin-bottom: 15px;">
            <h3 style="color: var(--gold); margin-bottom: 15px;">Админ-панель</h3>
            <button onclick="exportResults()" class="ocean-btn" style="margin: 5px;">
                <i class="fas fa-download"></i> Экспорт результатов
            </button>
            <button onclick="showStatistics()" class="ocean-btn" style="margin: 5px;">
                <i class="fas fa-chart-bar"></i> Статистика
            </button>
            <button onclick="showUserManagement()" class="ocean-btn" style="margin: 5px;">
                <i class="fas fa-users"></i> Управление пользователями
            </button>
            <button onclick="closeAdminPanel()" class="ocean-btn" style="margin: 5px; background: var(--coral);">
                <i class="fas fa-times"></i> Закрыть
            </button>
        </div>
        <div id="admin-content" style="margin-top: 15px;"></div>
    `;
    
    document.body.appendChild(adminPanel);
}

function closeAdminPanel() {
    const adminPanel = document.querySelector('.admin-panel');
    if (adminPanel) {
        adminPanel.remove();
    }
}

async function exportResults() {
    try {
        showMessage('Экспорт результатов...', 'info');
        const allVotes = await getAllVotes();
        
        let exportText = 'РЕЗУЛЬТАТЫ ГОЛОСОВАНИЯ "ОСКАР ПОДВОДНОГО МИРА"\n';
        exportText += 'Дата экспорта: ' + new Date().toLocaleString('ru-RU') + '\n';
        exportText += 'Источник: Firebase Firestore\n\n';
        
        nominations.forEach(nomination => {
            exportText += `=== ${nomination.title} ===\n`;
            exportText += `${nomination.description}\n\n`;
            
            const nominationResults = allVotes[nomination.id] || {};
            const sortedResults = Object.entries(nominationResults)
                .sort(([,a], [,b]) => b.count - a.count);
            
            if (sortedResults.length === 0) {
                exportText += 'Голосов пока нет\n';
            } else {
                sortedResults.forEach(([nomineeId, data], index) => {
                    const nominee = nomination.nominees.find(n => n.id == nomineeId);
                    if (nominee) {
                        exportText += `${index + 1}. ${nominee.name}: ${data.count} голосов\n`;
                        
                        // Добавляем список проголосовавших
                        if (data.voters && data.voters.length > 0) {
                            exportText += '   Проголосовали: ';
                            exportText += data.voters.map(v => `${v.name} ${v.surname}`).join(', ');
                            exportText += '\n';
                        }
                    }
                });
            }
            exportText += '\n';
        });
        
        // Добавляем общую статистику
        const stats = await getVotingStatistics();
        if (stats) {
            exportText += `ОБЩАЯ СТАТИСТИКА:\n`;
            exportText += `Всего пользователей: ${stats.totalUsers}\n`;
            exportText += `Всего проголосовало: ${stats.totalVoters} человек\n`;
            exportText += `Всего голосов: ${stats.totalVotes}\n\n`;
        }
        
        // Создаем и скачиваем файл
        downloadFile(exportText, `results-oscar-${new Date().toISOString().split('T')[0]}.txt`);
        
        showMessage('Результаты экспортированы в файл!', 'success');
    } catch (error) {
        console.error('Ошибка экспорта:', error);
        showMessage('Ошибка при экспорте результатов', 'error');
    }
}

async function showStatistics() {
    const content = document.getElementById('admin-content');
    const stats = await getVotingStatistics();
    
    if (!stats) {
        content.innerHTML = '<p>Ошибка загрузки статистики</p>';
        return;
    }
    
    let statsHTML = '<h4 style="color: var(--gold); margin-bottom: 15px;">Статистика голосования:</h4>';
    statsHTML += `<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px;">`;
    statsHTML += `<div class="stat-item"><div class="stat-value">${stats.totalUsers}</div><div class="stat-label">Всего пользователей</div></div>`;
    statsHTML += `<div class="stat-item"><div class="stat-value">${stats.totalVoters}</div><div class="stat-label">Проголосовало</div></div>`;
    statsHTML += `<div class="stat-item"><div class="stat-value">${stats.totalVotes}</div><div class="stat-label">Всего голосов</div></div>`;
    statsHTML += `</div>`;
    
    statsHTML += '<h5 style="color: var(--gold); margin-bottom: 10px;">Статистика по номинациям:</h5>';
    statsHTML += '<div style="max-height: 300px; overflow-y: auto;">';
    
    nominations.forEach(nomination => {
        const nomStats = stats.nominations[nomination.id] || { totalVotes: 0, uniqueVoters: 0 };
        const percentage = stats.totalVoters > 0 ? Math.round((nomStats.uniqueVoters / stats.totalVoters) * 100) : 0;
        
        statsHTML += `
            <div style="background: rgba(255,255,255,0.1); padding: 10px; margin: 5px 0; border-radius: 8px;">
                <div style="display: flex; justify-content: between; align-items: center;">
                    <span style="font-weight: bold;">${nomination.title}</span>
                    <span style="margin-left: auto;">${nomStats.totalVotes} гол.</span>
                </div>
                <div style="font-size: 0.9rem; opacity: 0.8;">
                    Уникальных голосующих: ${nomStats.uniqueVoters} (${percentage}%)
                </div>
            </div>
        `;
    });
    
    statsHTML += '</div>';
    
    content.innerHTML = statsHTML;
}

async function showUserManagement() {
    const content = document.getElementById('admin-content');
    content.innerHTML = '<p>Загрузка данных пользователей...</p>';
    
    try {
        const usersSnapshot = await db.collection('users').get();
        let usersHTML = '<h4 style="color: var(--gold); margin-bottom: 15px;">Управление пользователями:</h4>';
        usersHTML += '<div style="max-height: 400px; overflow-y: auto;">';
        
        usersSnapshot.forEach(doc => {
            const user = doc.data();
            usersHTML += `
                <div style="background: rgba(255,255,255,0.1); padding: 15px; margin: 10px 0; border-radius: 8px;">
                    <div style="display: flex; justify-content: between; align-items: center;">
                        <div>
                            <strong>${user.name} ${user.surname}</strong>
                            <div style="font-size: 0.9rem; opacity: 0.8;">${user.email}</div>
                        </div>
                        <div>
                            <span style="background: ${user.isAdmin ? 'var(--gold)' : 'var(--aqua)'}; 
                                  color: var(--dark-ocean); padding: 4px 8px; border-radius: 12px; font-size: 0.8rem;">
                                ${user.isAdmin ? 'Админ' : 'Пользователь'}
                            </span>
                        </div>
                    </div>
                </div>
            `;
        });
        
        usersHTML += '</div>';
        content.innerHTML = usersHTML;
    } catch (error) {
        console.error('Ошибка загрузки пользователей:', error);
        content.innerHTML = '<p>Ошибка загрузки данных пользователей</p>';
    }
}

function downloadFile(content, filename) {
    const blob = new Blob([content], { type: 'text/plain; charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}