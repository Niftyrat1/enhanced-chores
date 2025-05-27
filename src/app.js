// Environment Configuration
const ENV = {
    SUPABASE_URL: process.env.VITE_SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY,
    WEATHER_API_KEY: process.env.VITE_WEATHER_API_KEY
};

// Check if required environment variables are set
if (!ENV.SUPABASE_URL || !ENV.SUPABASE_ANON_KEY) {
    throw new Error('Supabase environment variables are not configured');
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
        updateChoreList(supabase);
        updatePoints(supabase);
        
        alert('Chore added successfully!');
    } catch (error) {
        console.error('Error adding chore:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
        alert(`Error adding chore: ${errorMessage}`);
    }
}

// Function to calculate chore points
function calculateChorePoints(chore) {
    const basePoints = 10;
    const frequencyMultiplier = POINTS_SYSTEM.frequency[chore.frequency] || 1;
    const difficultyMultiplier = POINTS_SYSTEM.difficulty[chore.difficulty] || 1;
    const priorityMultiplier = POINTS_SYSTEM.priority[chore.priority] || 1;
    const timeMultiplier = POINTS_SYSTEM.timeOfDay[chore.time_of_day] || 1;
    const seasonalMultiplier = POINTS_SYSTEM.seasonalSchedule[chore.seasonal_schedule] || 1;
    return Math.round(basePoints * frequencyMultiplier * difficultyMultiplier * priorityMultiplier * timeMultiplier * seasonalMultiplier);
}

// Function to populate assignee dropdown
async function populateAssignees() {
    const { data, error } = await supabase.from('users').select('id, name');
    if (error) throw error;
    
    const assigneeSelect = document.getElementById('choreAssignee');
    if (!assigneeSelect) return;
    
    assigneeSelect.innerHTML = '<option value="">Select Assignee</option>';
    data.forEach(user => {
        const option = document.createElement('option');
        option.value = user.id;
        option.textContent = user.name;
        assigneeSelect.appendChild(option);
    });
}

