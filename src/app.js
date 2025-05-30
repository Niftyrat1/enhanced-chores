// Imports
import { supabase } from './config/supabase.js';

// Environment Configuration
const ENV = {
    SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
    WEATHER_API_KEY: import.meta.env.VITE_WEATHER_API_KEY
};

if (!ENV.SUPABASE_URL || !ENV.SUPABASE_ANON_KEY) {
    throw new Error('Supabase environment variables are not configured');
}

// Initialize Supabase
export function initializeSupabase() {
    if (!supabase) {
        throw new Error('Supabase client not initialized');
    }
    return supabase;
}

// Theme initialization
export function initializeTheme() {
    if (!document || !document.documentElement) return;

    const savedTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    document.documentElement.classList.toggle('light', savedTheme !== 'dark');

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        const newTheme = e.matches ? 'dark' : 'light';
        localStorage.setItem('theme', newTheme);
        document.documentElement.classList.toggle('dark', newTheme === 'dark');
        document.documentElement.classList.toggle('light', newTheme !== 'light');
    });
}

// UI Initialization
export async function initializeUI(supabase) {
    try {
        // Initialize points display
        const pointsDisplay = document.getElementById('pointsDisplay');
        if (pointsDisplay) {
            pointsDisplay.textContent = '0 points';
            pointsDisplay.setAttribute('role', 'status');
            pointsDisplay.setAttribute('aria-live', 'polite');
        }

        // Initialize filters
        const categoryFilter = document.getElementById('categoryFilter');
        const statusFilter = document.getElementById('statusFilter');
        if (categoryFilter && statusFilter) {
            categoryFilter.value = '';
            statusFilter.value = '';
            categoryFilter.setAttribute('aria-label', 'Filter chores by category');
            statusFilter.setAttribute('aria-label', 'Filter chores by status');
        }

        // Initialize search
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.value = '';
            searchInput.setAttribute('aria-label', 'Search chores');
            searchInput.setAttribute('placeholder', 'Search chores...');
        }

        // Initialize assignee select
        const assigneeSelect = document.getElementById('choreAssignee');
        if (assigneeSelect) {
            assigneeSelect.innerHTML = '<option value="">Select Assignee</option>';
        }

        // Initialize tabs
        const tabs = document.querySelectorAll('.tab');
        const tabContents = document.querySelectorAll('.tab-content');
        if (tabs.length > 0 && tabContents.length > 0) {
            tabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    const targetId = tab.getAttribute('data-tab');
                    const targetContent = document.getElementById(targetId);
                    if (targetContent) {
                        tabs.forEach(t => t.classList.remove('active'));
                        tabContents.forEach(c => c.classList.remove('active'));
                        tab.classList.add('active');
                        targetContent.classList.add('active');
                    }
                });
                tab.setAttribute('role', 'tab');
                tab.setAttribute('aria-selected', 'false');
            });
            tabContents.forEach(content => {
                content.setAttribute('role', 'tabpanel');
                content.setAttribute('hidden', 'true');
            });

            tabs[0].setAttribute('aria-selected', 'true');
            tabContents[0].removeAttribute('hidden');
            tabs[0].classList.add('active');
            tabContents[0].classList.add('active');
        }
    } catch (error) {
        console.error('Error initializing UI:', error);
        throw error;
    }
}

// Event Listeners
export function setupEventListeners(supabase) {
    // Add chore form submission
    const addChoreForm = document.getElementById('addChoreForm');
    if (addChoreForm) {
        addChoreForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await handleAddChoreClick(supabase, e);
        });
    }

    // Filter changes
    const categoryFilter = document.getElementById('categoryFilter');
    const statusFilter = document.getElementById('statusFilter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', () => updateChoreList(supabase));
    }
    if (statusFilter) {
        statusFilter.addEventListener('change', () => updateChoreList(supabase));
    }

    // Search
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', () => updateChoreList(supabase));
    }
}

