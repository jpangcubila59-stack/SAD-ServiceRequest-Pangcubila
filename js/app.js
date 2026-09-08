// js/app.js

// Variables
let currentUser = null;
let deleteTargetId = null;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 App initializing...');
    
    currentUser = getCurrentUser();
    console.log('👤 Current user:', currentUser);
    
    if (!currentUser && window.location.pathname.includes('dashboard.html')) {
        console.log('❌ No user found, redirecting to login');
        window.location.href = 'login.html';
        return;
    }
    
    if (document.getElementById('requestsBody')) {
        console.log('📋 Loading requests...');
        loadRequests();
        setupEventListeners();
    }
});

// Setup Event Listeners
function setupEventListeners() {
    console.log('🔧 Setting up event listeners...');
    
    // New Request Button
    const newRequestBtn = document.getElementById('newRequestBtn');
    if (newRequestBtn) {
        newRequestBtn.addEventListener('click', () => openModal('create'));
    }
    
    // ✅ FIXED: Search Input - Direct event listener
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        console.log('✅ Search input found');
        
        // Remove any existing listeners by cloning
        const newSearchInput = searchInput.cloneNode(true);
        searchInput.parentNode.replaceChild(newSearchInput, searchInput);
        
        // Add new listener
        newSearchInput.addEventListener('input', function() {
            const searchTerm = this.value;
            console.log('🔍 Search triggered with:', searchTerm);
            loadRequests(); // Call loadRequests directly
        });
    } else {
        console.error('❌ Search input not found!');
    }
    
    // Status Filter
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', function() {
            console.log('📊 Status filter changed to:', this.value);
            loadRequests();
        });
    }
    
    // Priority Filter
    const priorityFilter = document.getElementById('priorityFilter');
    if (priorityFilter) {
        priorityFilter.addEventListener('change', function() {
            console.log('📊 Priority filter changed to:', this.value);
            loadRequests();
        });
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

// ✅ COMPLETELY FIXED: Load Requests with Search and Filters
async function loadRequests() {
    try {
        const searchInput = document.getElementById('searchInput');
        const statusFilter = document.getElementById('statusFilter');
        const priorityFilter = document.getElementById('priorityFilter');
        
        // Get values with null checks
        const searchTerm = searchInput ? searchInput.value : '';
        const statusValue = statusFilter ? statusFilter.value : 'All';
        const priorityValue = priorityFilter ? priorityFilter.value : 'All';
        
        console.log('🔍 Search term:', searchTerm);
        console.log('📊 Status filter:', statusValue);
        console.log('📊 Priority filter:', priorityValue);
        
        // Start building the query
        let query = supabaseClient
            .from('service_requests')
            .select('*');
        
      // ✅ APPLY SEARCH FILTER - SEARCHES IN ALL FIELDS
if (searchTerm && searchTerm.trim() !== '') {
    const trimmedTerm = searchTerm.trim();
    console.log('✅ Applying search filter for:', trimmedTerm);
    
    // Search in requester_name, description, department, AND category
    query = query.or(
        `requester_name.ilike.%${trimmedTerm}%,` +
        `description.ilike.%${trimmedTerm}%,` +
        `department.ilike.%${trimmedTerm}%,` +
        `category.ilike.%${trimmedTerm}%`
    );
}
        
        // Apply status filter
        if (statusValue !== 'All') {
            console.log('✅ Applying status filter:', statusValue);
            query = query.eq('status', statusValue);
        }
        
        // Apply priority filter
        if (priorityValue !== 'All') {
            console.log('✅ Applying priority filter:', priorityValue);
            query = query.eq('priority', priorityValue);
        }
        
        // Order by most recent first
        query = query.order('created_at', { ascending: false });
        
        console.log('🔄 Executing query...');
        const { data, error } = await query;
        
        if (error) {
            console.error('❌ Database error:', error);
            throw error;
        }
        
        console.log('📊 Results found:', data ? data.length : 0);
        
        // Update table
        renderRequests(data || []);
        
        // Update dashboard stats
        updateDashboardStats(data || []);
        
        return data;
    } catch (error) {
        console.error('❌ Error loading requests:', error);
        showMessage('Failed to load requests: ' + error.message, 'error');
    }
}

// Render Requests Table
function renderRequests(requests) {
    const tbody = document.getElementById('requestsBody');
    if (!tbody) return;
    
    console.log('🎨 Rendering', requests.length, 'requests');
    
    if (!requests || requests.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center">
                    <p style="padding: 20px; color: #7f8c8d; font-size: 16px;">
                        🔍 No requests found matching your criteria
                    </p>
                </td>
            </tr>
        `;
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
    
    // Add badge styles
    addBadgeStyles();
}

// Add badge styles dynamically
function addBadgeStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .priority-high { 
            color: #e74c3c; 
            font-weight: bold; 
            background: #fde8e8;
            padding: 3px 8px;
            border-radius: 4px;
        }
        .priority-medium { 
            color: #f39c12; 
            font-weight: bold;
            background: #fef5e7;
            padding: 3px 8px;
            border-radius: 4px;
        }
        .priority-low { 
            color: #2ecc71; 
            font-weight: bold;
            background: #eafaf1;
            padding: 3px 8px;
            border-radius: 4px;
        }
        .status-pending { 
            color: #f39c12; 
            font-weight: bold;
            background: #fef5e7;
            padding: 3px 8px;
            border-radius: 4px;
        }
        .status-in-progress { 
            color: #3498db; 
            font-weight: bold;
            background: #ebf5fb;
            padding: 3px 8px;
            border-radius: 4px;
        }
        .status-completed { 
            color: #2ecc71; 
            font-weight: bold;
            background: #eafaf1;
            padding: 3px 8px;
            border-radius: 4px;
        }
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
        showMessage('Description must contain sufficient information (min 5 chars)', 'error');
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
                .eq('user_id', currentUser.id);
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
                    status: 'Pending',
                    user_id: currentUser.id
                }]);
        }
        
        if (result.error) {
            console.error('❌ Database error:', result.error);
            throw result.error;
        }
        
        closeModal();
        loadRequests();
        showMessage(id ? '✅ Request updated successfully!' : '✅ Request created successfully!', 'success');
        
    } catch (error) {
        console.error('Error saving request:', error);
        showMessage('Failed to save request: ' + error.message, 'error');
    }
}

// Edit Request
async function editRequest(id) {
    try {
        const data = await fetchRequest(id);
        if (data) {
            openModal('edit', data);
        }
    } catch (error) {
        console.error('Error fetching request:', error);
        showMessage('Failed to fetch request details', 'error');
    }
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
        showMessage('✅ Request deleted successfully!', 'success');
        
    } catch (error) {
        console.error('Error deleting request:', error);
        showMessage('Failed to delete request: ' + error.message, 'error');
    }
}

// Show Message
function showMessage(message, type = 'info') {
    const existing = document.querySelector('.message-container');
    if (existing) existing.remove();
    
    const container = document.createElement('div');
    container.className = 'message-container';
    container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 4px;
        z-index: 2000;
        max-width: 400px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        background-color: ${type === 'error' ? '#f8d7da' : '#d4edda'};
        color: ${type === 'error' ? '#721c24' : '#155724'};
        border: 1px solid ${type === 'error' ? '#f5c6cb' : '#c3e6cb'};
    `;
    container.textContent = message;
    
    document.body.appendChild(container);
    
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

// Make functions globally accessible
window.editRequest = editRequest;
window.deleteRequest = deleteRequest;
