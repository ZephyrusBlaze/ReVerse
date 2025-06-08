let entries = [];
let karmaChart;

function loadEntries() {
    const savedEntries = localStorage.getItem('ecoKarmaEntries');
    if (savedEntries) {
        entries = JSON.parse(savedEntries);
        updateRecentEntries();
        updateTotalKarma();
        if (karmaChart) {
            updateKarmaChart();
        }
    }
}

function saveEntries() {
    localStorage.setItem('ecoKarmaEntries', JSON.stringify(entries));
}

function deleteEntry(id) {
    if (confirm('Are you sure you want to delete this entry?')) {
        entries = entries.filter(entry => entry.id !== id);
        saveEntries();
        updateRecentEntries();
        updateTotalKarma();
        updateAchievements();
        updateTimeline();
        if (karmaChart) {
            updateKarmaChart();
        }
    }
}

function clearAllEntries() {
    if (confirm('Are you sure you want to clear all entries? This cannot be undone.')) {
        entries = [];
        saveEntries();
        updateRecentEntries();
        updateTotalKarma();
        updateAchievements();
        updateTimeline();
        if (karmaChart) {
            updateKarmaChart();
        }
    }
}

function createParticles() {
    const particlesContainer = document.getElementById('particles');
    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 20 + 's';
        particle.style.animationDuration = (Math.random() * 10 + 15) + 's';
        particlesContainer.appendChild(particle);
    }
}

function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });

    document.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');

    if (tabName === 'karma' && !karmaChart) {
        initKarmaChart();
    }
}

async function scoreAction(action) {
    try {
        const prompt = `Given this environmental action: "${action}", analyze its environmental impact and return a single number between -100 and 100, where:
        - Positive numbers indicate positive environmental impact
        - Negative numbers indicate negative environmental impact
        - Higher absolute values indicate stronger impact
        Return ONLY the number, no other text.`;

        const result = await window.geminiModel.generateContent(prompt);
        const response = await result.response;
        const score = parseInt(response.text().trim());
        return Math.max(-100, Math.min(100, score));
    } catch (error) {
        console.error('Error scoring action:', error);
        return 0;
    }
}

async function generateFutureStory(action, score) {
    try {
        const prompt = `Given this environmental action: "${action}" with an impact score of ${score}, generate a single paragraph describing a possible future scenario in 2030-2035 that could result from this action. 
        Focus on environmental consequences and make it realistic but impactful.
        Return ONLY the paragraph text, no formatting or additional text.`;

        const result = await window.geminiModel.generateContent(prompt);
        const response = await result.response;
        return response.text().trim();
    } catch (error) {
        console.error('Error generating story:', error);
        return "Unable to generate future vision at this time.";
    }
}

function updateRecentEntries() {
    const recentEntries = document.getElementById('recent-entries');
    const entriesHtml = entries.slice(0, 5).map(entry => `
        <div class="entry-item">
            <div class="entry-date">${entry.date}</div>
            <div class="entry-action">${entry.action}</div>
            <div class="entry-score" style="color: ${entry.score > 0 ? '#00ff88' : entry.score < 0 ? '#ff4444' : '#ffcc00'};">
                ${entry.score > 0 ? '+' : ''}${entry.score} Karma
            </div>
            <div class="entry-actions">
                <button class="entry-delete" onclick="deleteEntry(${entry.id})">Delete</button>
            </div>
        </div>
    `).join('');

    recentEntries.innerHTML = `
        <h3 style="margin-bottom: 20px;">Recent Entries:</h3>
        ${entriesHtml}
        ${entries.length > 0 ? '<button class="clear-all-btn" onclick="clearAllEntries()">Clear All Entries</button>' : ''}
    `;
}

function displayFutureStory(story, score) {
    const futureDisplay = document.getElementById('future-display');
    futureDisplay.innerHTML = `
        <div class="future-story">
            <div class="console-text">${story}</div>
            <div style="text-align: right; margin-top: 15px;">
                <span style="font-weight: 700;">Karma Impact: </span>
                <span class="entry-score" style="color: ${score > 0 ? '#00ff88' : score < 0 ? '#ff4444' : '#ffcc00'};">
                    ${score > 0 ? '+' : ''}${score}
                </span>
            </div>
        </div>
    `;
}

async function logAction() {
    const actionInput = document.getElementById('action-input');
    const action = actionInput.value.trim();

    if (!action) {
        alert('Please enter an environmental action!');
        return;
    }

    const futureDisplay = document.getElementById('future-display');
    futureDisplay.innerHTML = '<div class="future-story"><div class="console-text">Analyzing your action and generating future vision...</div></div>';

    try {
        const score = await scoreAction(action);
        const story = await generateFutureStory(action, score);
        const date = new Date().toLocaleDateString();

        const entry = {
            id: Date.now(),
            date: date,
            action: action,
            score: score,
            story: story
        };

        entries.unshift(entry);
        saveEntries();

        displayFutureStory(story, score);
        updateRecentEntries();
        updateAchievements();
        updateTimeline();

        if (karmaChart) {
            updateKarmaChart();
        }

        updateTotalKarma();
        actionInput.value = '';
    } catch (error) {
        console.error('Error processing action:', error);
        futureDisplay.innerHTML = '<div class="future-story"><div class="console-text">Error processing your action. Please try again.</div></div>';
    }
}

