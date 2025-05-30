/*
 * Main Application Entry Point
 * ==========================
 * This file contains the main entry point for the application and handles
 * initialization of core components.
 */

// Import core dependencies
import { supabase } from './config/supabase.js';
import { 
    initializeSupabase, 
    testDatabaseConnection, 
    initializeUI, 
    setupEventListeners, 
    openModal, 
    closeModal, 
    handleAddChoreClick 
} from './app.js';

/*
 * Application Initialization
 * ========================
 * Main entry point for the application. Handles initialization of all core components
 * and error handling.
 */
window.addEventListener('DOMContentLoaded', async () => {
    try {
        // Verify DOM is ready
        if (!document.body) {
            throw new Error('DOM not fully loaded');
        }

        // Initialize database connection
        await initializeSupabase();

        // Set up database test functionality
        const testDbButton = document.getElementById('testDbButton');
        if (testDbButton) {
            testDbButton.addEventListener('click', async () => {
                try {
                    // Test database connection
                    await testDatabaseConnection();
                    alert('Database connection test successful!');
                } catch (error) {
                    // Handle database test failure
                    alert(`Database connection test failed: ${error.message}`);
                    console.error('Database test error:', error);
                }
            });
        }
        
        // Initialize UI components
        await initializeUI();
        
        // Set up event listeners
        await setupEventListeners();
        
        // Initialize theme preferences
        initializeTheme();
        
        console.log('Application initialized successfully');
    } catch (error) {
        // Handle initialization errors
        console.error('Error initializing application:', error);
        
        // Show error message to user
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message bg-red-500 text-white p-4 rounded';
        errorDiv.setAttribute('role', 'alert');
        errorDiv.setAttribute('aria-live', 'assertive');
        errorDiv.textContent = 'Error initializing application. Please refresh the page.';
        document.body.appendChild(errorDiv);
    }
});

/*
 * Utility Functions
 * ===============
 * Helper functions used throughout the application.
 */

/**
 * Debounce Function
 * ----------------
 * Prevents a function from being called too frequently.
 * Useful for optimizing performance of input handlers.
 * 
 * @param {Function} func - The function to debounce
 * @param {number} wait - Milliseconds to wait between calls
 * @returns {Function} Debounced function
 */
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
