// auth.js - управление аутентификацией
let authCurrentUser = null; // Изменили имя переменной

function initializeAuth() {
    console.log('Инициализация аутентификации...');
    
    // Обработчики для форм
    document.getElementById('login-btn').addEventListener('click', login);
    document.getElementById('register-btn').addEventListener('click', register);
    document.getElementById('logout-btn').addEventListener('click', logout);
    
    // Переключение между формами
    document.getElementById('show-register').addEventListener('click', showRegisterForm);
    document.getElementById('show-login').addEventListener('click', showLoginForm);
    
    // Проверяем авторизацию при загрузке
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            handleUserAuth(user);
        } else {
            showAuthForm();
        }
    });
}

function showLoginForm() {
    document.getElementById('login-section').classList.remove('hidden');
    document.getElementById('register-section').classList.add('hidden');
}

function showRegisterForm() {
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('register-section').classList.remove('hidden');
}

function showAuthForm() {
    document.getElementById('auth-form').classList.remove('hidden');
    document.getElementById('voting-interface').classList.add('hidden');
    showLoginForm();
}

async function login() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    if (!email || !password) {
        showMessage('Заполните все поля', 'error');
        return;
    }
    
    try {
        showMessage('Вход в систему...', 'info');
        const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
        console.log('Пользователь вошел:', userCredential.user);
    } catch (error) {
        console.error('Ошибка входа:', error);
        handleAuthError(error);
    }
}

async function register() {
    const name = document.getElementById('register-name').value;
    const surname = document.getElementById('register-surname').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    
    if (!name || !surname || !email || !password) {
        showMessage('Заполните все поля', 'error');
        return;
    }
    
    if (password.length < 6) {
        showMessage('Пароль должен быть не менее 6 символов', 'error');
        return;
    }
    
    try {
        showMessage('Регистрация...', 'info');
        const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Сохраняем дополнительную информацию о пользователе
        await saveUserProfile(user.uid, {
            name: name,
            surname: surname,
            email: email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            isAdmin: false
        });
        
        console.log('Пользователь зарегистрирован:', user);
    } catch (error) {
        console.error('Ошибка регистрации:', error);
        handleAuthError(error);
    }
}

async function logout() {
    try {
        await firebase.auth().signOut();
        showMessage('Вы вышли из системы', 'info');
    } catch (error) {
        console.error('Ошибка выхода:', error);
    }
}

async function handleUserAuth(user) {
    console.log('Пользователь авторизован:', user);
    authCurrentUser = user; // Используем новое имя переменной
    
    // Получаем профиль пользователя
    const userProfile = await getUserProfile(user.uid);
    
    // Показываем интерфейс голосования
    document.getElementById('auth-form').classList.add('hidden');
    document.getElementById('voting-interface').classList.remove('hidden');
    document.getElementById('voter-name-display').textContent = 
        `${userProfile.name} ${userProfile.surname}`;
    
    // Показываем кнопку админа если пользователь админ
    if (userProfile.isAdmin) {
        document.getElementById('admin-button-container').style.display = 'block';
    }
    
    showMessage(`Добро пожаловать, ${userProfile.name}!`, 'success');
    
    // Инициализируем голосование
    if (typeof initializeVoting === 'function') {
        initializeVoting();
    }
}

function handleAuthError(error) {
    let message = 'Ошибка аутентификации';
    
    switch (error.code) {
        case 'auth/email-already-in-use':
            message = 'Этот email уже используется';
            break;
        case 'auth/invalid-email':
            message = 'Неверный формат email';
            break;
        case 'auth/weak-password':
            message = 'Пароль слишком слабый';
            break;
        case 'auth/user-not-found':
            message = 'Пользователь не найден';
            break;
        case 'auth/wrong-password':
            message = 'Неверный пароль';
            break;
        case 'auth/too-many-requests':
            message = 'Слишком много попыток. Попробуйте позже';
            break;
    }
    
    showMessage(message, 'error');
}