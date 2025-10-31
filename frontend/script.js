// API Base URL - Change this to your backend URL
const API_URL = 'http://localhost:5000/api';

// Current User
let currentUser = null;

// DOM Elements
const authContainer = document.getElementById('authContainer');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const managerDashboard = document.getElementById('managerDashboard');
const teamDashboard = document.getElementById('teamDashboard');

// Switch between login and signup
document.getElementById('showSignup').addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.style.display = 'none';
    signupForm.style.display = 'block';
});

document.getElementById('showLogin').addEventListener('click', (e) => {
    e.preventDefault();
    signupForm.style.display = 'none';
    loginForm.style.display = 'block';
});

// Signup
document.getElementById('signupFormElement').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const role = document.querySelector('input[name="role"]:checked').value;

    try {
        const response = await fetch(`${API_URL}/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, role })
        });

        const data = await response.json();

        if (response.ok) {
            alert('Signup successful! Please login.');
            signupForm.style.display = 'none';
            loginForm.style.display = 'block';
            document.getElementById('signupFormElement').reset();
        } else {
            alert(data.message);
        }
    } catch (error) {
        alert('Error during signup. Please try again.');
        console.error(error);
    }
});

// Login
document.getElementById('loginFormElement').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        const data = await response.json();

        if (response.ok) {
            currentUser = data.user;
            authContainer.style.display = 'none';
            
            if (currentUser.role === 'manager') {
                showManagerDashboard();
            } else {
                showTeamDashboard();
            }
        } else {
            alert(data.message);
        }
    } catch (error) {
        alert('Error during login. Please try again.');
        console.error(error);
    }
});

// Logout
document.getElementById('logoutBtn').addEventListener('click', logout);
document.getElementById('teamLogoutBtn').addEventListener('click', logout);

function logout() {
    currentUser = null;
    authContainer.style.display = 'flex';
    managerDashboard.style.display = 'none';
    teamDashboard.style.display = 'none';
    document.getElementById('loginFormElement').reset();
}

// Manager Dashboard
async function showManagerDashboard() {
    managerDashboard.style.display = 'block';
    document.getElementById('managerName').textContent = currentUser.name;
    
    await loadManagerStats();
    await loadManagerTasks();
    await loadTeamMembers();
}

async function loadManagerStats() {
    try {
        const response = await fetch(`${API_URL}/tasks/stats/${currentUser._id}`);
        const data = await response.json();

        document.getElementById('totalTasks').textContent = data.total;
        document.getElementById('completedTasks').textContent = data.completed;
        document.getElementById('inProgressTasks').textContent = data.inProgress;
        document.getElementById('pendingTasks').textContent = data.pending;
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

async function loadManagerTasks() {
    try {
        const response = await fetch(`${API_URL}/tasks/manager/${currentUser._id}`);
        const tasks = await response.json();

        const tasksList = document.getElementById('managerTasksList');
        
        if (tasks.length === 0) {
            tasksList.innerHTML = `
                <div class="empty-state">
                    <h3>No tasks yet</h3>
                    <p>Click "Add Task" to create your first task</p>
                </div>
            `;
            return;
        }

        tasksList.innerHTML = tasks.map(task => `
            <div class="task-card">
                <div class="task-header">
                    <div class="task-title-section">
                        <h4>${task.title}</h4>
                        <div class="task-meta">
                            <span>👤 ${task.assignedTo.name}</span>
                            <span>📅 ${new Date(task.deadline).toLocaleDateString()}</span>
                            <span class="priority-badge priority-${task.priority}">${task.priority}</span>
                        </div>
                    </div>
                    <span class="status-badge status-${task.status}">${task.status.replace('-', ' ')}</span>
                </div>
                ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
                <div class="task-progress">
                    <p>Progress: ${task.progress}%</p>
                    <div class="progress-bar-container">
                        <div class="progress-bar" style="width: ${task.progress}%"></div>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading tasks:', error);
    }
}

// Add Task Modal
const addTaskModal = document.getElementById('addTaskModal');
const addTaskBtn = document.getElementById('addTaskBtn');
const closeModal = document.querySelector('.close');

addTaskBtn.addEventListener('click', () => {
    addTaskModal.style.display = 'block';
});

closeModal.addEventListener('click', () => {
    addTaskModal.style.display = 'none';
});

window.addEventListener('click', (e) => {
    if (e.target === addTaskModal) {
        addTaskModal.style.display = 'none';
    }
});

