import { supabase } from './config/supabase.js';
import { initializeSupabase, testDatabaseConnection, initializeUI, setupEventListeners } from './app.js';

// Initialize the application
window.addEventListener('DOMContentLoaded', async () => {
    try {
        // Ensure DOM is fully loaded
        if (!document.body) {
            throw new Error('DOM not fully loaded');
        }

        // Initialize Supabase
        await initializeSupabase();

        // Add test database button functionality
        const testDbButton = document.getElementById('testDbButton');
        if (testDbButton) {
            testDbButton.addEventListener('click', async () => {
                try {
                    await testDatabaseConnection();
                    alert('Database connection test successful!');
                } catch (error) {
                    alert(`Database connection test failed: ${error.message}`);
                    console.error('Database test error:', error);
                }
            });
        }
        
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

// Form validation
function validateForm(form) {
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
