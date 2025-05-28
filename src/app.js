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

export async function addChore() {
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

export function calculateChorePoints(chore) {
    const basePoints = 10;
    const frequencyMultiplier = POINTS_SYSTEM.frequency[chore.frequency] || 1;
    const difficultyMultiplier = POINTS_SYSTEM.difficulty[chore.difficulty] || 1;
    const priorityMultiplier = POINTS_SYSTEM.priority[chore.priority] || 1;
    const timeMultiplier = POINTS_SYSTEM.timeOfDay[chore.time_of_day] || 1;
    const seasonalMultiplier = POINTS_SYSTEM.seasonalSchedule[chore.seasonal_schedule] || 1;
    return Math.round(basePoints * frequencyMultiplier * difficultyMultiplier * priorityMultiplier * timeMultiplier * seasonalMultiplier);
}

export async function populateAssignees() {
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
export async function updateChoreList(supabase, categoryFilter = '', statusFilter = '', searchInput = '') {
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

export async function markChoreComplete(choreId) {
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

export async function skipChore(choreId) {
    try {
        const { error } = await supabase
            .from('chores')
            .update({ status: 'skipped' })
            .eq('id', choreId);

        if (error) throw error;

        // Update UI
        updateChoreList(supabase);
    } catch (error) {
        console.error('Error skipping chore:', error);
    }
}

// Function to update points display
export async function updatePoints() {
    try {
        // Get today's date
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get points for today
        const { data: todayData, error: todayError } = await supabase
            .from('chores')
            .select('points')
            .eq('status', 'completed')
            .gte('completed_at', today.toISOString())
            .lte('completed_at', new Date(today.getTime() + 86400000).toISOString());

        if (todayError) throw todayError;
        const todayPoints = todayData.reduce((sum, chore) => sum + chore.points, 0);

        // Get points for this week
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        const { data: weekData, error: weekError } = await supabase
            .from('chores')
            .select('points')
            .eq('status', 'completed')
            .gte('completed_at', weekStart.toISOString())
            .lte('completed_at', new Date(weekStart.getTime() + 604800000).toISOString());

        if (weekError) throw weekError;
        const weekPoints = weekData.reduce((sum, chore) => sum + chore.points, 0);

        // Get points for this month
        const monthStart = new Date(today);
        monthStart.setDate(1);
        const { data: monthData, error: monthError } = await supabase
            .from('chores')
            .select('points')
            .eq('status', 'completed')
            .gte('completed_at', monthStart.toISOString())
            .lte('completed_at', new Date(monthStart.getTime() + 2678400000).toISOString());

        if (monthError) throw monthError;
        const monthPoints = monthData.reduce((sum, chore) => sum + chore.points, 0);

        // Update UI
        document.getElementById('todayPoints').textContent = todayPoints;
        document.getElementById('weekPoints').textContent = weekPoints;
        document.getElementById('monthPoints').textContent = monthPoints;

        // Update progress bars
        updateProgressBars(todayPoints, weekPoints, monthPoints);
    } catch (error) {
        console.error('Error updating points:', error);
    }
}

export function updateProgressBars(todayPoints, weekPoints, monthPoints) {
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
    updateTheme();
});

export function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.classList.toggle('dark-theme', savedTheme === 'dark');
    updateTheme();
}

// Modal functions
export function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'block';
}

export function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'none';
}

// Core Functions
export async function testDatabaseConnection() {
    try {
        const { data, error } = await supabase.from('chores').select('id').limit(1);
        if (error) throw error;
        console.log('Database connection successful');
        return true;
    } catch (error) {
        console.error('Database connection failed:', error);
        return false;
    }
}

export async function initializeSupabase() {
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
export async function setupRealtimeSubscriptions() {
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
export async function loadCategories() {
    try {
        const { data, error } = await supabase.from('categories').select('*');
        if (error) throw error;
        
        updateCategorySelect('addChoreCategory', data);
        updateCategorySelect('editChoreCategory', data);
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

export function updateCategorySelect(selectId, categories) {
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
export async function loadWeatherData() {
    try {
        const response = await fetch(`https://api.weatherapi.com/v1/current.json?key=${ENV.WEATHER_API_KEY}&q=auto:ip`);
        const data = await response.json();
        updateWeatherUI(data);
    } catch (error) {
        console.error('Error loading weather data:', error);
    }
}

export function updateWeatherUI(weatherData) {
    document.getElementById('weatherTemp').textContent = `${weatherData.current.temp_c}°C`;
    document.getElementById('weatherCondition').textContent = weatherData.current.condition.text;
    document.getElementById('weatherIcon').src = weatherData.current.condition.icon;
}

// Achievement System
export async function loadAchievements() {
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

export function createPointsAchievement(period, points) {
    return {
        type: 'points',
        period,
        value: points,
        description: `Earn ${points} points in ${period}`,
        achieved: false
    };
}

export function createStreakAchievement(period, streak) {
    return {
        type: 'streak',
        period,
        value: streak,
        description: `Complete chores for ${streak} consecutive ${period}`,
        achieved: false
    };
}

export function createCategoryAchievement(categories) {
    return {
        type: 'category',
        value: categories.length,
        description: `Complete chores in ${categories.length} different categories`,
        achieved: false
    };
}

export function createChallengeAchievement(challenges) {
    return {
        type: 'challenge',
        value: challenges.length,
        description: `Complete ${challenges.length} challenges`,
        achieved: false
    };
}

export function createAchievementHTML(achievement) {
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
