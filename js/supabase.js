// js/supabase.js

// ✅ YOUR CORRECT URL - Using your project ID
const SUPABASE_URL = 'https://epolfilfhobroeqdbioc.supabase.co';

// ✅ Your ANON Key (keep this as is, or update if needed)
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwb2xmaWxmaG9icm9lcWRiaW9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4MTM0MzMsImV4cCI6MjEwNDM4OTQzM30.lp0O9VdflV-4fl0bTTkDagJBD6O48I-SgvbgbS-niCw';  // ← Replace with your actual ANON key

// Initialize Supabase Client
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Test connection
console.log('✅ Supabase client initialized');
console.log('📍 URL:', SUPABASE_URL);
