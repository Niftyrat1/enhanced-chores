import { createClient } from '@supabase/supabase-js';
import './app.js';

// Initialize Supabase client
const ENV = {
    SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL',
    SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_KEY'
};

export const supabase = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY);

// Initialize the application
window.addEventListener('DOMContentLoaded', async () => {
    try {
        // Ensure DOM is fully loaded
        if (!document.body) {
            throw new Error('DOM not fully loaded');
        }

        // Initialize theme
        await initializeTheme();

        // Initialize Supabase
        await initializeSupabase();
        
        // Initialize UI components
        await initializeUI();
        
        // Setup event listeners
        await setupEventListeners();
        
        console.log('Application initialized successfully');
    } catch (error) {
        console.error('Error initializing application:', error);
        // Show error to user
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message bg-red-500 text-white p-4 rounded';
        errorDiv.setAttribute('role', 'alert');
        errorDiv.setAttribute('aria-live', 'assertive');
        errorDiv.textContent = 'Error initializing application. Please refresh the page.';
        document.body.appendChild(errorDiv);
    }
});

// Initialize theme
function initializeTheme() {
    const themeToggle = document.getElementById('themeToggle');
    if (!themeToggle) {
        console.error('Theme toggle button not found');
        return;
    }

    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.body.classList.toggle('dark', savedTheme === 'dark');
        document.body.classList.toggle('light', savedTheme === 'light');
        themeToggle.innerHTML = savedTheme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    }

    // Add theme toggle event listener
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark');
        document.body.classList.toggle('light');
        const isDark = document.body.classList.contains('dark');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        themeToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    });
}

// Initialize UI components
async function initializeUI() {
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
            
            // Add ARIA attributes
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

        // Initialize tabs
        const tabs = document.querySelectorAll('.tab');
        const tabContents = document.querySelectorAll('.tab-content');
        if (tabs.length > 0 && tabContents.length > 0) {
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
        }

        // Initialize modals
        const modals = document.querySelectorAll('.modal');
        if (modals.length > 0) {
            modals.forEach(modal => {
                modal.setAttribute('role', 'dialog');
                modal.setAttribute('aria-modal', 'true');
                modal.setAttribute('hidden', 'true');
            });
        }

        // Initialize forms
        const forms = document.querySelectorAll('form');
        if (forms.length > 0) {
            forms.forEach(form => {
                form.setAttribute('novalidate', '');
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    validateForm(form);
                });
            });
        }
    } catch (error) {
        console.error('Error initializing UI:', error);
        throw error;
    }
}

// Form validation
function validateForm(form) {
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

    if (!isValid) {
        const error = new Error('Please fill in all required fields');
        error.name = 'ValidationError';
        throw error;
    }

    // Handle form submission
    const submitHandler = form.getAttribute('data-submit-handler');
    if (submitHandler) {
        const handler = window[submitHandler];
        if (typeof handler === 'function') {
            handler();
        }
    }
}

// Setup event listeners
function setupEventListeners() {
    // Add chore button
    const addChoreButton = document.getElementById('addChoreButton');
    if (addChoreButton) {
        addChoreButton.addEventListener('click', () => {
            openModal('addChoreModal');
        });
    }

    // Form submission
    const addChoreForm = document.getElementById('addChoreForm');
    if (addChoreForm) {
        addChoreForm.addEventListener('submit', (e) => {
            e.preventDefault();
            addChore();
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
function debounce(func, wait) {
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
