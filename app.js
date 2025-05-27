// Import required packages
import fuzzySearch from 'fuzzy-search';

// Helper function for fuzzy search
function searchChores(query, chores) {
    const searcher = new fuzzySearch(query, ['title', 'category']);
    return searcher.search(chores);
}

// Core Configuration
const ACHIEVEMENT_THRESHOLDS = {
    points: {
        daily: [50, 100, 200, 500],
        weekly: [200, 500, 1000, 2000],
        monthly: [1000, 2500, 5000, 10000]
    },
    streaks: {
        daily: [7, 14, 30, 90],
        weekly: [4, 8, 12, 24],
        monthly: [3, 6, 12, 24]
    },
    categories: [5, 10, 20, 50],
    challenges: [1, 3, 5, 10]
};

// Environment Configuration
const ENV = {
    SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL',
    SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_KEY',
    WEATHER_API_KEY: import.meta.env.VITE_WEATHER_API_KEY || 'YOUR_WEATHER_API_KEY'
};

// Import Supabase client
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY);

// Points System Configuration
const POINTS_SYSTEM = {
    frequency: {
        daily: 1,
        weekly: 2,
        monthly: 3,
        once: 1
    },
    difficulty: {
        easy: 1,
        medium: 1.5,
        hard: 2
    },
    priority: {
        low: 1,
        medium: 1.5,
        high: 2,
        urgent: 2.5
    },
    timeOfDay: {
        morning: 1.2,
        afternoon: 1,
        evening: 0.8,
        night: 1.5
    }
};

// Calculate chore points based on various factors
function calculateChorePoints(chore) {
    const basePoints = 10; // Base points for any chore
    
    // Calculate multipliers
    const frequencyMultiplier = POINTS_SYSTEM.frequency[chore.frequency] || 1;
    const difficultyMultiplier = POINTS_SYSTEM.difficulty[chore.difficulty] || 1;
    const priorityMultiplier = POINTS_SYSTEM.priority[chore.priority] || 1;
    const timeMultiplier = POINTS_SYSTEM.timeOfDay[chore.time_of_day] || 1;
    
    // Calculate total points
    return Math.round(basePoints * frequencyMultiplier * difficultyMultiplier * priorityMultiplier * timeMultiplier);
}

// Function to populate assignee dropdown
async function populateAssignees() {
    const { data: users, error } = await supabase
        .from('users')
        .select('id, name')
        .order('name');

    if (error) throw error;

    const assigneeSelect = document.getElementById('choreAssignee');
    assigneeSelect.innerHTML = '<option value="">Select Assignee</option>';
    
    users.forEach(user => {
        const option = document.createElement('option');
        option.value = user.id;
        option.textContent = user.name;
        assigneeSelect.appendChild(option);
    });
}

// Function to add a new chore
async function addChore() {
    try {
        const choreData = {
            title: document.getElementById('choreName').value,
            category: document.getElementById('choreCategory').value,
            assignee_id: document.getElementById('choreAssignee').value,
            frequency: document.getElementById('choreFrequency').value,
            difficulty: document.getElementById('choreDifficulty').value,
            priority: document.getElementById('chorePriority').value,
            time_of_day: document.getElementById('timeOfDay').value,
            seasonal_schedule: document.getElementById('seasonalSchedule').value,
            required_tools: document.getElementById('requiredTools').value,
            notes: document.getElementById('choreNotes').value,
            due_date: document.getElementById('choreDueDate').value
        };

        if (!choreData.title || !choreData.category) {
            alert('Title and Category are required');
            return;
        }

        const points = calculateChorePoints(choreData);
        choreData.points = points;

        const { data, error } = await supabase
            .from('chores')
            .insert([choreData])
            .select();

        if (error) throw error;

        // Clear form
        document.getElementById('addChoreForm').reset();
        closeModal('addChoreModal');
        
        // Update UI
        updateChoreList();
        updatePoints();
        
        alert('Chore added successfully!');
    } catch (error) {
        console.error('Error adding chore:', error);
        alert('Error adding chore: ' + error.message);
    }
}

