// src/config/supabase.js - Fixed version
import { createClient } from '@supabase/supabase-js';

// Environment Configuration with validation
const ENV = {
    SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY
};

// Check if required environment variables are set
if (!ENV.SUPABASE_URL || !ENV.SUPABASE_ANON_KEY) {
    console.warn('Using default Supabase configuration');
    ENV.SUPABASE_URL = 'http://localhost:54321';
    ENV.SUPABASE_ANON_KEY = 'anon.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.X-CqUQXWQs1jZJ0K6Ldwz07Q287p0Ox30XHj9XzNpsM';
}

// Initialize Supabase client with proper configuration
export const supabase = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        flowType: 'pkce'
    },
    global: {
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Client-Info': 'chore-tracker@1.0.0'
        }
    },
    db: {
        schema: 'public'
    },
    realtime: {
        params: {
            eventsPerSecond: 10
        }
    }
});

// Test connection function
export async function testSupabaseConnection() {
    try {
        console.log('Testing Supabase connection...');
        console.log('URL:', ENV.SUPABASE_URL);
        console.log('Key prefix:', ENV.SUPABASE_ANON_KEY.substring(0, 20) + '...');
        
        // First test basic auth
        const { data: authData, error: authError } = await supabase.auth.getSession();
        if (authError) {
            console.error('Auth test failed:', authError);
            throw authError;
        }
        console.log('Auth test successful');
        
        // Then test basic database connection
        const { data: dbData, error: dbError } = await supabase
            .from('chores')
            .select('count(*)', { count: 'exact', head: true });
            
        if (dbError) {
            console.error('Database test failed:', dbError);
            throw dbError;
        }
        
        console.log('Supabase connection test successful!');
        return { success: true, data: dbData };
    } catch (error) {
        console.error('Connection test error:', error);
        
        // Provide helpful error messages
        if (error.message.includes('CORS')) {
            console.error('CORS Error - Check your Supabase project settings');
        } else if (error.message.includes('NetworkError')) {
            console.error('Network Error - Check your internet connection and Supabase URL');
        } else if (error.message.includes('401') || error.message.includes('403')) {
            console.error('Authentication Error - Check your anon key');
        }
        
        throw error;
    }
}

// Initialize connection on module load
console.log('Supabase client initialized');
console.log('Project URL:', ENV.SUPABASE_URL);