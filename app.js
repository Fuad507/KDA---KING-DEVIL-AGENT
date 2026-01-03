// Import Firebase modules
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, onSnapshot, doc, updateDoc, setDoc, serverTimestamp, getDoc, collection, query, orderBy, getDocs, addDoc, deleteDoc, Timestamp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { firebaseConfig } from './firebase.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Admin password constant
const ADMIN_PASSWORD = "admin123@#@"; // Change this to your desired password

// App state
let isAdminMode = false;
let leaderboardUnsubscribe = null;
let rewardsUnsubscribe = null;
let allTimeUnsubscribe = null;
let announcementsUnsubscribe = null;
let rewardHistoryUnsubscribe = null;
let hallOfFameUnsubscribe = null;

// DOM Elements
const navButtons = document.querySelectorAll('.nav-btn');
const pages = document.querySelectorAll('.page');
const adminBtn = document.getElementById('adminBtn');
const adminModal = document.getElementById('adminModal');
const closeModal = document.getElementById('closeModal');
const submitPassword = document.getElementById('submitPassword');
const adminPasswordInput = document.getElementById('adminPassword');
const passwordError = document.getElementById('passwordError');

// Leaderboard elements
const leaderboardList = document.getElementById('leaderboardList');
const leaderboardUpdated = document.getElementById('leaderboardUpdated');
const leaderboardAdminControls = document.getElementById('leaderboardAdminControls');
const newPlayerName = document.getElementById('newPlayerName');
const newPlayerStars = document.getElementById('newPlayerStars');
const addPlayerBtn = document.getElementById('addPlayerBtn');

// Rewards elements
const rewardWinner = document.getElementById('rewardWinner');
const rewardDescription = document.getElementById('rewardDescription');
const rewardDate = document.getElementById('rewardDate');
const rewardNote = document.getElementById('rewardNote');
const rewardsAdminControls = document.getElementById('rewardsAdminControls');
const editWinner = document.getElementById('editWinner');
const editReward = document.getElementById('editReward');
const editDate = document.getElementById('editDate');
const editNote = document.getElementById('editNote');
const saveRewardBtn = document.getElementById('saveRewardBtn');

// New pages DOM elements
const allTimeList = document.getElementById('allTimeList');
const announcementsList = document.getElementById('announcementsList');
const announcementsAdminControls = document.getElementById('announcementsAdminControls');
const announcementText = document.getElementById('announcementText');
const postAnnouncementBtn = document.getElementById('postAnnouncementBtn');
const rewardHistoryList = document.getElementById('rewardHistoryList');
const rewardHistoryAdminControls = document.getElementById('rewardHistoryAdminControls');
const historyWinner = document.getElementById('historyWinner');
const historyReward = document.getElementById('historyReward');
const historyDate = document.getElementById('historyDate');
const historyType = document.getElementById('historyType');
const historyNote = document.getElementById('historyNote');
const addRewardHistoryBtn = document.getElementById('addRewardHistoryBtn');
const hallOfFameList = document.getElementById('hallOfFameList');
const hallOfFameAdminControls = document.getElementById('hallOfFameAdminControls');
const hofName = document.getElementById('hofName');
const hofPicture = document.getElementById('hofPicture');
const hofDescription = document.getElementById('hofDescription');
const addHallOfFameBtn = document.getElementById('addHallOfFameBtn');

// Navigation - Single Page App routing
navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const targetPage = btn.getAttribute('data-page');
        
        // Update active nav button
        navButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Show target page
        pages.forEach(page => {
            page.classList.remove('active');
        });
        document.getElementById(targetPage).classList.add('active');
    });
});

// Admin Modal Functions
adminBtn.addEventListener('click', () => {
    adminModal.classList.add('active');
    adminPasswordInput.focus();
});

closeModal.addEventListener('click', () => {
    adminModal.classList.remove('active');
    adminPasswordInput.value = '';
    passwordError.textContent = '';
});

// Close modal on outside click
adminModal.addEventListener('click', (e) => {
    if (e.target === adminModal) {
        adminModal.classList.remove('active');
        adminPasswordInput.value = '';
        passwordError.textContent = '';
    }
});

