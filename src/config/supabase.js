import { createClient } from '@supabase/supabase-js';

// Environment Configuration
const ENV = {
    SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY
};

// Custom fetch implementation with CORS handling
const customFetch = async (url, options = {}) => {
    try {
        const response = await fetch(url, {
            ...options,
            mode: 'cors',
            credentials: 'include',
            headers: {
                ...options.headers,
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response;
    } catch (error) {
        console.error('Fetch error:', error);
        throw error;
    }
};

// Initialize Supabase client with custom fetch
export const supabase = createClient(ENV.SUPABASE_URL || 'http://localhost:54321', ENV.SUPABASE_ANON_KEY || 'your-anon-key', {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
    },
    global: {
        fetch: customFetch
    }
});

// Check if required environment variables are set
if (!ENV.SUPABASE_URL || !ENV.SUPABASE_ANON_KEY) {
    console.warn('Warning: Supabase environment variables not set. Using default values.');
    console.warn('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.');
}
