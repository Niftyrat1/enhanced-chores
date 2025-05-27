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

// Core Functions
async function initializeSupabase() {
    try {
        if (!ENV.SUPABASE_URL || !ENV.SUPABASE_ANON_KEY) {
            throw new Error('Supabase configuration missing');
        }

        const { data, error } = await supabase
            .from('chores')
            .select('id')
            .single();

        if (error) {
            console.error('Database connection error:', error);
            showConnectionError('Failed to connect to database');
            return;
        }

        console.log('Connected to database successfully');
        updateConnectionStatus('connected', 'Connected to database');
        
        // Initialize additional features
        try {
            await createHistoryTable();
            await createAchievementSystem();
            await setupRealtimeSubscriptions();
        } catch (initError) {
            console.error('Error initializing features:', initError);
            showConnectionError('Failed to initialize features');
        }
    } catch (error) {
        console.error('Initialization error:', error);
        showConnectionError('Failed to initialize app');
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