// Submit password
submitPassword.addEventListener('click', () => {
    const password = adminPasswordInput.value;
    
    if (password === ADMIN_PASSWORD) {
        isAdminMode = true;
        adminModal.classList.remove('active');
        adminPasswordInput.value = '';
        passwordError.textContent = '';
        updateAdminUI();
    } else {
        passwordError.textContent = 'Incorrect password';
        adminPasswordInput.value = '';
    }
});

// Enter key to submit password
adminPasswordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        submitPassword.click();
    }
});

// Update admin UI visibility
function updateAdminUI() {
    if (isAdminMode) {
        leaderboardAdminControls.style.display = 'block';
        rewardsAdminControls.style.display = 'block';
        announcementsAdminControls.style.display = 'block';
        rewardHistoryAdminControls.style.display = 'block';
        hallOfFameAdminControls.style.display = 'block';
        adminBtn.textContent = 'Admin Mode Active';
        adminBtn.style.background = '#00ff88';
        adminBtn.style.color = '#000';
        adminBtn.style.borderColor = '#00ff88';
        adminBtn.style.boxShadow = '0 0 20px rgba(0, 255, 136, 0.7)';
        
        // Re-render leaderboard to show edit controls
        if (leaderboardUnsubscribe) {
            const leaderboardRef = doc(db, 'leaderboard', 'today');
            getDoc(leaderboardRef).then(snapshot => {
                if (snapshot.exists()) {
                    renderLeaderboard(snapshot.data());
                }
            });
        }
    } else {
        leaderboardAdminControls.style.display = 'none';
        rewardsAdminControls.style.display = 'none';
        announcementsAdminControls.style.display = 'none';
        rewardHistoryAdminControls.style.display = 'none';
        hallOfFameAdminControls.style.display = 'none';
        adminBtn.textContent = 'Admin Control';
        adminBtn.style.background = 'rgba(255, 102, 0, 0.1)';
        adminBtn.style.color = '#ff6600';
        adminBtn.style.borderColor = '#ff6600';
        adminBtn.style.boxShadow = '0 0 10px rgba(255, 102, 0, 0.3)';
        
        // Re-render leaderboard to hide edit controls
        if (leaderboardUnsubscribe) {
            const leaderboardRef = doc(db, 'leaderboard', 'today');
            getDoc(leaderboardRef).then(snapshot => {
                if (snapshot.exists()) {
                    renderLeaderboard(snapshot.data());
                }
            });
        }
    }
}