// Form Handling
export async function handleAddChoreClick(supabase, event) {
    const form = event.target;
    if (!validateForm(form)) return;

    try {
        await addChore(supabase, form);
        form.reset();
        updateChoreList(supabase);
    } catch (error) {
        console.error('Error adding chore:', error);
        alert('Failed to add chore. Please try again.');
    }
}

export function validateForm(form) {
    const requiredFields = ['choreName', 'choreAssignee', 'choreFrequency', 'choreDifficulty', 'chorePriority'];
    for (const field of requiredFields) {
        if (!form[field].value) {
            alert(`Please fill in the ${field.replace('chore', '')} field`);
            return false;
        }
    }
    return true;
}

export async function addChore(supabase, form) {
    const categoryId = form.categoryId.value;
    const { data: users, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('id', form.choreAssignee.value)
        .single();

    if (userError || !users) {
        throw new Error('Selected assignee does not exist');
    }

    const choreData = {
        title: form.choreName.value,
        category_id: categoryId,
        assignee_id: form.choreAssignee.value,
        frequency: form.choreFrequency.value,
        difficulty: parseInt(form.choreDifficulty.value),
        priority: form.chorePriority.value,
        time_of_day: form.timeOfDay.value,
        seasonal_schedule: form.seasonalSchedule.value,
        due_date: form.choreDueDate.value,
        points: calculatePoints(form.choreDifficulty.value, form.chorePriority.value)
    };

    const { error } = await supabase.from('chores').insert(choreData);
    if (error) throw error;
}

// Chore Management
export async function updateChoreList(supabase) {
    try {
        const { data: chores, error } = await supabase
            .from('chores')
            .select('*')
            .order('due_date')
            .order('priority', { ascending: false });

        if (error) throw error;

        const choreList = document.getElementById('choreList');
        if (!choreList) return;

        choreList.innerHTML = chores.map(chore => createChoreHTML(chore)).join('');
    } catch (error) {
        console.error('Error updating chore list:', error);
    }
}

export async function markChoreComplete(supabase, choreId) {
    try {
        const { error } = await supabase
            .from('chores')
            .update({ completed: true })
            .eq('id', choreId);

        if (error) throw error;
        updateChoreList(supabase);
    } catch (error) {
        console.error('Error marking chore complete:', error);
    }
}

export async function skipChore(supabase, choreId) {
    try {
        const { error } = await supabase
            .from('chores')
            .update({ skipped: true })
            .eq('id', choreId);

        if (error) throw error;
        updateChoreList(supabase);
    } catch (error) {
        console.error('Error skipping chore:', error);
    }
}

export async function postponeChore(supabase, choreId, newDate) {
    try {
        const { error } = await supabase
            .from('chores')
            .update({ due_date: newDate })
            .eq('id', choreId);

        if (error) throw error;
        updateChoreList(supabase);
    } catch (error) {
        console.error('Error postponing chore:', error);
    }
}

export async function deleteChore(supabase, choreId) {
    try {
        const { error } = await supabase
            .from('chores')
            .delete()
            .eq('id', choreId);

        if (error) throw error;
        updateChoreList(supabase);
    } catch (error) {
        console.error('Error deleting chore:', error);
    }
}

// User Management
export async function populateAssignees(supabase) {
    try {
        const { data: users, error: userError } = await supabase
            .from('users')
            .select('id, name');
        const { data: categories, error: categoryError } = await supabase
            .from('categories')
            .select('id, name');

        if (userError || categoryError) throw error;

        const assigneeSelect = document.getElementById('choreAssignee');
        if (assigneeSelect) {
            assigneeSelect.innerHTML = '<option value="">Select Assignee</option>' +
                users.map(user => `<option value="${user.id}">${user.name}</option>`).join('');
        }
    } catch (error) {
        console.error('Error populating assignees:', error);
    }
}

// Points and Achievements
export function calculatePoints(difficulty, priority) {
    const diffMultiplier = {
        1: 1,  // Easy
        2: 2,  // Medium
        3: 3   // Hard
    };

    const priorityMultiplier = {
        'low': 1,
        'medium': 1.5,
        'high': 2
    };

    return Math.round((diffMultiplier[difficulty] || 1) * (priorityMultiplier[priority] || 1) * 10);
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

// Initialize the application
window.addEventListener('DOMContentLoaded', async () => {
    try {
        // Initialize Supabase
        const supabase = initializeSupabase();
        
        // Initialize theme
        initializeTheme();
        
        // Initialize UI
        await initializeUI(supabase);
        
        // Setup event listeners
        setupEventListeners(supabase);
    } catch (error) {
        console.error('Error initializing application:', error);
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message bg-red-500 text-white p-4 rounded';
        errorDiv.setAttribute('role', 'alert');
        errorDiv.setAttribute('aria-live', 'assertive');
        errorDiv.textContent = 'Error initializing application. Please refresh the page.';
        document.body.appendChild(errorDiv);
    }
});

// Initialize UI components
export async function initializeUI(supabase) {
    try {
        // Initialize points display
        const pointsDisplay = document.getElementById('pointsDisplay');
        if (pointsDisplay) {
            pointsDisplay.textContent = '0 points';
            pointsDisplay.setAttribute('role', 'status');
            pointsDisplay.setAttribute('aria-live', 'polite');
        }

        // Initialize filters
        const categoryFilter = document.getElementById('categoryFilter');
        const statusFilter = document.getElementById('statusFilter');
        if (categoryFilter && statusFilter) {
            categoryFilter.value = '';
            statusFilter.value = '';
            categoryFilter.setAttribute('aria-label', 'Filter chores by category');
            statusFilter.setAttribute('aria-label', 'Filter chores by status');
        }

        // Initialize search
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.value = '';
            searchInput.setAttribute('aria-label', 'Search chores');
            searchInput.setAttribute('placeholder', 'Search chores...');
        }

        // Initialize assignee select
        const assigneeSelect = document.getElementById('choreAssignee');
        if (assigneeSelect) {
            assigneeSelect.innerHTML = '<option value="">Select Assignee</option>';
        }

        // Initialize tabs
        const tabs = document.querySelectorAll('.tab');
        const tabContents = document.querySelectorAll('.tab-content');
        if (tabs.length > 0 && tabContents.length > 0) {
            // Initialize tab switching
            tabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    const targetId = tab.getAttribute('data-tab');
                    const targetContent = document.getElementById(targetId);
                    
                    if (targetContent) {
                        // Remove active classes from all tabs and contents
                        tabs.forEach(t => t.classList.remove('active'));
                        tabContents.forEach(c => c.classList.remove('active'));
                        
                        // Add active classes to selected tab and content
                        tab.classList.add('active');
                        targetContent.classList.add('active');
                    }
                });
            });

            // Initialize ARIA attributes
            tabs.forEach(tab => {
                tab.setAttribute('role', 'tab');
                tab.setAttribute('aria-selected', 'false');
            });
            tabContents.forEach(content => {
                content.setAttribute('role', 'tabpanel');
                content.setAttribute('hidden', 'true');
            });

            // Show first tab by default
            tabs[0].setAttribute('aria-selected', 'true');
            tabContents[0].removeAttribute('hidden');
            tabs[0].classList.add('active');
            tabContents[0].classList.add('active');
        }

        // Populate assignees and categories
        await populateAssignees(supabase);
    } catch (error) {
        console.error('Error initializing UI:', error);
        throw error;
    }
};

