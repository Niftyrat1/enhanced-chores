import './app.js';

// Initialize the application
window.addEventListener('DOMContentLoaded', () => {
    try {
        // Ensure DOM is fully loaded
        if (!document.body) {
            throw new Error('DOM not fully loaded');
        }

        // Initialize Supabase
        initializeSupabase();
        
        // Initialize UI components
        initializeUI();
        
        // Setup event listeners
        setupEventListeners();
        
        console.log('Application initialized successfully');
    } catch (error) {
        console.error('Error initializing application:', error);
        // Show error to user
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message bg-red-500 text-white p-4 rounded';
        errorDiv.textContent = 'Error initializing application. Please refresh the page.';
        document.body.appendChild(errorDiv);
    }
});