// Function to update chore list
async function updateChoreList() {
    const categoryFilter = document.getElementById('categoryFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;
    
    const query = supabase
        .from('chores')
        .select('*')
        .order('due_date');

    if (categoryFilter) {
        query.eq('category', categoryFilter);
    }

    if (statusFilter) {
        query.eq('status', statusFilter);
    }

    const { data: chores, error } = await query;

    if (error) throw error;

    const choresList = document.querySelector('.chores-list');
    choresList.innerHTML = '';

    chores.forEach(chore => {
        const choreElement = document.createElement('div');
        choreElement.className = 'bg-gray-700 rounded-lg p-4 mb-4';
        
        choreElement.innerHTML = `
            <div class="flex justify-between items-start">
                <div>
                    <h3 class="text-lg font-semibold">${chore.title}</h3>
                    <div class="text-sm text-gray-400">
                        <span class="category-${chore.category}">${chore.category}</span>
                        • ${new Date(chore.due_date).toLocaleDateString()}
                    </div>
                    <div class="mt-2">
                        <span class="text-primary">${chore.points} points</span>
                        • ${chore.frequency}
                        • ${chore.priority}
                    </div>
                </div>
                <div class="flex space-x-2">
                    <button onclick="markChoreComplete(${chore.id})" class="px-3 py-1 rounded bg-green-500 hover:bg-green-600 text-white">
                        Complete
                    </button>
                    <button onclick="skipChore(${chore.id})" class="px-3 py-1 rounded bg-red-500 hover:bg-red-600 text-white">
                        Skip
                    </button>
                </div>
            </div>
        `;
        
        choresList.appendChild(choreElement);
    });
}

// Function to mark chore as complete
async function markChoreComplete(choreId) {
    try {
        const { error } = await supabase
            .from('chores')
            .update({ status: 'completed', completed_at: new Date().toISOString() })
            .eq('id', choreId);

        if (error) throw error;

        updateChoreList();
        updatePoints();
        
        alert('Chore marked as complete!');
    } catch (error) {
        console.error('Error marking chore as complete:', error);
        alert('Error marking chore as complete: ' + error.message);
    }
}

// Function to skip chore
async function skipChore(choreId) {
    try {
        const { error } = await supabase
            .from('chores')
            .update({ status: 'skipped' })
            .eq('id', choreId);

        if (error) throw error;

        updateChoreList();
        
        alert('Chore skipped!');
    } catch (error) {
        console.error('Error skipping chore:', error);
        alert('Error skipping chore: ' + error.message);
    }
}

// Function to update points display
async function updatePoints() {
    const today = new Date().toISOString().split('T')[0];
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const monthStart = new Date();
    monthStart.setDate(1);

    const queries = [
        supabase
            .from('chores')
            .select('points')
            .eq('status', 'completed')
            .gte('completed_at', today),
        supabase
            .from('chores')
            .select('points')
            .eq('status', 'completed')
            .gte('completed_at', weekStart.toISOString()),
        supabase
            .from('chores')
            .select('points')
            .eq('status', 'completed')
            .gte('completed_at', monthStart.toISOString())
    ];

    const [todayRes, weekRes, monthRes] = await Promise.all(queries);

    const todayPoints = todayRes.data.reduce((sum, chore) => sum + chore.points, 0);
    const weekPoints = weekRes.data.reduce((sum, chore) => sum + chore.points, 0);
    const monthPoints = monthRes.data.reduce((sum, chore) => sum + chore.points, 0);

    document.getElementById('todayPoints').textContent = todayPoints;
    document.getElementById('weeklyPoints').textContent = weekPoints;
    document.getElementById('monthlyPoints').textContent = monthPoints;

    updateProgressBars(todayPoints, weekPoints, monthPoints);
}

// Function to update progress bars
function updateProgressBars(todayPoints, weekPoints, monthPoints) {
    const updateBar = (elementId, points, goal) => {
        const percentage = Math.min((points / goal) * 100, 100);
        document.getElementById(elementId).style.width = `${percentage}%`;
    };

    updateBar('todayProgress', todayPoints, 100);
    updateBar('weeklyProgress', weekPoints, 500);
    updateBar('monthlyProgress', monthPoints, 2000);
}

// Function to toggle theme
function toggleTheme() {
    document.body.classList.toggle('dark');
    document.body.classList.toggle('light');
    const themeIcon = document.getElementById('themeIcon');
    const themeText = document.getElementById('themeText');
    
    if (themeIcon.textContent === '🌙') {
        themeIcon.textContent = '☀️';
        themeText.textContent = 'Light Mode';
    } else {
        themeIcon.textContent = '🌙';
        themeText.textContent = 'Dark Mode';
    }
}

// Function to open modal
function openModal(modalId) {
    document.getElementById(modalId).classList.remove('hidden');
}

// Function to close modal
function closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
}