// Format timestamp to readable date
function formatDate(timestamp) {
    if (!timestamp) return '--';
    const date = timestamp.toDate();
    return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Format date for input field
function formatDateForInput(timestamp) {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Leaderboard Functions
function renderLeaderboard(data) {
    if (!data || !data.players) {
        leaderboardList.innerHTML = '<p>No players yet. Add players in admin mode.</p>';
        return;
    }

    // Convert players object to array and sort
    const playersArray = Object.entries(data.players)
        .map(([name, stars]) => ({ name, stars: parseInt(stars) || 0 }))
        .sort((a, b) => b.stars - a.stars);

    if (playersArray.length === 0) {
        leaderboardList.innerHTML = '<p>No players yet. Add players in admin mode.</p>';
        return;
    }

    // Find top grinder
    const topStars = playersArray[0]?.stars || 0;
    const topGrinders = playersArray.filter(p => p.stars === topStars && p.stars > 0);

    leaderboardList.innerHTML = playersArray.map((player, index) => {
        const isTopGrinder = topGrinders.length > 0 && player.stars === topStars && player.stars > 0;
        const rank = index + 1;
        
        let html = `
            <div class="leaderboard-item ${isTopGrinder ? 'top-grinder' : ''}" data-player="${player.name}">
                <div class="player-info">
                    <span class="rank">#${rank}</span>
                    <span class="player-name">${player.name}</span>
                </div>
                <div class="star-count">
                    <span class="star-icon">⭐</span>
                    <span class="star-value">${player.stars}</span>
                </div>
        `;

        // Add edit controls if admin mode
        if (isAdminMode) {
            html += `
                <div class="player-edit-controls">
                    <input type="text" class="edit-player-name" value="${player.name}" placeholder="Player name">
                    <input type="number" class="edit-player-stars" value="${player.stars}" min="0" placeholder="Stars">
                    <button class="btn-save" onclick="updatePlayer('${player.name}')">Save</button>
                    <button class="btn-delete" onclick="deletePlayer('${player.name}')">Delete</button>
                </div>
            `;
        }

        html += '</div>';
        return html;
    }).join('');

    // Update last updated time
    if (data.updatedAt) {
        leaderboardUpdated.textContent = `Last updated: ${formatDate(data.updatedAt)}`;
    }
}

// Update player function (global for onclick)
window.updatePlayer = async function(oldName) {
    const item = document.querySelector(`[data-player="${oldName}"]`);
    const newName = item.querySelector('.edit-player-name').value.trim();
    const newStars = parseInt(item.querySelector('.edit-player-stars').value) || 0;

    if (!newName) {
        alert('Player name cannot be empty');
        return;
    }

    const leaderboardRef = doc(db, 'leaderboard', 'today');
    
    try {
        // Get current data
        const snapshot = await getDoc(leaderboardRef);
        const currentData = snapshot.exists() ? snapshot.data() : { players: {} };
        const players = { ...currentData.players };
        
        // Update player data
        players[newName] = newStars;
        
        // If name changed, remove old entry
        if (oldName !== newName && players[oldName] !== undefined) {
            delete players[oldName];
        }
        
        // Update document
        await updateDoc(leaderboardRef, {
            players: players,
            updatedAt: serverTimestamp()
        });
    } catch (error) {
        // If document doesn't exist, create it
        if (error.code === 'not-found') {
            setDoc(leaderboardRef, {
                players: { [newName]: newStars },
                updatedAt: serverTimestamp()
            }).catch((err) => {
                console.error('Error creating leaderboard:', err);
                alert('Error updating player. Please try again.');
            });
        } else {
            console.error('Error updating player:', error);
            alert('Error updating player. Please try again.');
        }
    }
};

// Delete player function (global for onclick)
window.deletePlayer = async function(playerName) {
    if (!confirm(`Delete ${playerName}?`)) return;

    const leaderboardRef = doc(db, 'leaderboard', 'today');
    
    try {
        // Get current data
        const snapshot = await getDoc(leaderboardRef);
        if (!snapshot.exists()) return;
        
        const currentData = snapshot.data();
        const players = { ...currentData.players };
        
        // Remove player
        delete players[playerName];
        
        // Update document
        await updateDoc(leaderboardRef, {
            players: players,
            updatedAt: serverTimestamp()
        });
    } catch (error) {
        console.error('Error deleting player:', error);
        alert('Error deleting player. Please try again.');
    }
};

// Add new player
addPlayerBtn.addEventListener('click', async () => {
    const name = newPlayerName.value.trim();
    const stars = parseInt(newPlayerStars.value) || 0;

    if (!name) {
        alert('Please enter a player name');
        return;
    }

    const leaderboardRef = doc(db, 'leaderboard', 'today');
    
    try {
        // Try to get existing document first
        const snapshot = await getDoc(leaderboardRef);
        
        if (snapshot.exists()) {
            // Document exists, update it
            const currentData = snapshot.data();
            const players = currentData.players || {};
            players[name] = stars;
            
            await updateDoc(leaderboardRef, {
                players: players,
                updatedAt: serverTimestamp()
            });
        } else {
            // Document doesn't exist, create it
            await setDoc(leaderboardRef, {
                players: { [name]: stars },
                updatedAt: serverTimestamp()
            });
        }
        
        // Clear inputs on success
        newPlayerName.value = '';
        newPlayerStars.value = '';
    } catch (error) {
        console.error('Error adding player:', error);
        let errorMsg = 'Error adding player. ';
        if (error.code === 'permission-denied') {
            errorMsg += 'Permission denied. Please check Firestore security rules allow writes.';
        } else if (error.message) {
            errorMsg += error.message;
        } else {
            errorMsg += 'Please try again.';
        }
        alert(errorMsg);
    }
});

// Subscribe to leaderboard real-time updates
function subscribeToLeaderboard() {
    const leaderboardRef = doc(db, 'leaderboard', 'today');
    
    leaderboardUnsubscribe = onSnapshot(leaderboardRef, (snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.data();
            renderLeaderboard(data);
        } else {
            leaderboardList.innerHTML = '<p>No players yet. Add players in admin mode.</p>';
            leaderboardUpdated.textContent = 'Last updated: --';
        }
    }, (error) => {
        console.error('Error listening to leaderboard:', error);
    });
}

// Rewards Functions
function renderRewards(data) {
    if (!data) {
        rewardWinner.textContent = '--';
        rewardDescription.textContent = '--';
        rewardDate.textContent = '--';
        rewardNote.textContent = '--';
        return;
    }

    rewardWinner.textContent = data.winner || '--';
    rewardDescription.textContent = data.reward || '--';
    rewardDate.textContent = data.date ? formatDate(data.date) : '--';
    rewardNote.textContent = data.note || '--';

    // Populate edit fields if admin mode
    if (isAdminMode) {
        editWinner.value = data.winner || '';
        editReward.value = data.reward || '';
        editDate.value = data.date ? formatDateForInput(data.date) : '';
        editNote.value = data.note || '';
    }
}

// Save reward changes
saveRewardBtn.addEventListener('click', async () => {
    const winner = editWinner.value.trim();
    const reward = editReward.value.trim();
    const date = editDate.value;
    const note = editNote.value.trim();

    if (!winner || !reward) {
        alert('Winner and Reward are required');
        return;
    }

    const rewardsRef = doc(db, 'rewards', 'today');
    const updateData = {
        winner,
        reward,
        note
    };

    // Add date if provided
    if (date) {
        updateData.date = Timestamp.fromDate(new Date(date));
    } else {
        updateData.date = serverTimestamp();
    }

    try {
        // Try to get existing document first
        const snapshot = await getDoc(rewardsRef);
        
        if (snapshot.exists()) {
            // Document exists, update it
            await updateDoc(rewardsRef, updateData);
        } else {
            // Document doesn't exist, create it
            await setDoc(rewardsRef, updateData);
        }
    } catch (error) {
        console.error('Error saving reward:', error);
        let errorMsg = 'Error saving reward. ';
        if (error.code === 'permission-denied') {
            errorMsg += 'Permission denied. Please check Firestore security rules allow writes.';
        } else if (error.message) {
            errorMsg += error.message;
        } else {
            errorMsg += 'Please try again.';
        }
        alert(errorMsg);
    }
});

// Subscribe to rewards real-time updates
function subscribeToRewards() {
    const rewardsRef = doc(db, 'rewards', 'today');
    
    rewardsUnsubscribe = onSnapshot(rewardsRef, (snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.data();
            renderRewards(data);
        } else {
            renderRewards(null);
        }
    }, (error) => {
        console.error('Error listening to rewards:', error);
    });
}