async function loadTeamMembers() {
    try {
        const response = await fetch(`${API_URL}/users/team`);
        const teamMembers = await response.json();

        const select = document.getElementById('assignToSelect');
        select.innerHTML = '<option value="">Select team member</option>';
        
        teamMembers.forEach(member => {
            const option = document.createElement('option');
            option.value = member._id;
            option.textContent = member.name;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading team members:', error);
    }
}

// Add Task Form
document.getElementById('addTaskForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const taskData = {
        title: document.getElementById('taskTitle').value,
        description: document.getElementById('taskDescription').value,
        assignedTo: document.getElementById('assignToSelect').value,
        assignedBy: currentUser._id,
        priority: document.getElementById('taskPriority').value,
        deadline: document.getElementById('taskDeadline').value
    };

    try {
        const response = await fetch(`${API_URL}/tasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(taskData)
        });

        const data = await response.json();

        if (response.ok) {
            alert('Task created successfully!');
            addTaskModal.style.display = 'none';
            document.getElementById('addTaskForm').reset();
            await loadManagerStats();
            await loadManagerTasks();
        } else {
            alert(data.message);
        }
    } catch (error) {
        alert('Error creating task');
        console.error(error);
    }
});

// Team Dashboard
async function showTeamDashboard() {
    teamDashboard.style.display = 'block';
    document.getElementById('teamMemberName').textContent = currentUser.name;
    
    await loadTeamTasks();
}

async function loadTeamTasks() {
    try {
        const response = await fetch(`${API_URL}/tasks/team/${currentUser._id}`);
        const tasks = await response.json();

        const tasksList = document.getElementById('teamTasksList');
        
        if (tasks.length === 0) {
            tasksList.innerHTML = `
                <div class="empty-state">
                    <h3>No tasks assigned</h3>
                    <p>You don't have any tasks assigned yet</p>
                </div>
            `;
            return;
        }

        tasksList.innerHTML = tasks.map(task => `
            <div class="task-card">
                <div class="task-header">
                    <div class="task-title-section">
                        <h4>${task.title}</h4>
                        <div class="task-meta">
                            <span>👔 ${task.assignedBy.name}</span>
                            <span>📅 ${new Date(task.deadline).toLocaleDateString()}</span>
                            <span class="priority-badge priority-${task.priority}">${task.priority}</span>
                        </div>
                    </div>
                    <span class="status-badge status-${task.status}">${task.status.replace('-', ' ')}</span>
                </div>
                ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
                <div class="task-progress">
                    <p>Progress: ${task.progress}%</p>
                    <div class="progress-bar-container">
                        <div class="progress-bar" style="width: ${task.progress}%"></div>
                    </div>
                </div>
                <div class="task-actions">
                    ${task.status !== 'completed' ? `
                        <button class="btn-small btn-update" onclick="openProgressModal('${task._id}', '${task.title}', ${task.progress})">
                            Update Progress
                        </button>
                        <button class="btn-small btn-complete" onclick="completeTask('${task._id}')">
                            Mark Complete
                        </button>
                    ` : '<p style="color: #00A67E; font-weight: 600;">✓ Task Completed</p>'}
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading tasks:', error);
    }
}

// Update Progress Modal
const updateProgressModal = document.getElementById('updateProgressModal');
const closeProgressModal = document.querySelector('.close-progress');
let currentTaskId = null;

closeProgressModal.addEventListener('click', () => {
    updateProgressModal.style.display = 'none';
});

window.addEventListener('click', (e) => {
    if (e.target === updateProgressModal) {
        updateProgressModal.style.display = 'none';
    }
});

function openProgressModal(taskId, taskTitle, currentProgress) {
    currentTaskId = taskId;
    document.getElementById('progressTaskTitle').textContent = taskTitle;
    document.getElementById('progressSlider').value = currentProgress;
    document.getElementById('progressValue').textContent = currentProgress;
    updateProgressModal.style.display = 'block';
}

document.getElementById('progressSlider').addEventListener('input', (e) => {
    document.getElementById('progressValue').textContent = e.target.value;
});

document.getElementById('saveProgressBtn').addEventListener('click', async () => {
    const progress = parseInt(document.getElementById('progressSlider').value);

    try {
        const response = await fetch(`${API_URL}/tasks/${currentTaskId}/progress`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ progress })
        });

        const data = await response.json();

        if (response.ok) {
            alert('Progress updated successfully!');
            updateProgressModal.style.display = 'none';
            await loadTeamTasks();
        } else {
            alert(data.message);
        }
    } catch (error) {
        alert('Error updating progress');
        console.error(error);
    }
});

async function completeTask(taskId) {
    if (!confirm('Are you sure you want to mark this task as completed?')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/tasks/${taskId}/complete`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await response.json();

        if (response.ok) {
            alert('Task marked as completed!');
            await loadTeamTasks();
        } else {
            alert(data.message);
        }
    } catch (error) {
        alert('Error completing task');
        console.error(error);
    }
}