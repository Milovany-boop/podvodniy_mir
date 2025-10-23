// firebase-db.js - работа с Firebase Firestore
let db = null;

function initializeFirebase() {
    try {
        if (firebase.apps.length === 0) {
            firebase.initializeApp(firebaseConfig);
            db = firebase.firestore();
            updateFirebaseStatus('connected', 'База данных подключена');
            console.log('Firebase initialized successfully');
        }
        return true;
    } catch (error) {
        console.error('Firebase initialization failed:', error);
        updateFirebaseStatus('error', 'Ошибка подключения к базе данных');
        return false;
    }
}

// Сохранение профиля пользователя
async function saveUserProfile(userId, userData) {
    if (!db) return false;
    
    try {
        await db.collection('users').doc(userId).set(userData, { merge: true });
        console.log('Профиль пользователя сохранен');
        return true;
    } catch (error) {
        console.error('Ошибка сохранения профиля:', error);
        return false;
    }
}

// Получение профиля пользователя
async function getUserProfile(userId) {
    if (!db) return null;
    
    try {
        const doc = await db.collection('users').doc(userId).get();
        if (doc.exists) {
            return doc.data();
        } else {
            // Создаем базовый профиль если не существует
            const basicProfile = {
                name: 'Пользователь',
                surname: '',
                email: firebase.auth().currentUser.email,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                isAdmin: false
            };
            await saveUserProfile(userId, basicProfile);
            return basicProfile;
        }
    } catch (error) {
        console.error('Ошибка получения профиля:', error);
        return null;
    }
}

// Сохранение голоса
async function saveVote(nominationId, nomineeId, nomineeName) {
    if (!db || !firebase.auth().currentUser) return false;
    
    const userId = firebase.auth().currentUser.uid;
    const userProfile = await getUserProfile(userId);
    
    try {
        const voteData = {
            nominationId: nominationId,
            nomineeId: nomineeId,
            nomineeName: nomineeName,
            voterId: userId,
            voterName: userProfile.name,
            voterSurname: userProfile.surname,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Проверяем, не голосовал ли уже пользователь в этой номинации
        const existingVote = await db.collection('votes')
            .where('voterId', '==', userId)
            .where('nominationId', '==', nominationId)
            .get();
        
        if (!existingVote.empty) {
            // Обновляем существующий голос
            const voteDoc = existingVote.docs[0];
            await db.collection('votes').doc(voteDoc.id).update({
                nomineeId: nomineeId,
                nomineeName: nomineeName,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
        } else {
            // Создаем новый голос
            await db.collection('votes').add(voteData);
        }
        
        console.log('Голос сохранен в Firebase');
        return true;
    } catch (error) {
        console.error('Ошибка сохранения голоса:', error);
        return false;
    }
}

// Получение голосов текущего пользователя
async function getCurrentUserVotes() {
    if (!db || !firebase.auth().currentUser) return {};
    
    const userId = firebase.auth().currentUser.uid;
    
    try {
        const votesSnapshot = await db.collection('votes')
            .where('voterId', '==', userId)
            .get();
        
        const votes = {};
        votesSnapshot.forEach(doc => {
            const voteData = doc.data();
            votes[voteData.nominationId] = voteData;
        });
        
        return votes;
    } catch (error) {
        console.error('Ошибка получения голосов:', error);
        return {};
    }
}

// Получение всех голосов (для админа)
async function getAllVotes() {
    if (!db) return {};
    
    try {
        const snapshot = await db.collection('votes').get();
        const results = {};
        
        snapshot.forEach(doc => {
            const vote = doc.data();
            const nomId = vote.nominationId;
            const nomineeId = vote.nomineeId;
            
            if (!results[nomId]) {
                results[nomId] = {};
            }
            
            if (!results[nomId][nomineeId]) {
                results[nomId][nomineeId] = {
                    count: 0,
                    name: vote.nomineeName,
                    voters: []
                };
            }
            
            results[nomId][nomineeId].count++;
            results[nomId][nomineeId].voters.push({
                name: vote.voterName,
                surname: vote.voterSurname,
                id: vote.voterId
            });
        });
        
        return results;
    } catch (error) {
        console.error('Error getting voting results:', error);
        return {};
    }
}

// Получение статистики
async function getVotingStatistics() {
    if (!db) return null;
    
    try {
        const votesSnapshot = await db.collection('votes').get();
        const usersSnapshot = await db.collection('users').get();
        
        const stats = {
            totalVotes: votesSnapshot.size,
            totalVoters: new Set(votesSnapshot.docs.map(doc => doc.data().voterId)).size,
            totalUsers: usersSnapshot.size,
            nominations: {}
        };
        
        nominations.forEach(nomination => {
            const nomVotes = votesSnapshot.docs.filter(doc => doc.data().nominationId === nomination.id);
            stats.nominations[nomination.id] = {
                title: nomination.title,
                totalVotes: nomVotes.length,
                uniqueVoters: new Set(nomVotes.map(doc => doc.data().voterId)).size
            };
        });
        
        return stats;
    } catch (error) {
        console.error('Ошибка получения статистики:', error);
        return null;
    }
}
// Добавьте эту функцию в firebase-db.js
async function createAdminUser(email) {
    if (!db) return false;
    
    try {
        // Найдем пользователя по email
        const usersSnapshot = await db.collection('users')
            .where('email', '==', email)
            .get();
        
        if (!usersSnapshot.empty) {
            const userDoc = usersSnapshot.docs[0];
            await db.collection('users').doc(userDoc.id).update({
                isAdmin: true
            });
            console.log('Пользователь назначен админом:', email);
            return true;
        } else {
            console.log('Пользователь не найден:', email);
            return false;
        }
    } catch (error) {
        console.error('Ошибка назначения админа:', error);
        return false;
    }
}

// Вызовите эту функцию после регистрации первого пользователя
createAdminUser('moldovanov.matveyka@gmail.com');