// ==================== ALL-TIME LEADERBOARD ====================
// Aggregates total stars from all daily leaderboard entries in Firestore
async function calculateAllTimeLeaderboard() {
    try {
        // Get all documents from dailyLeaderboard collection
        const dailyLeaderboardRef = collection(db, 'dailyLeaderboard');
        const snapshot = await getDocs(dailyLeaderboardRef);
        
        // Aggregate stars by player name
        const playerTotals = {};
        
        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.players) {
                Object.entries(data.players).forEach(([name, stars]) => {
                    if (!playerTotals[name]) {
                        playerTotals[name] = 0;
                    }
                    playerTotals[name] += parseInt(stars) || 0;
                });
            }
        });
        
        // Convert to array and sort descending
        const playersArray = Object.entries(playerTotals)
            .map(([name, stars]) => ({ name, stars }))
            .sort((a, b) => b.stars - a.stars);
        
        // Update Firestore all-time leaderboard document
        const allTimeRef = doc(db, 'leaderboardAllTime', 'summary');
        await setDoc(allTimeRef, {
            players: playerTotals,
            updatedAt: serverTimestamp()
        }, { merge: true });
        
        return playersArray;
    } catch (error) {
        console.error('Error calculating all-time leaderboard:', error);
        return [];
    }
}