// Function to update chore list
async function updateChoreList(supabase, categoryFilter = '', statusFilter = '', searchInput = '') {
    try {
        // Build query
        let query = supabase.from('chores').select('*');
        
        // Apply filters
        if (categoryFilter) {
            query = query.eq('category', categoryFilter);
        }
        if (statusFilter) {
            query = query.eq('status', statusFilter);
        }
        
        // Get data
        const { data, error } = await query;
        if (error) throw error;
        
        // Filter by search
        const filteredChores = data.filter(chore => 
            chore.title.toLowerCase().includes(searchInput.toLowerCase()) ||
            chore.category.toLowerCase().includes(searchInput.toLowerCase()) ||
            chore.notes.toLowerCase().includes(searchInput.toLowerCase())
        );
        
        // Sort by due date
        filteredChores.sort((a, b) => {
            const dateA = new Date(a.due_date || '').getTime();
            const dateB = new Date(b.due_date || '').getTime();
            return dateA - dateB;
        });
        
        // Update UI
        const choreList = document.getElementById('choreList');
        if (!choreList) return;
        
        choreList.innerHTML = filteredChores.map(chore => `
            <div class="chore-item ${chore.status}">
                <h3>${chore.title}</h3>
                <p>Category: ${chore.category}</p>
                <p>Due: ${chore.due_date ? moment(chore.due_date).format('MMM D, YYYY') : 'No due date'}</p>
                <p>Points: ${chore.points}</p>
                <div class="chore-actions">
                    <button onclick="markChoreComplete('${chore.id}')">Complete</button>
                    <button onclick="skipChore('${chore.id}')">Skip</button>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error updating chore list:', error);
    }
}

// Function to mark chore as complete
async function markChoreComplete(choreId) {
    try {
        const { error } = await supabase
            .from('chores')
            .update({ status: 'completed' })
            .eq('id', choreId);
        
        if (error) throw error;
        updateChoreList(supabase);
        updatePoints(supabase);
    } catch (error) {
        console.error('Error marking chore complete:', error);
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
        updateChoreList(supabase);
    } catch (error) {
        console.error('Error skipping chore:', error);
    }
}

// Function to update points display
async function updatePoints() {
    try {
        const { data, error } = await supabase
            .from('chores')
            .select('points, status')
            .eq('status', 'completed');
            
        if (error) throw error;
        
        const totalPoints = data.reduce((sum, chore) => sum + chore.points, 0);
        
        const todayPoints = data
            .filter(chore => moment(chore.status_updated_at).isSame(moment(), 'day'))
            .reduce((sum, chore) => sum + chore.points, 0);
        
        const weekPoints = data
            .filter(chore => moment(chore.status_updated_at).isSame(moment(), 'week'))
            .reduce((sum, chore) => sum + chore.points, 0);
        
        const monthPoints = data
            .filter(chore => moment(chore.status_updated_at).isSame(moment(), 'month'))
            .reduce((sum, chore) => sum + chore.points, 0);
        
        updateProgressBars(todayPoints, weekPoints, monthPoints);
        
        document.getElementById('totalPoints').textContent = totalPoints.toString();
        document.getElementById('todayPoints').textContent = todayPoints.toString();
        document.getElementById('weekPoints').textContent = weekPoints.toString();
        document.getElementById('monthPoints').textContent = monthPoints.toString();
        
    } catch (error) {
        console.error('Error updating points:', error);
    }
}

// Function to update progress bars
function updateProgressBars(todayPoints, weekPoints, monthPoints) {
    const todayBar = document.getElementById('todayProgress');
    const weekBar = document.getElementById('weekProgress');
    const monthBar = document.getElementById('monthProgress');
    
    const todayTarget = 100; // Daily target points
    const weekTarget = 500; // Weekly target points
    const monthTarget = 2000; // Monthly target points
    
    todayBar.style.width = `${(todayPoints / todayTarget) * 100}%`;
    weekBar.style.width = `${(weekPoints / weekTarget) * 100}%`;
    monthBar.style.width = `${(monthPoints / monthTarget) * 100}%`;
}

// Function to toggle theme
document.getElementById('themeToggle').addEventListener('click', () => {
    document.body.classList.toggle('dark-theme');
    localStorage.setItem('theme', document.body.classList.contains('dark-theme') ? 'dark' : 'light');
});

// Initialize theme
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.classList.toggle('dark-theme', savedTheme === 'dark');
}

// Modal functions
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'block';
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'none';
}

// Core Functions
async function testDatabaseConnection() {
    try {
        const { data, error } = await supabase.from('chores').select('id').limit(1);
        if (error) throw error;
        console.log('Database connection successful');
    } catch (error) {
        console.error('Database connection failed:', error);
    }
}

async function initializeSupabase() {
    try {
        await testDatabaseConnection();
        await setupRealtimeSubscriptions();
        await initializeTheme();
        await updateChoreList(supabase);
        await updatePoints();
        await loadCategories();
        await loadWeatherData();
        await loadAchievements();
    } catch (error) {
        console.error('Error initializing app:', error);
    }
}

// Helper functions
async function setupRealtimeSubscriptions() {
    supabase
        .channel('chore-updates')
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'chores',
        }, () => {
            updateChoreList(supabase);
            updatePoints(supabase);
        })
        .subscribe();
}

// Category Management
async function loadCategories() {
    try {
        const { data, error } = await supabase.from('categories').select('*');
        if (error) throw error;
        
        updateCategorySelect('addChoreCategory', data);
        updateCategorySelect('editChoreCategory', data);
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

function updateCategorySelect(selectId, categories) {
    const select = document.getElementById(selectId);
    if (!select) return;
    
    select.innerHTML = '<option value="">Select Category</option>';
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.name;
        option.textContent = category.name;
        select.appendChild(option);
    });
}

// Weather Integration
async function loadWeatherData() {
    try {
        const response = await fetch(`https://api.weatherapi.com/v1/current.json?key=${ENV.WEATHER_API_KEY}&q=auto:ip`);
        const data = await response.json();
        updateWeatherUI(data);
    } catch (error) {
        console.error('Error loading weather data:', error);
    }
}

function updateWeatherUI(weatherData) {
    document.getElementById('weatherTemp').textContent = `${weatherData.current.temp_c}°C`;
    document.getElementById('weatherCondition').textContent = weatherData.current.condition.text;
    document.getElementById('weatherIcon').src = weatherData.current.condition.icon;
}

// Achievement System
async function loadAchievements() {
    try {
        const { data, error } = await supabase.from('achievements').select('*');
        if (error) throw error;
        
        const achievementList = document.getElementById('achievementList');
        if (!achievementList) return;
        
        achievementList.innerHTML = data.map(achievement => createAchievementHTML(achievement)).join('');
    } catch (error) {
        console.error('Error loading achievements:', error);
    }
}

function createPointsAchievement(period, points) {
    return {
        type: 'points',
        period,
        value: points,
        description: `Earn ${points} points in ${period}`,
        achieved: false
    };
}

function createStreakAchievement(period, streak) {
    return {
        type: 'streak',
        period,
        value: streak,
        description: `Complete chores for ${streak} consecutive ${period}`,
        achieved: false
    };
}

function createCategoryAchievement(categories) {
    return {
        type: 'category',
        value: categories.length,
        description: `Complete chores in ${categories.length} different categories`,
        achieved: false
    };
}

function createChallengeAchievement(challenges) {
    return {
        type: 'challenge',
        value: challenges.length,
        description: `Complete ${challenges.length} challenges`,
        achieved: false
    };
}

function createAchievementHTML(achievement) {
    const className = achievement.achieved ? 'achievement-completed' : 'achievement-pending';
    return `
        <div class="achievement ${className}">
            <h3>${achievement.description}</h3>
            <p>Period: ${achievement.period}</p>
            <p>Progress: ${achievement.achieved ? 'Completed' : 'Pending'}</p>
        </div>
    `;
}

// Initialization
document.addEventListener('DOMContentLoaded', initializeSupabase);
