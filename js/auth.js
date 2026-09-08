// Authentication Functions

// Login
async function login(email, password) {
    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) throw error;
        
        // Store user session
        localStorage.setItem('user', JSON.stringify(data.user));
        window.location.href = 'dashboard.html';
        return { success: true, user: data.user };
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, error: error.message };
    }
}

// Logout
async function logout() {
    try {
        const { error } = await supabaseClient.auth.signOut();
        if (error) throw error;
        
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Logout error:', error);
    }
}

// Check Authentication Status
function checkAuth() {
    const user = localStorage.getItem('user');
    if (!user && !window.location.href.includes('login.html')) {
        window.location.href = 'login.html';
        return null;
    }
    return user ? JSON.parse(user) : null;
}

// Get Current User
function getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}

// Event Listeners for Login Page
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');
    
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            // Hide previous error
            errorMessage.style.display = 'none';
            
            const result = await login(email, password);
            
            if (!result.success) {
                errorMessage.textContent = result.error || 'Login failed. Please try again.';
                errorMessage.style.display = 'block';
            }
        });
    }
});

// For dashboard pages
if (window.location.pathname.includes('dashboard.html')) {
    // Check authentication on load
    const user = checkAuth();
    if (user) {
        document.getElementById('userEmail').textContent = user.email;
    }
    
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
}