// Render all-time leaderboard
function renderAllTimeLeaderboard(data) {
    if (!data || !data.players || Object.keys(data.players).length === 0) {
        allTimeList.innerHTML = '<p>No all-time data yet. Data will appear as daily leaderboards are added.</p>';
        return;
    }
    
    const playersArray = Object.entries(data.players)
        .map(([name, stars]) => ({ name, stars: parseInt(stars) || 0 }))
        .sort((a, b) => b.stars - a.stars);
    
    const topStars = playersArray[0]?.stars || 0;
    
    allTimeList.innerHTML = playersArray.map((player, index) => {
        const rank = index + 1;
        const isTopPlayer = rank === 1 && player.stars > 0;
        
        return `
            <div class="leaderboard-item ${isTopPlayer ? 'top-grinder' : ''}" data-player="${player.name}">
                <div class="player-info">
                    <span class="rank">#${rank}</span>
                    <span class="player-name">${player.name}</span>
                </div>
                <div class="star-count">
                    <span class="star-icon">⭐</span>
                    <span class="star-value">${player.stars.toLocaleString()}</span>
                </div>
            </div>
        `;
    }).join('');
}

// Subscribe to all-time leaderboard and daily leaderboard for auto-updates
function subscribeToAllTimeLeaderboard() {
    // Listen to all-time leaderboard document
    const allTimeRef = doc(db, 'leaderboardAllTime', 'summary');
    
    allTimeUnsubscribe = onSnapshot(allTimeRef, (snapshot) => {
        if (snapshot.exists()) {
            renderAllTimeLeaderboard(snapshot.data());
        } else {
            // Calculate if document doesn't exist
            calculateAllTimeLeaderboard().then(players => {
                if (players.length > 0) {
                    renderAllTimeLeaderboard({ players: Object.fromEntries(players.map(p => [p.name, p.stars])) });
                } else {
                    allTimeList.innerHTML = '<p>No all-time data yet. Data will appear as daily leaderboards are added.</p>';
                }
            });
        }
    }, (error) => {
        console.error('Error listening to all-time leaderboard:', error);
    });
    
    // Also listen to daily leaderboard collection and today's leaderboard to auto-update all-time
    const dailyLeaderboardRef = collection(db, 'dailyLeaderboard');
    onSnapshot(dailyLeaderboardRef, () => {
        // Recalculate when daily leaderboard collection changes
        calculateAllTimeLeaderboard();
    });
    
    // Also listen to today's leaderboard document
    const todayLeaderboardRef = doc(db, 'leaderboard', 'today');
    onSnapshot(todayLeaderboardRef, () => {
        // Recalculate when today's leaderboard changes
        calculateAllTimeLeaderboard();
    });
}

// ==================== ANNOUNCEMENTS ====================
// Render announcements (newest first)
function renderAnnouncements(snapshots) {
    if (!snapshots || snapshots.empty) {
        announcementsList.innerHTML = '<p>No announcements yet.</p>';
        return;
    }
    
    const announcements = [];
    snapshots.forEach(doc => {
        announcements.push({ id: doc.id, ...doc.data() });
    });
    
    // Sort by date descending (newest first)
    announcements.sort((a, b) => {
        const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
        const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
        return dateB - dateA;
    });
    
    announcementsList.innerHTML = announcements.map(announcement => {
        const date = announcement.date?.toDate ? announcement.date.toDate() : new Date(announcement.date);
        const formattedDate = formatDate(announcement.date || Timestamp.now());
        
        let html = `
            <div class="announcement-item" data-id="${announcement.id}">
                <div class="announcement-date">${formattedDate}</div>
                <div class="announcement-text">${announcement.text || ''}</div>
        `;
        
        // Add delete button if admin
        if (isAdminMode) {
            html += `<button class="btn-delete" onclick="deleteAnnouncement('${announcement.id}')">Delete</button>`;
        }
        
        html += '</div>';
        return html;
    }).join('');
}

// Delete announcement (global for onclick)
window.deleteAnnouncement = async function(announcementId) {
    if (!confirm('Delete this announcement?')) return;
    
    try {
        const announcementRef = doc(db, 'announcements', announcementId);
        await deleteDoc(announcementRef);
    } catch (error) {
        console.error('Error deleting announcement:', error);
        let errorMsg = 'Error deleting announcement. ';
        if (error.code === 'permission-denied') {
            errorMsg += 'Permission denied. Please check Firestore security rules allow writes.';
        } else if (error.message) {
            errorMsg += error.message;
        } else {
            errorMsg += 'Please try again.';
        }
        alert(errorMsg);
    }
};

