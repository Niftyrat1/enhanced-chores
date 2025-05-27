import { createClient } from '@supabase/supabase-js';

// Environment Configuration
const ENV = {
    SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY
};

// Initialize Supabase client with error handling
export const supabase = createClient(ENV.SUPABASE_URL || 'http://localhost:54321', ENV.SUPABASE_ANON_KEY || 'your-anon-key', {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
    },
    global: {
        headers: {
            'x-requested-with': 'XMLHttpRequest'
        },
        fetch: (...args) => fetch(...args)
    }
});

// Check if required environment variables are set
if (!ENV.SUPABASE_URL || !ENV.SUPABASE_ANON_KEY) {
    console.warn('Warning: Supabase environment variables not set. Using default values.');
    console.warn('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.');
}
