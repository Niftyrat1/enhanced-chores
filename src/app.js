// Imports
import { createClient } from '@supabase/supabase-js';
import { supabase } from './config/supabase.js';

// Weather API configuration
const ENV = {
    WEATHER_API_KEY: import.meta.env.VITE_WEATHER_API_KEY
};

// Initialize Supabase
export const initializeSupabase = () => supabase;

// Get Supabase client instance
export const getSupabase = () => supabase;

// Initialize the application
window.addEventListener('DOMContentLoaded', async () => {
    try {
        // Initialize theme
        initializeTheme();
        
        // Initialize UI
        await initializeUI();
        
        // Setup event listeners
        setupEventListeners();
        
        // Populate assignees
        await populateAssignees();
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
export async function initializeUI() {
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
export function setupEventListeners() {
    // Add chore form submission
    const addChoreForm = document.getElementById('addChoreForm');
    if (addChoreForm) {
        addChoreForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await handleAddChoreClick(e);
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
        searchInput.addEventListener('input', updateChoreList);
    }
}

// Form Handling
export async function handleAddChoreClick(event) {
    const form = event.target;
    if (!validateForm(form)) return;

    try {
        await addChore(form);
        form.reset();
        updateChoreList();
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

export async function addChore(form) {
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
export async function updateChoreList() {
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

export async function markChoreComplete(choreId) {
    const supabase = initializeSupabase();
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

export async function skipChore(choreId) {
    const supabase = initializeSupabase();
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

export async function postponeChore(choreId, newDate) {
    const supabase = initializeSupabase();
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

export async function deleteChore(choreId) {
    const supabase = initializeSupabase();
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
export async function populateAssignees() {
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

/*
 * Points and Achievements System
 * ============================
 * Handles point calculation and achievement tracking.
 */

/**
 * Calculate Chore Points
 * --------------------
 * Calculates points for a chore based on difficulty and priority:
 * - Difficulty: 1 (Easy), 2 (Medium), 3 (Hard)
 * - Priority: low, medium, high
 * 
 * @param {number} difficulty - Chore difficulty level (1-3)
 * @param {string} priority - Chore priority level ('low', 'medium', 'high')
 * @returns {number} Calculated points for the chore
 */
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

