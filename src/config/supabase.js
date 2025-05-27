import { createClient } from '@supabase/supabase-js';

// Environment Configuration
const ENV = {
    SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY
};

// Validate environment variables
if (!ENV.SUPABASE_URL || !ENV.SUPABASE_ANON_KEY) {
    throw new Error('Missing required environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
}

// Initialize Supabase client with proper CORS handling
export const supabase = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY, {
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
