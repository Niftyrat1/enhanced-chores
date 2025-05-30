// Imports
import { createClient } from '@supabase/supabase-js';
import { supabase } from './config/supabase.js';

// Weather API configuration
const ENV = {
    WEATHER_API_KEY: import.meta.env.VITE_WEATHER_API_KEY
};

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
        
        // Update chore list initially
        await updateChoreList();
    } catch (error) {
        console.error('Error initializing application:', error);
        alert('Error initializing application. Please refresh the page.');
    }
});

// Notification Functions
export function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed bottom-4 right-4 p-4 rounded-lg shadow-lg transition-all duration-300 ${
        type === 'error' ? 'bg-red-500 text-white' : 
        type === 'success' ? 'bg-green-500 text-white' : 
        'bg-blue-500 text-white'
    }`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
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
            searchInput.addEventListener('input', updateChoreList);
        }

        // Initialize assignee filter
        if (assigneeFilter) {
            assigneeFilter.value = '';
            assigneeFilter.addEventListener('change', updateChoreList);
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

        // Populate categories and assignees
        await populateCategories();
        await populateAssignees();

    } catch (error) {
        console.error('Error initializing UI:', error);
        throw error;
    }
}

// Modal Functions
export function openModal(modalId) {
    const modal = document.getElementById(modalId);
    const overlay = document.querySelector('.modal-overlay');
    if (modal && overlay) {
        modal.classList.remove('hidden');
        overlay.classList.remove('hidden');
        overlay.style.display = 'flex';
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
}

export function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    const overlay = document.querySelector('.modal-overlay');
    if (modal && overlay) {
        modal.classList.add('hidden');
        overlay.classList.add('hidden');
        overlay.style.display = 'none';
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Event Listeners
export function setupEventListeners() {
    // Add chore button
    const addChoreButton = document.getElementById('addChoreButton');
    if (addChoreButton) {
        addChoreButton.addEventListener('click', () => {
            const modal = document.getElementById('addChoreModal');
            if (modal) {
                openModal('addChoreModal');
            }
        });
    }



    // Filter changes
    const categoryFilter = document.getElementById('categoryFilter');
    const statusFilter = document.getElementById('statusFilter');
    const assigneeFilter = document.getElementById('assigneeFilter');

    // Add event listeners for filters
    if (categoryFilter) {
        categoryFilter.addEventListener('change', updateChoreList);
    }
    if (statusFilter) {
        statusFilter.addEventListener('change', updateChoreList);
    }
    if (assigneeFilter) {
        assigneeFilter.addEventListener('change', updateChoreList);
    }
    if (assigneeFilter) {
        assigneeFilter.addEventListener('change', updateChoreList);
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
    const requiredFields = ['choreName', 'choreFrequency', 'choreDifficulty', 'chorePriority'];
    
    // Validate required fields
    for (const field of requiredFields) {
        if (!form[field].value) {
            alert(`Please fill in the ${field.replace('chore', '')} field`);
            return false;
        }
    }

    // Validate UUID fields
    const uuidFields = ['assignee_id', 'category_id'];
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    
    for (const field of uuidFields) {
        const value = form[field].value;
        if (!value || !uuidRegex.test(value)) {
            alert(`Please select a valid ${field.replace('_', ' ')} from the dropdown`);
            return false;
        }
    }

    // Check if assignee and category are selected
    if (!form.choreAssignee.value || form.choreAssignee.value === '') {
        alert('Please select an assignee');
        return false;
    }
    if (!form.choreCategory.value || form.choreCategory.value === '') {
        alert('Please select a category');
        return false;
    }

    return true;
}

export async function updateChoreList() {
    try {
        const categoryFilter = document.getElementById('categoryFilter');
        const statusFilter = document.getElementById('statusFilter');
        const assigneeFilter = document.getElementById('assigneeFilter');

        // Build base query
        let query = supabase
            .from('chores')
            .select(`
                id,
                title,
                category_id,
                assignee_id,
                due_date,
                status,
                priority,
                difficulty,
                created_at,
                categories (name),
                users (name)
            `);

        // Apply filters if they exist and have values
        if (categoryFilter && categoryFilter.value) {
            query = query.eq('category_id', categoryFilter.value);
        }
        if (statusFilter && statusFilter.value) {
            query = query.eq('status', statusFilter.value);
        }
        if (assigneeFilter && assigneeFilter.value) {
            query = query.eq('assignee_id', assigneeFilter.value);
        }

        const { data: chores, error } = await query;

        if (error) throw error;

        const choreList = document.querySelector('.chores-list');
        if (!choreList) return;

        if (!chores || chores.length === 0) {
            console.log('No chores found in database');
            choreList.innerHTML = '<p class="text-gray-400">No chores found</p>';
            return;
        }

        // Debug individual chores
        if (chores) {
            chores.forEach((chore, index) => {
                console.log(`Chore ${index + 1}:`, {
                    id: chore.id,
                    title: chore.title,
                    category_id: chore.category_id,
                    assignee_id: chore.assignee_id,
                    category: chore.categories,
                    user: chore.users
                });
            });
        }

        choreList.innerHTML = chores.map(chore => `
            <div class="flex justify-between items-center mb-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                <div class="flex flex-col">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center">
                            <input type="checkbox" id="chore-${chore.id}" ${chore.completed ? 'checked' : ''} class="mr-2">
                            <span class="font-medium">${chore.title}</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <button onclick="markChoreComplete('${chore.id}')" class="px-3 py-1 rounded bg-green-500/20 text-green-500 hover:bg-green-500/30">Complete</button>
                            <button onclick="skipChore('${chore.id}')" class="px-3 py-1 rounded bg-red-500/20 text-red-500 hover:bg-red-500/30">Skip</button>
                        </div>
                    </div>
                    <div class="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        <div class="flex items-center gap-2">
                            <span><i class="fas fa-folder text-blue-500"></i> ${chore.categories?.name || 'No Category'}</span>
                            <span><i class="fas fa-user text-purple-500"></i> ${chore.users?.name || 'Unassigned'}</span>
                            <span><i class="fas fa-calendar text-yellow-500"></i> ${chore.due_date ? new Date(chore.due_date).toLocaleDateString() : 'No due date'}</span>
                        </div>
                        <div class="flex items-center gap-2 mt-1">
                            <span class="px-2 py-1 rounded bg-blue-500/20 text-blue-500 text-xs">${chore.priority}</span>
                            <span class="px-2 py-1 rounded bg-yellow-500/20 text-yellow-500 text-xs">Difficulty: ${chore.difficulty}</span>
                            <span class="px-2 py-1 rounded ${chore.completed ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'} text-xs">${chore.completed ? 'Completed' : 'Pending'}</span>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
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
    try {
        const supabase = getSupabase();
        const { error } = await supabase
            .from('chores')
            .update({ 
                skipped: true,
                skipped_at: new Date().toISOString(),
                skip_reason: document.getElementById('skipReason')?.value
            })
            .eq('id', choreId);

        if (error) throw error;
        await updateChoreList();
        showNotification('Chore skipped', 'info');
    } catch (error) {
        console.error('Error skipping chore:', error);
        showNotification('Error skipping chore', 'error');
    }
}