// Add chore button click handler
export function handleAddChoreClick() {
    const modal = document.getElementById('addChoreModal');
    if (modal) {
        modal.classList.add('visible');
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

// Form validation
export function validateForm(form) {
    try {
        const requiredFields = form.querySelectorAll('[required]');
        let isValid = true;

        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                field.classList.add('invalid');
                isValid = false;
            } else {
                field.classList.remove('invalid');
            }
        });

        return isValid;
    } catch (error) {
        console.error('Error validating form:', error);
        return false;
    }
}

// Add chore
export async function addChore(supabase) {
    try {
        const form = document.getElementById('addChoreForm');
        if (!form || !supabase) {
            throw new Error('Form or Supabase client is not available');
        }

        if (!validateForm(form)) {
            alert('Please fill in all required fields');
            return;
        }

        // Validate assignee exists
        const assigneeId = form.choreAssignee.value;
        if (assigneeId && assigneeId !== 'any') {
            const { data: user, error: userError } = await supabase
                .from('users')
                .select('id')
                .eq('id', assigneeId)
                .single();

            if (userError || !user) {
                alert('Selected assignee does not exist in the database');
                return;
            }
        }

        // Get category ID from category select
        const categorySelect = document.getElementById('choreCategory');
        const categoryId = categorySelect.value;
        if (!categoryId) {
            throw new Error('Please select a category');
        }

        const choreData = {
            title: form.choreName.value,
            category_id: categoryId,
            assignee_id: form.choreAssignee.value,
            frequency: form.choreFrequency.value,
            difficulty: parseInt(form.choreDifficulty.value),
            priority: form.chorePriority.value,
            time_of_day: form.timeOfDay.value,
            seasonal_schedule: form.seasonalSchedule.value,
            due_date: form.choreDueDate.value,
            points: calculatePoints(form.choreDifficulty.value, form.chorePriority.value)
        };

        const { data, error } = await supabase
            .from('chores')
            .insert([choreData]);

        if (error) throw error;

        // Close modal
        const modal = document.getElementById('addChoreModal');
        if (modal) {
            modal.classList.remove('visible');
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }

        // Reset form
        form.reset();

        // Update chore list
        updateChoreList(supabase);

        alert('Chore added successfully!');
    } catch (error) {
        console.error('Error adding chore:', error);
        const errorMessage = error.message || 'An unknown error occurred';
        console.error('Error adding chore:', error);
        
        // Create error message element
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message bg-red-500 text-white p-4 rounded mb-4';
        errorDiv.setAttribute('role', 'alert');
        errorDiv.setAttribute('aria-live', 'assertive');
        errorDiv.textContent = errorMessage;
        
        // Add error message to the form
        const formContainer = form.closest('.modal-content');
        if (formContainer) {
            formContainer.insertBefore(errorDiv, form);
            
            // Remove error message after 5 seconds
            setTimeout(() => {
                errorDiv.remove();
            }, 5000);
        }
    }
}