// Core Functions
async function initializeSupabase() {
    try {
        if (!ENV.SUPABASE_URL || !ENV.SUPABASE_ANON_KEY) {
            throw new Error('Supabase configuration missing');
        }

        // Initialize Supabase client
        supabase = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY);
        
        // Test connection
        const { data, error } = await supabase
            .from('chores')
            .select('id')
            .single();

        if (error) throw error;
        
        console.log('Connected to database successfully');
        
        // Initialize additional features
        try {
            await createHistoryTable();
            await createAchievementSystem();
            await setupRealtimeSubscriptions();
        } catch (initError) {
            console.error('Error initializing features:', initError);
        }
    } catch (error) {
        console.error('Initialization error:', error);
        throw error;
    }
}

// Modal functions
function openModal(modalId) {
    document.getElementById(modalId).style.display = 'flex';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
    document.getElementById('addChoreForm').reset();
}

// Theme toggle
function toggleTheme() {
    document.body.classList.toggle('dark');
    const icon = document.querySelector('.theme-toggle i');
    icon.classList.toggle('fa-moon');
    icon.classList.toggle('fa-sun');
}

// Form submission
async function addChore() {
    try {
        const choreData = {
            title: document.getElementById('choreName').value,
            category: document.getElementById('choreCategory').value,
            assignee_id: document.getElementById('choreAssignee').value,
            frequency: document.getElementById('choreFrequency').value,
            difficulty: document.getElementById('choreDifficulty').value,
            priority: document.getElementById('chorePriority').value,
            time_of_day: document.getElementById('timeOfDay').value,
            seasonal_schedule: document.getElementById('seasonalSchedule').value,
            required_tools: document.getElementById('requiredTools').value,
            notes: document.getElementById('choreNotes').value,
            due_date: document.getElementById('choreDueDate').value
        };

        const { data, error } = await supabase
            .from('chores')
            .insert([choreData])
            .select();

        if (error) throw error;

        closeModal('addChoreModal');
        updateChoreList();
        updatePoints();
    } catch (error) {
        console.error('Error adding chore:', error);
        showError('Error adding chore: ' + error.message);
        const { data: users, error } = await supabase
            .from('users')
            .select('id, name')
            .order('name');

        if (error) throw error;

        const assigneeSelect = document.getElementById('choreAssignee');
        users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = user.name;
            assigneeSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error populating assignees:', error);
    }
}

