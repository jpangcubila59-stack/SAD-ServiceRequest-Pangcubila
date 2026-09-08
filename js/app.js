// Main Application Functions

// Variables
let currentUser = null;
let deleteTargetId = null;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    currentUser = getCurrentUser();
    if (!currentUser && window.location.pathname.includes('dashboard.html')) {
        window.location.href = 'login.html';
        return;
    }
    
    // Load requests on dashboard
    if (document.getElementById('requestsBody')) {
        loadRequests();
        setupEventListeners();
    }
});

// Setup Event Listeners
function setupEventListeners() {
    // New Request Button
    const newRequestBtn = document.getElementById('newRequestBtn');
    if (newRequestBtn) {
        newRequestBtn.addEventListener('click', () => openModal('create'));
    }
    
    // Search Input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', loadRequests);
    }
    
    // Status Filter
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', loadRequests);
    }
    
    // Priority Filter
    const priorityFilter = document.getElementById('priorityFilter');
    if (priorityFilter) {
        priorityFilter.addEventListener('change', loadRequests);
    }
    
    // Request Form
    const requestForm = document.getElementById('requestForm');
    if (requestForm) {
        requestForm.addEventListener('submit', handleFormSubmit);
    }
    
    // Close Modal Buttons
    const closeButtons = document.querySelectorAll('.close');
    closeButtons.forEach(btn => {
        btn.addEventListener('click', closeModal);
    });
    
    // Cancel Delete
    const cancelDelete = document.getElementById('cancelDelete');
    if (cancelDelete) {
        cancelDelete.addEventListener('click', () => {
            document.getElementById('deleteModal').style.display = 'none';
        });
    }
    
    // Confirm Delete
    const confirmDelete = document.getElementById('confirmDelete');
    if (confirmDelete) {
        confirmDelete.addEventListener('click', confirmDeleteRequest);
    }
    
    // Click outside modal to close
    window.addEventListener('click', function(e) {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
}

// Load Requests with Search and Filters
async function loadRequests() {
    try {
        const searchTerm = document.getElementById('searchInput')?.value || '';
        const statusFilter = document.getElementById('statusFilter')?.value || 'All';
        const priorityFilter = document.getElementById('priorityFilter')?.value || 'All';
        
        // Build query
        let query = supabaseClient
            .from('service_requests')
            .select('*')
            .order('created_at', { ascending: false });
        
        // Apply search filter
        if (searchTerm) {
            query = query.or(`requester_name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
        }
        
        // Apply status filter
        if (statusFilter !== 'All') {
            query = query.eq('status', statusFilter);
        }
        
        // Apply priority filter
        if (priorityFilter !== 'All') {
            query = query.eq('priority', priorityFilter);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        // Update table
        renderRequests(data || []);
        
        // Update dashboard stats
        updateDashboardStats(data || []);
        
        return data;
    } catch (error) {
        console.error('Error loading requests:', error);
        showMessage('Failed to load requests', 'error');
    }
}

// Render Requests Table
function renderRequests(requests) {
    const tbody = document.getElementById('requestsBody');
    if (!tbody) return;
    
    if (!requests || requests.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No requests found</td></tr>';
        return;
    }
    
    tbody.innerHTML = requests.map(request => `
        <tr>
            <td>${request.id}</td>
            <td>${escapeHtml(request.requester_name)}</td>
            <td>${escapeHtml(request.department)}</td>
            <td>${escapeHtml(request.category)}</td>
            <td><span class="priority-${request.priority.toLowerCase()}">${request.priority}</span></td>
            <td><span class="status-${request.status.toLowerCase().replace(' ', '-')}">${request.status}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-primary" onclick="editRequest(${request.id})">Edit</button>
                    <button class="btn btn-danger" onclick="deleteRequest(${request.id})">Delete</button>
                </div>
            </td>
        </tr>
    `).join('');
    
    // Add some inline styles for priority and status badges
    addBadgeStyles();
}

// Add badge styles dynamically
function addBadgeStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .priority-high { color: #e74c3c; font-weight: bold; }
        .priority-medium { color: #f39c12; font-weight: bold; }
        .priority-low { color: #2ecc71; font-weight: bold; }
        .status-pending { color: #f39c12; font-weight: bold; }
        .status-in-progress { color: #3498db; font-weight: bold; }
        .status-completed { color: #2ecc71; font-weight: bold; }
    `;
    document.head.appendChild(style);
}

// Update Dashboard Stats
function updateDashboardStats(requests) {
    const total = requests.length;
    const pending = requests.filter(r => r.status === 'Pending').length;
    const inProgress = requests.filter(r => r.status === 'In Progress').length;
    const completed = requests.filter(r => r.status === 'Completed').length;
    
    document.getElementById('totalRequests').textContent = total;
    document.getElementById('pendingRequests').textContent = pending;
    document.getElementById('inProgressRequests').textContent = inProgress;
    document.getElementById('completedRequests').textContent = completed;
}

// Open Modal for Create or Edit
function openModal(mode, data = null) {
    const modal = document.getElementById('requestModal');
    const title = document.getElementById('modalTitle');
    const form = document.getElementById('requestForm');
    
    if (mode === 'create') {
        title.textContent = 'New Service Request';
        form.reset();
        document.getElementById('status').value = 'Pending';
        document.getElementById('requestId').value = '';
    } else if (mode === 'edit' && data) {
        title.textContent = 'Edit Service Request';
        document.getElementById('requestId').value = data.id;
        document.getElementById('requesterName').value = data.requester_name;
        document.getElementById('department').value = data.department;
        document.getElementById('category').value = data.category;
        document.getElementById('description').value = data.description;
        document.getElementById('priority').value = data.priority;
        document.getElementById('status').value = data.status;
    }
    
    modal.style.display = 'flex';
}

// Close Modal
function closeModal() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.style.display = 'none';
    });
}

// Handle Form Submit (Create/Update)
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const id = document.getElementById('requestId').value;
    const requesterName = document.getElementById('requesterName').value.trim();
    const department = document.getElementById('department').value.trim();
    const category = document.getElementById('category').value;
    const description = document.getElementById('description').value.trim();
    const priority = document.getElementById('priority').value;
    const status = document.getElementById('status').value;
    
    // Validate
    if (!requesterName) {
        showMessage('Requester name is required', 'error');
        return;
    }
    if (!department) {
        showMessage('Department is required', 'error');
        return;
    }
    if (!category) {
        showMessage('Category is required', 'error');
        return;
    }
    if (!description || description.length < 5) {
        showMessage('Description must contain sufficient information', 'error');
        return;
    }
    
    try {
        let result;
        
        if (id) {
            // UPDATE
            result = await supabaseClient
                .from('service_requests')
                .update({
                    requester_name: requesterName,
                    department: department,
                    category: category,
                    description: description,
                    priority: priority,
                    status: status
                })
                .eq('id', id)
                .eq('user_id', currentUser.id); // RLS will enforce this
        } else {
            // CREATE
            result = await supabaseClient
                .from('service_requests')
                .insert([{
                    requester_name: requesterName,
                    department: department,
                    category: category,
                    description: description,
                    priority: priority,
                    status: 'Pending', // BR-06: New requests automatically get Pending status
                    user_id: currentUser.id
                }]);
        }
        
        if (result.error) throw result.error;
        
        closeModal();
        loadRequests();
        showMessage(id ? 'Request updated successfully!' : 'Request created successfully!', 'success');
        
    } catch (error) {
        console.error('Error saving request:', error);
        showMessage('Failed to save request: ' + error.message, 'error');
    }
}