// Setup event listeners
export function setupEventListeners() {
    // Add chore button
    const addChoreButton = document.getElementById('addChoreButton');
    if (addChoreButton) {
        addChoreButton.addEventListener('click', () => {
            const modal = document.getElementById('addChoreModal');
            if (modal) {
                modal.classList.add('visible');
                modal.style.display = 'flex';
                document.body.style.overflow = 'hidden';
            }
        });
    }

    // Form submission
    const addChoreForm = document.getElementById('addChoreForm');
    if (addChoreForm) {
        addChoreForm.addEventListener('submit', (e) => {
            e.preventDefault();
            addChore(supabase);
        });
    }

    // Filter changes
    const categoryFilter = document.getElementById('categoryFilter');
    const statusFilter = document.getElementById('statusFilter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', updateChoreList);
    }
    if (statusFilter) {
        statusFilter.addEventListener('change', updateChoreList);
    }

    // Search
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(updateChoreList, 300));
    }
}

// Debounce function
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Modal functions
export function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('visible');
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

export function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('visible');
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
}

// Make closeModal globally available for HTML onclick handlers
window.closeModal = closeModal;

// Initialize Supabase
export async function initializeSupabase() {
    try {
        // Verify connection
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        // Initialize auth state changes
        supabase.auth.onAuthStateChange((_event, session) => {
            if (session) {
                // User is signed in
                const user = session.user;
                console.log('User signed in:', user.email);
                // Update UI with user info
                updateUserInfo(user);
            } else {
                // User is signed out
                console.log('User signed out');
                // Clear user info from UI
                clearUserInfo();
            }
        });

        console.log('Supabase initialized successfully');
    } catch (error) {
        console.error('Error initializing Supabase:', error);
        throw error;
    }
}

