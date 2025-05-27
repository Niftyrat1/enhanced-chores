// Import required packages
import fuzzySearch from 'fuzzy-search';
import { createClient } from '@supabase/supabase-js';

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
    },
    seasonalSchedule: {
        spring: 1.1,
        summer: 1.2,
        fall: 1.1,
        winter: 0.9,
        none: 1
    }
};

// Environment Configuration
const ENV = {
    SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL',
    SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_KEY',
    WEATHER_API_KEY: import.meta.env.VITE_WEATHER_API_KEY || 'YOUR_WEATHER_API_KEY'
};

// Initialize Supabase client
const supabase = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY);

// Calculate chore points based on various factors
function calculateChorePoints(chore) {
    const basePoints = 10; // Base points for any chore
    
    // Calculate multipliers
    const frequencyMultiplier = POINTS_SYSTEM.frequency[chore.frequency] || 1;
    const difficultyMultiplier = POINTS_SYSTEM.difficulty[chore.difficulty] || 1;
    const priorityMultiplier = POINTS_SYSTEM.priority[chore.priority] || 1;
    const timeMultiplier = POINTS_SYSTEM.timeOfDay[chore.time_of_day] || 1;
    const seasonalMultiplier = POINTS_SYSTEM.seasonalSchedule[chore.seasonal_schedule] || 1;
    
    // Calculate total points
    return Math.round(basePoints * frequencyMultiplier * difficultyMultiplier * priorityMultiplier * timeMultiplier * seasonalMultiplier);
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
        // Get form elements
        const form = document.getElementById('addChoreForm');
        if (!form) throw new Error('Add chore form not found');

        // Get form data
        const choreData = {
            title: form.querySelector('#choreName').value.trim(),
            category: form.querySelector('#choreCategory').value.trim(),
            assignee_id: form.querySelector('#choreAssignee').value,
            frequency: form.querySelector('#choreFrequency').value,
            difficulty: form.querySelector('#choreDifficulty').value,
            priority: form.querySelector('#chorePriority').value,
            time_of_day: form.querySelector('#timeOfDay').value,
            seasonal_schedule: form.querySelector('#seasonalSchedule').value,
            required_tools: form.querySelector('#requiredTools').value.trim(),
            notes: form.querySelector('#choreNotes').value.trim(),
            due_date: form.querySelector('#choreDueDate').value
        };

        // Validate required fields
        if (!choreData.title || !choreData.category) {
            throw new Error('Title and Category are required');
        }

        // Validate date
        if (choreData.due_date) {
            const dueDate = new Date(choreData.due_date);
            if (isNaN(dueDate.getTime())) {
                throw new Error('Invalid due date format');
            }
        }

        // Validate required fields
        const requiredFields = ['frequency', 'difficulty', 'priority', 'time_of_day', 'seasonal_schedule'];
        const missingFields = requiredFields.filter(field => !choreData[field]);
        if (missingFields.length > 0) {
            throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
        }

        // Calculate points
        const points = calculateChorePoints(choreData);
        choreData.points = points;

        // Insert into database
        const { data, error } = await supabase
            .from('chores')
            .insert([choreData])
            .select();

        if (error) throw error;

        // Clear form
        form.reset();
        closeModal('addChoreModal');
        
        // Update UI
        updateChoreList();
        updatePoints();
        
        alert('Chore added successfully!');
    } catch (error) {
        console.error('Error adding chore:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
        alert(`Error adding chore: ${errorMessage}`);
    }
}