// Edit Request
function editRequest(id) {
    // Find the request in the current table data
    const rows = document.querySelectorAll('#requestsBody tr');
    let requestData = null;
    
    // Since we don't have the full data object easily, we'll fetch it
    fetchRequest(id).then(data => {
        if (data) {
            openModal('edit', data);
        }
    });
}

// Fetch Single Request
async function fetchRequest(id) {
    try {
        const { data, error } = await supabaseClient
            .from('service_requests')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error fetching request:', error);
        showMessage('Failed to fetch request details', 'error');
        return null;
    }
}

// Delete Request (Show Confirmation)
function deleteRequest(id) {
    deleteTargetId = id;
    document.getElementById('deleteModal').style.display = 'flex';
}

// Confirm Delete
async function confirmDeleteRequest() {
    if (!deleteTargetId) return;
    
    try {
        const { error } = await supabaseClient
            .from('service_requests')
            .delete()
            .eq('id', deleteTargetId)
            .eq('user_id', currentUser.id);
        
        if (error) throw error;
        
        document.getElementById('deleteModal').style.display = 'none';
        deleteTargetId = null;
        loadRequests();
        showMessage('Request deleted successfully!', 'success');
        
    } catch (error) {
        console.error('Error deleting request:', error);
        showMessage('Failed to delete request: ' + error.message, 'error');
    }
}

// Show Message (Error/Success)
function showMessage(message, type = 'info') {
    // Remove existing message
    const existing = document.querySelector('.message-container');
    if (existing) existing.remove();
    
    const container = document.createElement('div');
    container.className = `message-container ${type}-message`;
    container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 4px;
        z-index: 2000;
        max-width: 400px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    `;
    container.textContent = message;
    
    document.body.appendChild(container);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        container.remove();
    }, 5000);
}

// Utility: Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// For bonus challenge: Request Analytics
async function loadAnalytics() {
    try {
        const { data, error } = await supabaseClient
            .from('service_requests')
            .select('category, priority');
        
        if (error) throw error;
        
        // Group by category
        const categoryStats = {};
        const priorityStats = {};
        
        data.forEach(req => {
            // Category
            categoryStats[req.category] = (categoryStats[req.category] || 0) + 1;
            // Priority
            priorityStats[req.priority] = (priorityStats[req.priority] || 0) + 1;
        });
        
        // Display analytics
        displayAnalytics(categoryStats, priorityStats);
        
        return { categoryStats, priorityStats };
    } catch (error) {
        console.error('Error loading analytics:', error);
    }
}

// Display Analytics (Bonus)
function displayAnalytics(categoryStats, priorityStats) {
    // This function can be implemented to show charts or stats
    // For simplicity, we'll just log to console
    console.log('Category Stats:', categoryStats);
    console.log('Priority Stats:', priorityStats);
}