// User info management
export function updateUserInfo(user) {
    const userDisplay = document.getElementById('userDisplay');
    if (userDisplay) {
        userDisplay.textContent = user.email;
        userDisplay.removeAttribute('hidden');
    }
}

export function clearUserInfo() {
    const userDisplay = document.getElementById('userDisplay');
    if (userDisplay) {
        userDisplay.textContent = '';
        userDisplay.setAttribute('hidden', '');
    }
}

// Test database connection
export async function testDatabaseConnection() {
    try {
        // Test by fetching a small amount of data
        const { data, error } = await supabase
            .from('chores')
            .select('id')
            .limit(1);

        if (error) throw error;
        console.log('Database connection test successful');
        return true;
    } catch (error) {
        console.error('Database connection test failed:', error);
        throw error;
    }
}

export async function populateAssignees() {
    const assigneeSelect = document.getElementById('choreAssignee');
    if (!assigneeSelect) return;
    
    assigneeSelect.innerHTML = '<option value="">Select Assignee</option>';
    
    const users = [
        { id: 'mom', name: 'Mom' },
        { id: 'dad', name: 'Dad' },
        { id: 'thomas', name: 'Thomas' },
        { id: 'any', name: 'Any' }
    ];
    
    users.forEach(user => {
        const option = document.createElement('option');
        option.value = user.id;
        option.textContent = user.name;
        assigneeSelect.appendChild(option);
    });
}

// Function to update chore list
export async function updateChoreList(supabase, categoryFilter = '', statusFilter = '', searchInput = '') {
    try {
        // Build query with join to get category names
        let query = supabase
            .from('chores')
            .select('*, categories(name)')
            .eq('category_id', 'categories.id');
        
        // Apply filters
        if (categoryFilter) {
            query = query.eq('category_id', categoryFilter);
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
            (chore.categories?.name || '').toLowerCase().includes(searchInput.toLowerCase()) ||
            chore.notes?.toLowerCase().includes(searchInput.toLowerCase())
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
                <div class="chore-details">
                    <p data-label="Category">${chore.categories?.name || 'No category'}</p>
                    <p data-label="Frequency">${chore.frequency}</p>
                    <p data-label="Difficulty">${chore.difficulty}</p>
                    <p data-label="Due Date">${chore.due_date ? moment(chore.due_date).format('MMM D, YYYY') : 'No due date'}</p>
                    <p data-label="Points">${chore.points}</p>
                </div>
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

export async function postponeChore(choreId) {
    try {
        // Get current date and add 1 day
        const newDueDate = new Date();
        newDueDate.setDate(newDueDate.getDate() + 1);
        
        const { error } = await supabase
            .from('chores')
            .update({ 
                status: 'pending',
                due_date: newDueDate.toISOString().split('T')[0]
            })
            .eq('id', choreId);

        if (error) throw error;

        // Update UI
        updateChoreList(supabase);
    } catch (error) {
        console.error('Error postponing chore:', error);
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
        const { data, error } = await supabase
            .from('categories')
            .select('id, name, color, icon')
            .order('name');
        
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error loading categories:', error);
        throw error;
    }
}

// Helper function to update category select elements
export function updateCategorySelect(selectId, categories) {
    const select = document.getElementById(selectId);
    if (!select) return;
    
    select.innerHTML = '<option value="">Select Category</option>';
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
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

// Export all functions
export {
    initializeTheme,
    initializeUI,
    handleAddChoreClick,
    validateForm,
    addChore,
    setupEventListeners,
    updateChoreList,
    markChoreComplete,
    skipChore,
    postponeChore,
    deleteChore,
    populateAssignees,
    calculatePoints,
    initializeSupabase,
    createPointsAchievement,
    createStreakAchievement,
    createCategoryAchievement,
    createChallengeAchievement,
    createAchievementHTML,
    updatePoints,
    updateProgressBars,
    setupRealtimeSubscriptions,
    loadCategories,
    updateCategorySelect,
    loadWeatherData,
    updateWeatherUI
};

