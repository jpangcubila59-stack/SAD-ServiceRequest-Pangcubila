// js/app.js

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
    
    // Search Input - ADD DEBOUNCE FOR BETTER PERFORMANCE
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                loadRequests();
            }, 300); // Wait 300ms after user stops typing
        });
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

// ✅ FIXED: Load Requests with Search and Filters
async function loadRequests() {
    try {
        const searchTerm = document.getElementById('searchInput')?.value || '';
        const statusFilter = document.getElementById('statusFilter')?.value || 'All';
        const priorityFilter = document.getElementById('priorityFilter')?.value || 'All';
        
        console.log('🔍 Searching for:', searchTerm); // Debug log
        
        // ✅ FIXED: Build query correctly
        let query = supabaseClient
            .from('service_requests')
            .select('*');
        
        // ✅ FIXED: Apply search filter - NOW WORKS PROPERLY
        if (searchTerm && searchTerm.trim() !== '') {
            // Search in requester_name OR description (case-insensitive)
            query = query.or(
                `requester_name.ilike.%${searchTerm.trim()}%,` +
                `description.ilike.%${searchTerm.trim()}%`
            );
            console.log('✅ Search filter applied:', searchTerm);
        }
        
        // Apply status filter
        if (statusFilter !== 'All') {
            query = query.eq('status', statusFilter);
            console.log('✅ Status filter applied:', statusFilter);
        }
        
        // Apply priority filter
        if (priorityFilter !== 'All') {
            query = query.eq('priority', priorityFilter);
            console.log('✅ Priority filter applied:', priorityFilter);
        }
        
        // Order by most recent first
        query = query.order('created_at', { ascending: false });
        
        const { data, error } = await query;
        
        if (error) {
            console.error('❌ Database error:', error);
            throw error;
        }
        
        console.log('📊 Found records:', data?.length || 0); // Debug log
        
        // Update table
        renderRequests(data || []);
        
        // Update dashboard stats
        updateDashboardStats(data || []);
        
        return data;
    } catch (error) {
        console.error('Error loading requests:', error);
        showMessage('Failed to load requests: ' + error.message, 'error');
    }
}

// Render Requests Table
function renderRequests(requests) {
    const tbody = document.getElementById('requestsBody');
    if (!tbody) return;
    
    if (!requests || requests.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center">
                    <p style="padding: 20px; color: #7f8c8d;">
                        🔍 No requests found
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
    
    // Validate - BR-01 to BR-06
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
            // CREATE - BR-06: New requests automatically get Pending status
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

// Show Message (Error/Success)
function showMessage(message, type = 'info') {
    // Remove existing message
    const existing = document.querySelector('.message-container');
    if (existing) existing.remove();
    
    const container = document.createElement('div');
    container.className = `message-container`;
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

// ✅ BONUS: Request Analytics (Optional Challenge)
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
            categoryStats[req.category] = (categoryStats[req.category] || 0) + 1;
            priorityStats[req.priority] = (priorityStats[req.priority] || 0) + 1;
        });
        
        console.log('📊 Category Stats:', categoryStats);
        console.log('📊 Priority Stats:', priorityStats);
        
        return { categoryStats, priorityStats };
    } catch (error) {
        console.error('Error loading analytics:', error);
    }
}

// Make functions globally accessible
window.editRequest = editRequest;
window.deleteRequest = deleteRequest;
