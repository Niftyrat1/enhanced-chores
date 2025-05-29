// src/config/supabase.js - Fixed version
import { createClient } from '@supabase/supabase-js';

// Environment Configuration with validation
const ENV = {
    SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY
};

// Validate environment variables
if (!ENV.SUPABASE_URL || !ENV.SUPABASE_ANON_KEY) {
    console.error('Missing Supabase configuration!');
    console.error('Please check your .env file and ensure:');
    console.error('- VITE_SUPABASE_URL is set');
    console.error('- VITE_SUPABASE_ANON_KEY is set');
    throw new Error('Supabase configuration is incomplete');
}

// Validate URL format
try {
    new URL(ENV.SUPABASE_URL);
} catch (error) {
    console.error('Invalid SUPABASE_URL format:', ENV.SUPABASE_URL);
    throw new Error('SUPABASE_URL must be a valid URL');
}

// Initialize Supabase client with proper configuration
export const supabase = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false, // Set to false for better CORS handling
        flowType: 'pkce' // Use PKCE flow for better security
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