// Post new announcement
postAnnouncementBtn.addEventListener('click', async () => {
    const text = announcementText.value.trim();
    
    if (!text) {
        alert('Please enter announcement text');
        return;
    }
    
    try {
        const announcementsRef = collection(db, 'announcements');
        await addDoc(announcementsRef, {
            text: text,
            date: serverTimestamp()
        });
        announcementText.value = '';
    } catch (error) {
        console.error('Error posting announcement:', error);
        let errorMsg = 'Error posting announcement. ';
        if (error.code === 'permission-denied') {
            errorMsg += 'Permission denied. Please check Firestore security rules allow writes.';
        } else if (error.message) {
            errorMsg += error.message;
        } else {
            errorMsg += 'Please try again.';
        }
        alert(errorMsg);
    }
});

// Subscribe to announcements real-time updates
function subscribeToAnnouncements() {
    const announcementsRef = collection(db, 'announcements');
    const q = query(announcementsRef, orderBy('date', 'desc'));
    
    announcementsUnsubscribe = onSnapshot(q, (snapshot) => {
        renderAnnouncements(snapshot);
    }, (error) => {
        console.error('Error listening to announcements:', error);
    });
}

// ==================== REWARD HISTORY ====================
// Render reward history (newest first)
function renderRewardHistory(snapshots) {
    if (!snapshots || snapshots.empty) {
        rewardHistoryList.innerHTML = '<p>No reward history yet.</p>';
        return;
    }
    
    const rewards = [];
    snapshots.forEach(doc => {
        rewards.push({ id: doc.id, ...doc.data() });
    });
    
    // Sort by date descending (newest first)
    rewards.sort((a, b) => {
        const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
        const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
        return dateB - dateA;
    });
    
    rewardHistoryList.innerHTML = rewards.map(reward => {
        const formattedDate = formatDate(reward.date || Timestamp.now());
        const isTopGrinder = reward.isTopGrinder || false;
        
        let html = `
            <div class="reward-history-item ${isTopGrinder ? 'top-grinder' : ''}" data-id="${reward.id}">
                <div class="reward-history-date">${formattedDate}</div>
                <div class="reward-history-winner"><strong>Winner:</strong> ${reward.winner || '--'}</div>
                <div class="reward-history-reward"><strong>Reward:</strong> ${reward.reward || '--'}</div>
                <div class="reward-history-type"><strong>Type:</strong> ${(reward.type || 'daily').toUpperCase()}</div>
                ${reward.note ? `<div class="reward-history-note"><strong>Note:</strong> ${reward.note}</div>` : ''}
        `;
        
        // Add delete button if admin
        if (isAdminMode) {
            html += `<button class="btn-delete" onclick="deleteRewardHistory('${reward.id}')">Delete</button>`;
        }
        
        html += '</div>';
        return html;
    }).join('');
}

// Delete reward history entry (global for onclick)
window.deleteRewardHistory = async function(rewardId) {
    if (!confirm('Delete this reward entry?')) return;
    
    try {
        const rewardRef = doc(db, 'rewards', rewardId);
        await deleteDoc(rewardRef);
    } catch (error) {
        console.error('Error deleting reward history:', error);
        let errorMsg = 'Error deleting reward entry. ';
        if (error.code === 'permission-denied') {
            errorMsg += 'Permission denied. Please check Firestore security rules allow writes.';
        } else if (error.message) {
            errorMsg += error.message;
        } else {
            errorMsg += 'Please try again.';
        }
        alert(errorMsg);
    }
};

// Add new reward history entry
addRewardHistoryBtn.addEventListener('click', async () => {
    const winner = historyWinner.value.trim();
    const reward = historyReward.value.trim();
    const date = historyDate.value;
    const type = historyType.value;
    const note = historyNote.value.trim();
    
    if (!winner || !reward) {
        alert('Winner and Reward are required');
        return;
    }
    
    try {
        const rewardsRef = collection(db, 'rewards');
        const rewardData = {
            winner,
            reward,
            type,
            note,
            date: date ? Timestamp.fromDate(new Date(date)) : serverTimestamp()
        };
        
        await addDoc(rewardsRef, rewardData);
        
        // Clear inputs on success
        historyWinner.value = '';
        historyReward.value = '';
        historyDate.value = '';
        historyType.value = 'daily';
        historyNote.value = '';
    } catch (error) {
        console.error('Error adding reward history:', error);
        let errorMsg = 'Error adding reward entry. ';
        if (error.code === 'permission-denied') {
            errorMsg += 'Permission denied. Please check Firestore security rules allow writes.';
        } else if (error.message) {
            errorMsg += error.message;
        } else {
            errorMsg += 'Please try again.';
        }
        alert(errorMsg);
    }
});