export async function postponeChore(choreId) {
    try {
        // Get the new date from the modal
        const postponeUntil = document.getElementById('postponeUntil');
        if (!postponeUntil || !postponeUntil.value) {
            alert('Please select a date to postpone the chore');
            return;
        }

        // Update the chore in the database
        const { error } = await supabase
            .from('chores')
            .update({ 
                due_date: postponeUntil.value,
                postponed: true,
                postpone_reason: document.getElementById('skipReason').value
            })
            .eq('id', choreId);

        if (error) throw error;
        
        // Close the modal and update the chore list
        closeModal('skipChoreModal');
        updateChoreList();
    } catch (error) {
        console.error('Error postponing chore:', error);
        alert('Failed to postpone chore. Please try again.');
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
export async function populateCategories() {
    try {
        const supabase = getSupabase();
        const { data: categories, error } = await supabase
            .from('categories')
            .select('*');
        
        if (error) throw error;

        // Populate category filter
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            categoryFilter.innerHTML = '<option value="">All Categories</option>' +
                categories.map(category => `
                    <option value="${category.id}">${category.name} <i class="fas ${category.icon_class} text-${category.color_class}"></i></option>
                `).join('');
        }

        // Populate add chore category select
        const categorySelect = document.getElementById('choreCategory');
        if (categorySelect) {
            categorySelect.innerHTML = '<option value="">Select Category</option>' +
                categories.map(category => `
                    <option value="${category.id}">${category.name} <i class="fas ${category.icon_class} text-${category.color_class}"></i></option>
                `).join('');
        }
    } catch (error) {
        console.error('Error populating categories:', error);
    }
}

export async function populateAssignees() {
    try {
        const { data: users, error } = await supabase
            .from('users')
            .select('id, name');
        
        if (error) throw error;

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



