import './app.js';

// Initialize the application
window.addEventListener('DOMContentLoaded', () => {
    try {
        // Initialize Supabase
        initializeSupabase();
        
        // Initialize UI components
        initializeUI();
        
        // Setup event listeners
        setupEventListeners();
        
        console.log('Application initialized successfully');
    } catch (error) {
        console.error('Error initializing application:', error);
    }
});