// Subscribe to reward history real-time updates
function subscribeToRewardHistory() {
    const rewardsRef = collection(db, 'rewards');
    const q = query(rewardsRef, orderBy('date', 'desc'));
    
    rewardHistoryUnsubscribe = onSnapshot(q, (snapshot) => {
        renderRewardHistory(snapshot);
    }, (error) => {
        console.error('Error listening to reward history:', error);
    });
}

// ==================== HALL OF FAME ====================
// Render hall of fame cards
function renderHallOfFame(snapshots) {
    if (!snapshots || snapshots.empty) {
        hallOfFameList.innerHTML = '<p>No hall of fame entries yet.</p>';
        return;
    }
    
    const entries = [];
    snapshots.forEach(doc => {
        entries.push({ id: doc.id, ...doc.data() });
    });
    
    hallOfFameList.innerHTML = entries.map(entry => {
        const pictureUrl = entry.pictureURL || 'https://via.placeholder.com/200?text=No+Image';
        const name = entry.name || 'Unknown';
        const description = entry.description || 'No description';
        
        let html = `
            <div class="hof-card" data-id="${entry.id}">
                <div class="hof-picture">
                    <img src="${pictureUrl}" alt="${name}" onerror="this.src='https://via.placeholder.com/200?text=No+Image'">
                </div>
                <div class="hof-name">${name}</div>
                <div class="hof-description">${description}</div>
        `;
        
        // Add delete button if admin
        if (isAdminMode) {
            html += `<button class="btn-delete" onclick="deleteHallOfFame('${entry.id}')">Delete</button>`;
        }
        
        html += '</div>';
        return html;
    }).join('');
}

// Delete hall of fame entry (global for onclick)
window.deleteHallOfFame = async function(entryId) {
    if (!confirm('Delete this hall of fame entry?')) return;
    
    try {
        const hofRef = doc(db, 'hallOfFame', entryId);
        await deleteDoc(hofRef);
    } catch (error) {
        console.error('Error deleting hall of fame entry:', error);
        let errorMsg = 'Error deleting entry. ';
        if (error.code === 'permission-denied') {
            errorMsg += 'Permission denied. Please check Firestore security rules allow writes.';
        } else if (error.message) {
            errorMsg += error.message;
        } else {
            errorMsg += 'Please try again.';
        }
        alert(errorMsg);
    }
};

// Add new hall of fame entry
addHallOfFameBtn.addEventListener('click', async () => {
    const name = hofName.value.trim();
    const pictureURL = hofPicture.value.trim();
    const description = hofDescription.value.trim();
    
    if (!name) {
        alert('Player name is required');
        return;
    }
    
    try {
        const hallOfFameRef = collection(db, 'hallOfFame');
        await addDoc(hallOfFameRef, {
            name,
            pictureURL: pictureURL || '',
            description: description || ''
        });
        
        // Clear inputs on success
        hofName.value = '';
        hofPicture.value = '';
        hofDescription.value = '';
    } catch (error) {
        console.error('Error adding hall of fame entry:', error);
        let errorMsg = 'Error adding entry. ';
        if (error.code === 'permission-denied') {
            errorMsg += 'Permission denied. Please check Firestore security rules allow writes.';
        } else if (error.message) {
            errorMsg += error.message;
        } else {
            errorMsg += 'Please try again.';
        }
        alert(errorMsg);
    }
});

// Subscribe to hall of fame real-time updates
function subscribeToHallOfFame() {
    const hallOfFameRef = collection(db, 'hallOfFame');
    
    hallOfFameUnsubscribe = onSnapshot(hallOfFameRef, (snapshot) => {
        renderHallOfFame(snapshot);
    }, (error) => {
        console.error('Error listening to hall of fame:', error);
    });
}

// Initialize app
function init() {
    subscribeToLeaderboard();
    subscribeToRewards();
    subscribeToAllTimeLeaderboard();
    subscribeToAnnouncements();
    subscribeToRewardHistory();
    subscribeToHallOfFame();
    updateAdminUI();
}

// Start app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