// Update chore list
async function updateChoreList() {
    try {
        const categoryFilter = document.getElementById('categoryFilter').value;
        const statusFilter = document.getElementById('statusFilter').value;
        const searchInput = document.getElementById('searchInput').value.toLowerCase();

        let query = supabase
            .from('chores')
            .select('*')
            .order('priority', { ascending: false })
            .order('due_date');

        if (categoryFilter) {
            query = query.eq('category', categoryFilter);
        }

        if (statusFilter) {
            query = query.eq('status', statusFilter);
        }

        if (searchInput) {
            query = query.ilike('title', `%${searchInput}%`);
        }

        const { data: chores, error } = await query;

        if (error) throw error;

        const choresContainer = document.querySelector('.chores-list');
        choresContainer.innerHTML = '';

        chores.forEach(chore => {
            const choreItem = document.createElement('div');
            choreItem.className = 'chore-item bg-gray-800 rounded-lg p-4';
            choreItem.innerHTML = `
                <div class="chore-details">
                    <h3 class="text-lg font-semibold">${chore.title}</h3>
                    <div class="chore-meta text-sm text-gray-400">
                        <span class="category-${chore.category}">${chore.category}</span>
                        <span>•</span>
                        <span>${chore.priority}</span>
                        <span>•</span>
                        <span>${chore.frequency}</span>
                    </div>
                </div>
                <div class="chore-actions">
                    <button onclick="markComplete(${chore.id})" class="btn btn-primary">
                        <i class="fas fa-check"></i>
                    </button>
                    <button onclick="skipChore(${chore.id})" class="btn btn-secondary">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
            choresContainer.appendChild(choreItem);
        });
    } catch (error) {
        console.error('Error updating chore list:', error);
    }
}

// Update points
async function updatePoints() {
    try {
        const { data: stats, error } = await supabase
            .from('points_stats')
            .select('*')
            .single();

        if (error) throw error;

        document.getElementById('todayPoints').textContent = stats.today_points;
        document.getElementById('weeklyPoints').textContent = stats.weekly_points;
        document.getElementById('monthlyPoints').textContent = stats.monthly_points;

        // Update progress bars
        document.getElementById('todayProgress').style.width = `${(stats.today_points / 100) * 100}%`;
        document.getElementById('weeklyProgress').style.width = `${(stats.weekly_points / 500) * 100}%`;
        document.getElementById('monthlyProgress').style.width = `${(stats.monthly_points / 2000) * 100}%`;
    } catch (error) {
        console.error('Error updating points:', error);
    }
}

// Mark chore as complete
async function markComplete(choreId) {
    try {
        const { data, error } = await supabase
            .from('chores')
            .update({ status: 'completed' })
            .eq('id', choreId);

        if (error) throw error;

        updateChoreList();
        updatePoints();
    } catch (error) {
        console.error('Error marking chore complete:', error);
    }
}

// Skip chore
async function skipChore(choreId) {
    try {
        const { data, error } = await supabase
            .from('chores')
            .update({ status: 'skipped' })
            .eq('id', choreId);

        if (error) throw error;

        updateChoreList();
    } catch (error) {
        console.error('Error skipping chore:', error);
    }
}

// Category Management
async function loadCategories() {
    try {
        const { data: categories, error: catError } = await supabase
            .from('categories')
            .select('*');

        if (catError) {
            console.error('Error loading categories:', catError);
            return;
        }

        updateCategorySelect('categoryFilter', categories);
        updateCategorySelect('choreCategory', categories);
        await loadWeatherData();
    } catch (error) {
        console.error('Error in loadCategories:', error);
    }
}

function updateCategorySelect(selectId, categories) {
    const select = document.getElementById(selectId);
    if (!select) return;

    select.innerHTML = '';
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.name;
        option.className = `category-${category.name.toLowerCase()}`;
        select.appendChild(option);
    });
}

// Weather Integration
async function loadWeatherData() {
    try {
        if (!ENV.WEATHER_API_KEY) {
            console.warn('Weather API key not configured');
            return;
        }

        const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
        });

        const { lat, lon } = position.coords;
        const weatherResponse = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${ENV.WEATHER_API_KEY}&units=metric`
        );
        const weatherData = await weatherResponse.json();

        updateWeatherUI(weatherData);
        updateSuggestedChores();
    } catch (error) {
        console.error('Error loading weather data:', error);
    }
}

function updateWeatherUI(weatherData) {
    const weatherSuggestions = document.getElementById('weatherSuggestions');
    if (!weatherSuggestions) return;

    const mainWeather = weatherData.weather[0].main;
    const description = weatherData.weather[0].description;
    const temp = Math.round(weatherData.main.temp);

    weatherSuggestions.innerHTML = `
        <div class="weather-suggestion">
            <i class="fas fa-${getWeatherIcon(mainWeather)} weather-icon"></i>
            <div>
                <span>${description}</span>
                <span class="weather-temp">${temp}°C</span>
            </div>
            ${getWeatherBasedSuggestions(mainWeather)}
        </div>
    `;
}

// Chore Management
async function addChore() {
    try {
        const choreData = {
            title: document.getElementById('choreName').value,
            category_id: document.getElementById('choreCategory').value,
            assignee_id: document.getElementById('choreAssignee').value,
            due_date: document.getElementById('choreDueDate').value,
            priority: document.getElementById('chorePriority').value,
            time_of_day: document.getElementById('timeOfDay').value,
            frequency: document.getElementById('choreFrequency').value,
            difficulty: document.getElementById('choreDifficulty').value,
            seasonal_schedule: document.getElementById('seasonalSchedule').value,
            required_tools: document.getElementById('requiredTools').value,
            notes: document.getElementById('choreNotes').value
        };

        // Calculate points based on difficulty and frequency
        const points = calculateChorePoints(choreData);
        choreData.points = points;

        const { data, error } = await supabase
            .from('chores')
            .insert([choreData])
            .select();

        if (error) throw error;
        
        updateChoreList();
        showNotification('Chore added successfully!');
    } catch (error) {
        console.error('Error adding chore:', error);
        showNotification('Failed to add chore');
    }
}

// Achievement System
async function loadAchievements() {
    try {
        const achievementsDiv = document.getElementById('achievements');
        if (!achievementsDiv) return;

        const achievements = [
            // Points achievements
            ...ACHIEVEMENT_THRESHOLDS.points.daily.map(points => createPointsAchievement('daily', points)),
            ...ACHIEVEMENT_THRESHOLDS.points.weekly.map(points => createPointsAchievement('weekly', points)),
            ...ACHIEVEMENT_THRESHOLDS.points.monthly.map(points => createPointsAchievement('monthly', points)),
            // Streak achievements
            ...ACHIEVEMENT_THRESHOLDS.streaks.daily.map(days => createStreakAchievement('daily', days)),
            ...ACHIEVEMENT_THRESHOLDS.streaks.weekly.map(weeks => createStreakAchievement('weekly', weeks)),
            ...ACHIEVEMENT_THRESHOLDS.streaks.monthly.map(months => createStreakAchievement('monthly', months)),
            // Category achievements
            ...ACHIEVEMENT_THRESHOLDS.categories.map(categories => createCategoryAchievement(categories)),
            // Challenge achievements
            ...ACHIEVEMENT_THRESHOLDS.challenges.map(challenges => createChallengeAchievement(challenges))
        ];

        achievementsDiv.innerHTML = achievements.map(achievement => createAchievementHTML(achievement)).join('');
    } catch (error) {
        console.error('Error loading achievements:', error);
    }
}

function createPointsAchievement(period, points) {
    return {
        id: `${period}-points-${points}`,
        title: `${period.charAt(0).toUpperCase() + period.slice(1)} Master (${points} points)`,
        description: `Complete ${points} points in a ${period}`,
        type: 'points',
        period,
        threshold: points,
        icon: 'fas fa-trophy'
    };
}

function createStreakAchievement(period, streak) {
    return {
        id: `${period}-streak-${streak}`,
        title: `${period.charAt(0).toUpperCase() + period.slice(1)} Streak (${streak} ${period})`,
        description: `Complete chores for ${streak} consecutive ${period}`,
        type: 'streak',
        period,
        threshold: streak,
        icon: 'fas fa-fire'
    };
}

function createCategoryAchievement(categories) {
    return {
        id: `category-master-${categories}`,
        title: `Category Master (${categories} categories)`,
        description: `Complete all chores in ${categories} categories`,
        type: 'category',
        period: 'all',
        threshold: categories,
        icon: 'fas fa-crown'
    };
}

function createChallengeAchievement(challenges) {
    return {
        id: `challenge-master-${challenges}`,
        title: `Challenge Master (${challenges} challenges)`,
        description: `Complete ${challenges} family challenges`,
        type: 'challenge',
        period: 'all',
        threshold: challenges,
        icon: 'fas fa-award'
    };
}

function createAchievementHTML(achievement) {
    return `
        <div class="achievement-card ${achievement.type}-${achievement.period} ${achievement.threshold}"
             onclick="viewAchievement('${achievement.id}')">
            <i class="${achievement.icon} achievement-icon"></i>
            <h4>${achievement.title}</h4>
            <p>${achievement.description}</p>
            <div class="achievement-progress">
                <span>0/${achievement.threshold}</span>
            </div>
        </div>
    `;
}

// Initialization
async function initializeApp() {
    await initializeSupabase();
    await loadCategories();
    await loadAchievements();
    await loadChallenges();
    initializeCharts();
    setupSwipeActions();
    setupVoiceCommands();
}

// Start the app
document.addEventListener('DOMContentLoaded', initializeApp);