function updateTotalKarma() {
    const totalKarma = entries.reduce((sum, entry) => sum + entry.score, 0);
    const karmaElement = document.getElementById('total-karma');
    karmaElement.textContent = (totalKarma > 0 ? '+' : '') + totalKarma;
    karmaElement.className = `karma-score ${totalKarma > 0 ? 'positive' : totalKarma < 0 ? 'negative' : ''}`;
}

function initKarmaChart() {
    const ctx = document.getElementById('karmaChart').getContext('2d');

    karmaChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'EcoKarma Score',
                data: [],
                borderColor: '#00ffcc',
                backgroundColor: 'rgba(0, 255, 204, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: '#00ffcc',
                        font: {
                            family: 'Orbitron'
                        }
                    }
                }
            },
            scales: {
                y: {
                    ticks: {
                        color: '#00ffcc'
                    },
                    grid: {
                        color: 'rgba(0, 255, 204, 0.2)'
                    }
                },
                x: {
                    ticks: {
                        color: '#00ffcc'
                    },
                    grid: {
                        color: 'rgba(0, 255, 204, 0.2)'
                    }
                }
            }
        }
    });

    updateKarmaChart();
}

function updateKarmaChart() {
    if (!karmaChart) return;

    const last7Entries = entries.slice(0, 7).reverse();
    const labels = last7Entries.map(entry => entry.date);

    let cumulativeScore = 0;
    const data = last7Entries.map(entry => {
        cumulativeScore += entry.score;
        return cumulativeScore;
    });

    karmaChart.data.labels = labels;
    karmaChart.data.datasets[0].data = data;
    karmaChart.update();
}

