// js/supabase.js

// ✅ YOUR CORRECT URL - Using your project ID
const SUPABASE_URL = 'https://epolfilfhobroeqdbioc.supabase.co';

// ✅ Your ANON Key (keep this as is, or update if needed)
const SUPABASE_KEY = 'your-anon-key-here';  // ← Replace with your actual ANON key

// Initialize Supabase Client
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Test connection
console.log('✅ Supabase client initialized');
console.log('📍 URL:', SUPABASE_URL);