// Function to update chore list
async function updateChoreList() {
    try {
        // Get filter elements
        const categoryFilter = document.getElementById('categoryFilter');
        const statusFilter = document.getElementById('statusFilter');
        const searchInput = document.getElementById('searchInput');

        if (!categoryFilter || !statusFilter || !searchInput) {
            throw new Error('Required DOM elements not found');
        }

        // Validate filter values
        const category = categoryFilter.value.trim();
        const status = statusFilter.value.trim();
        const search = searchInput.value.trim().toLowerCase();

        // Build query
        let query = supabase
            .from('chores')
            .select('*')
            .order('priority', { ascending: false })
            .order('due_date');

        // Apply filters
        if (category) {
            query = query.eq('category', category);
        }

        if (status) {
            query = query.eq('status', status);
        }

        if (search) {
            query = query.ilike('title', `%${search}%`);
        }

        // Execute query
        const { data: chores, error } = await query;

        if (error) throw error;

        // Update UI
        const choresContainer = document.querySelector('.chores-list');
        if (!choresContainer) {
            throw new Error('Chores container not found');
        }

        choresContainer.innerHTML = '';

        // Create chore items
        chores.forEach(chore => {
            const choreItem = document.createElement('div');
            choreItem.className = 'chore-item bg-gray-700 rounded-lg p-4 mb-4';
            choreItem.setAttribute('role', 'listitem');
            choreItem.setAttribute('aria-label', `Chore: ${chore.title}`);

            choreItem.innerHTML = `
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <h3 class="text-lg font-semibold" role="heading" aria-level="3">${chore.title}</h3>
                        <div class="text-sm text-gray-400">
                            <span class="category-${chore.category}" role="status">${chore.category}</span>
                            • ${new Date(chore.due_date).toLocaleDateString()}
                            • ${chore.points} points
                            • ${chore.priority}
                            • ${chore.frequency}
                        </div>
                        ${chore.notes ? `<p class="mt-2 text-gray-400" role="note">${chore.notes}</p>` : ''}
                    </div>
                    <div class="flex space-x-2">
                        <button 
                            onclick="markChoreComplete(${chore.id})" 
                            class="px-3 py-1 rounded bg-green-500 hover:bg-green-600 text-white"
                            role="button"
                            aria-label="Mark chore as complete"
                        >
                            Complete
                        </button>
                        <button 
                            onclick="skipChore(${chore.id})" 
                            class="px-3 py-1 rounded bg-red-500 hover:bg-red-600 text-white"
                            role="button"
                            aria-label="Skip chore"
                        >
                            Skip
                        </button>
                        <button 
                            onclick="postponeChore(${chore.id})" 
                            class="px-3 py-1 rounded bg-yellow-500 hover:bg-yellow-600 text-white"
                            role="button"
                            aria-label="Postpone chore"
                        >
                            Postpone
                        </button>
                    </div>
                </div>
            `;

            choresContainer.appendChild(choreItem);
        });
    } catch (error) {
        console.error('Error updating chore list:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
        alert(`Error updating chore list: ${errorMessage}`);
    }
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
    try {
        const themeIcon = document.getElementById('themeIcon');
        const themeText = document.getElementById('themeText');

        if (!themeIcon || !themeText) {
            throw new Error('Theme toggle elements not found');
        }

        document.body.classList.toggle('dark');
        document.body.classList.toggle('light');
        
        const isDark = document.body.classList.contains('dark');
        themeIcon.textContent = isDark ? '☀️' : '🌙';
        themeText.textContent = isDark ? 'Light Mode' : 'Dark Mode';

        // Save theme preference
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    } catch (error) {
        console.error('Error toggling theme:', error);
        alert('Error toggling theme: ' + error.message);
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

// Core Functions
async function initializeSupabase() {
    try {
        if (!ENV.SUPABASE_URL || !ENV.SUPABASE_ANON_KEY) {
            throw new Error('Supabase configuration missing');
        }

        // Initialize Supabase client
        supabase = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY);

        // Test connection
        try {
            const { data, error } = await supabase
                .from('chores')
                .select('id')
                .single();

            if (error) {
                console.error('Database connection error:', error);
                throw new Error('Failed to connect to database');
            }
            
            console.log('Connected to database successfully');
        } catch (error) {
            console.error('Error testing database connection:', error);
            throw error;
        }

        // Initialize additional features
        try {
            await setupRealtimeSubscriptions();
            console.log('Realtime subscriptions initialized successfully');
        } catch (initError) {
            console.error('Error initializing features:', initError);
            throw new Error('Failed to initialize features');
        }
    } catch (error) {
        console.error('Initialization error:', error);
        throw error;
    }
}

// Helper functions
async function setupRealtimeSubscriptions() {
    try {
        // Listen for chore changes
        supabase
            .channel('chore-changes')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'chores',
            }, (payload) => {
                console.log('Change received:', payload);
                const categoryFilter = document.getElementById('categoryFilter').value;
                const statusFilter = document.getElementById('statusFilter').value;
                const searchInput = document.getElementById('searchInput').value.toLowerCase();
                updateChoreList(categoryFilter, statusFilter, searchInput);
            })
            .subscribe();

        // Listen for points changes
    } catch (error) {
        console.error('Error setting up realtime subscriptions:', error);
    }
}

// Update chore list
async function updateChoreList(categoryFilter, statusFilter, searchInput) {
    try {
        const query = supabase
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
        if (!stats) throw new Error('No stats data returned from database');

        // Type check the data
        if (typeof stats.today_points !== 'number' ||
            typeof stats.weekly_points !== 'number' ||
            typeof stats.monthly_points !== 'number' ||
            typeof stats.total_points !== 'number') {
            throw new Error('Invalid points data type');
        }

        const pointsDisplay = document.getElementById('pointsDisplay');
        if (pointsDisplay) {
            pointsDisplay.textContent = stats.total_points;
        }

        const todayPoints = document.getElementById('todayPoints');
        const weeklyPoints = document.getElementById('weeklyPoints');
        const monthlyPoints = document.getElementById('monthlyPoints');

        if (todayPoints) todayPoints.textContent = stats.today_points;
        if (weeklyPoints) weeklyPoints.textContent = stats.weekly_points;
        if (monthlyPoints) monthlyPoints.textContent = stats.monthly_points;

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