async function generateGlobalEcho() {
    const globalDisplay = document.getElementById('global-display');
    globalDisplay.innerHTML = '<div class="global-echo"><div class="console-text">Analyzing global environmental patterns...</div></div>';

    try {
        const prompt = `Generate a single paragraph describing the current state and potential future of global environmental sustainability based on current trends and collective human actions. 
        Make it realistic, insightful, and impactful.
        Return ONLY the paragraph text, no formatting or additional text.`;

        const result = await window.geminiModel.generateContent(prompt);
        const response = await result.response;
        const vision = response.text().trim();

        globalDisplay.innerHTML = `
            <div class="global-echo">
                <div class="console-text" style="font-style: italic;">
                    ${vision}
                </div>
                <div style="text-align: center; margin-top: 20px; font-size: 0.9rem; opacity: 0.8;">
                    Generated from collective environmental consciousness patterns
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error generating global echo:', error);
        globalDisplay.innerHTML = '<div class="global-echo"><div class="console-text">Error generating global vision. Please try again.</div></div>';
    }
}

const achievements = [
    {
        id: 'first_action',
        title: 'First Steps',
        description: 'Log your first environmental action',
        icon: '🌱',
        condition: (entries) => entries.length >= 1,
        progress: (entries) => Math.min(100, (entries.length / 1) * 100)
    },
    {
        id: 'positive_streak',
        title: 'Positive Impact',
        description: 'Accumulate 100 positive karma points',
        icon: '✨',
        condition: (entries) => entries.reduce((sum, entry) => sum + Math.max(0, entry.score), 0) >= 100,
        progress: (entries) => Math.min(100, (entries.reduce((sum, entry) => sum + Math.max(0, entry.score), 0) / 100) * 100)
    },
    {
        id: 'eco_warrior',
        title: 'Eco Warrior',
        description: 'Log 10 environmental actions',
        icon: '🛡️',
        condition: (entries) => entries.length >= 10,
        progress: (entries) => Math.min(100, (entries.length / 10) * 100)
    },
    {
        id: 'carbon_neutral',
        title: 'Carbon Neutral',
        description: 'Maintain a positive karma balance for 5 consecutive days',
        icon: '⚖️',
        condition: (entries) => {
            const last5Days = entries.slice(0, 5);
            return last5Days.length === 5 && last5Days.every(entry => entry.score > 0);
        },
        progress: (entries) => {
            const last5Days = entries.slice(0, 5);
            return Math.min(100, (last5Days.filter(entry => entry.score > 0).length / 5) * 100);
        }
    },
    {
        id: 'future_visionary',
        title: 'Future Visionary',
        description: 'Generate 5 future visions',
        icon: '🔮',
        condition: (entries) => entries.length >= 5,
        progress: (entries) => Math.min(100, (entries.length / 5) * 100)
    },
    {
        id: 'eco_master',
        title: 'Eco Master',
        description: 'Achieve a single action with +50 karma',
        icon: '👑',
        condition: (entries) => entries.some(entry => entry.score >= 50),
        progress: (entries) => Math.min(100, (Math.max(...entries.map(entry => entry.score), 0) / 50) * 100)
    },
    {
        id: 'eco_legend',
        title: 'Eco Legend',
        description: 'Log 25 environmental actions',
        icon: '🌟',
        condition: (entries) => entries.length >= 25,
        progress: (entries) => Math.min(100, (entries.length / 25) * 100)
    },
    {
        id: 'karma_champion',
        title: 'Karma Champion',
        description: 'Reach 500 total karma points',
        icon: '🏆',
        condition: (entries) => entries.reduce((sum, entry) => sum + entry.score, 0) >= 500,
        progress: (entries) => Math.min(100, (entries.reduce((sum, entry) => sum + entry.score, 0) / 500) * 100)
    },
    {
        id: 'perfect_week',
        title: 'Perfect Week',
        description: '7 consecutive days of positive actions',
        icon: '📅',
        condition: (entries) => {
            const last7Days = entries.slice(0, 7);
            return last7Days.length === 7 && last7Days.every(entry => entry.score > 0);
        },
        progress: (entries) => {
            const last7Days = entries.slice(0, 7);
            return Math.min(100, (last7Days.filter(entry => entry.score > 0).length / 7) * 100);
        }
    },
    {
        id: 'eco_phoenix',
        title: 'Eco Phoenix',
        description: 'Recover from -100 to +100 karma',
        icon: '🔥',
        condition: (entries) => {
            let minKarma = 0;
            let currentKarma = 0;
            for (const entry of entries) {
                currentKarma += entry.score;
                minKarma = Math.min(minKarma, currentKarma);
            }
            return minKarma <= -100 && currentKarma >= 100;
        },
        progress: (entries) => {
            let minKarma = 0;
            let currentKarma = 0;
            for (const entry of entries) {
                currentKarma += entry.score;
                minKarma = Math.min(minKarma, currentKarma);
            }
            return Math.min(100, ((currentKarma + Math.abs(minKarma)) / 200) * 100);
        }
    },
    {
        id: 'eco_guardian',
        title: 'Eco Guardian',
        description: 'Maintain positive karma for 10 days',
        icon: '🛡️',
        condition: (entries) => {
            const last10Days = entries.slice(0, 10);
            return last10Days.length === 10 && last10Days.every(entry => entry.score > 0);
        },
        progress: (entries) => {
            const last10Days = entries.slice(0, 10);
            return Math.min(100, (last10Days.filter(entry => entry.score > 0).length / 10) * 100);
        }
    },
    {
        id: 'eco_legend_master',
        title: 'Eco Legend Master',
        description: 'Achieve a single action with +100 karma',
        icon: '👑',
        condition: (entries) => entries.some(entry => entry.score >= 100),
        progress: (entries) => Math.min(100, (Math.max(...entries.map(entry => entry.score), 0) / 100) * 100)
    }
];

function updateAchievements() {
    const achievementsGrid = document.getElementById('achievements-grid');
    const achievementsHtml = achievements.map(achievement => {
        const isUnlocked = achievement.condition(entries);
        const progress = achievement.progress(entries);
        const achievedDate = isUnlocked ? entries.find(entry => achievement.condition([entry]))?.date : null;

        return `
            <div class="achievement-card ${isUnlocked ? 'unlocked' : 'locked'}">
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-title">${achievement.title}</div>
                <div class="achievement-desc">${achievement.description}</div>
                <div class="achievement-progress">
                    <div class="achievement-progress-bar" style="width: ${progress}%"></div>
                </div>
                <div class="achievement-status">
                    ${isUnlocked ?
                `<span class="achievement-unlocked">✓ Unlocked</span>` :
                `<span class="achievement-locked">${Math.round(progress)}% Complete</span>`
            }
                </div>
                ${achievedDate ? `<div class="achievement-date">Achieved on ${achievedDate}</div>` : ''}
            </div>
        `;
    }).join('');

    achievementsGrid.innerHTML = achievementsHtml;
}

function updateTimeline() {
    const timelineEntries = document.getElementById('timeline-entries');
    const timelineHtml = entries.map(entry => `
        <div class="timeline-entry">
            <div class="timeline-dot"></div>
            <div class="timeline-content">
                <div class="timeline-date">${entry.date}</div>
                <div class="timeline-action">${entry.action}</div>
                <div class="timeline-score ${entry.score > 0 ? 'positive' : entry.score < 0 ? 'negative' : ''}">
                    ${entry.score > 0 ? '+' : ''}${entry.score} Karma
                </div>
            </div>
        </div>
    `).join('');

    timelineEntries.innerHTML = timelineHtml;
}

document.getElementById('action-input').addEventListener('keypress', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        logAction();
    }
});

document.addEventListener('DOMContentLoaded', function () {
    createParticles();
    loadEntries();
    updateAchievements();
    updateTimeline();
});

window.deleteEntry = deleteEntry;
window.clearAllEntries = clearAllEntries;
window.logAction = logAction;
window.generateGlobalEcho = generateGlobalEcho;
window.switchTab = switchTab; 