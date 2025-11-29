// Array untuk menyimpan semua todo items
let todos = [];
let currentFilter = 'none'; // default filter: no filter
let todoToDelete = null; // menyimpan ID todo yang akan dihapus

// Theme Management
function initTheme() {
    // Check for saved theme preference or default to light mode
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    const themeIcon = document.querySelector('#themeToggle .material-icons');
    themeIcon.textContent = theme === 'light' ? 'dark_mode' : 'light_mode';
}

// Load todos dari localStorage saat halaman dimuat
document.addEventListener('DOMContentLoaded', function() {
    initTheme();
    loadTodos();
    displayTodos();
    
    // Set minimum date to today
    const dateInput = document.getElementById('dateInput');
    const today = new Date().toISOString().split('T')[0];
    dateInput.setAttribute('min', today);
});

// Event listener untuk theme toggle
document.getElementById('themeToggle').addEventListener('click', toggleTheme);

// Event listener untuk form submit
document.getElementById('todoForm').addEventListener('submit', function(e) {
    e.preventDefault();
    addTodo();
});

// Event listener untuk New button - toggle add task form
document.getElementById('newTaskBtn').addEventListener('click', function() {
    const addTaskModal = document.getElementById('addTaskModal');
    addTaskModal.classList.toggle('hidden');
    if (!addTaskModal.classList.contains('hidden')) {
        document.getElementById('todoInput').focus();
    }
});

// Event listener untuk close add task form
document.getElementById('closeAddTask').addEventListener('click', function() {
    document.getElementById('addTaskModal').classList.add('hidden');
});

// Event listener untuk filter button
document.getElementById('filterBtn').addEventListener('click', function() {
    const filterDropdown = document.getElementById('filterDropdown');
    filterDropdown.classList.toggle('hidden');
});

// Event listener untuk close filter
document.getElementById('closeFilter').addEventListener('click', function() {
    document.getElementById('filterDropdown').classList.add('hidden');
});

// Event listener untuk filter options
document.querySelectorAll('input[name="filter"]').forEach(radio => {
    radio.addEventListener('change', function() {
        currentFilter = this.value;
        displayTodos();
        document.getElementById('filterDropdown').classList.add('hidden');
    });
});

// Event listener untuk select all checkbox
document.getElementById('selectAll').addEventListener('change', function() {
    const isChecked = this.checked;
    todos.forEach(todo => {
        todo.completed = isChecked;
    });
    saveTodos();
    displayTodos();
});

// Event delegation untuk checkbox dan delete button di tabel
document.getElementById('todoTableBody').addEventListener('click', function(e) {
    // Handle delete button
    if (e.target.classList.contains('btn-delete') || e.target.closest('.btn-delete')) {
        const row = e.target.closest('tr');
        const todoId = parseInt(row.getAttribute('data-id'));
        deleteTodo(todoId);
    }
});

// Event delegation untuk checkbox
document.getElementById('todoTableBody').addEventListener('change', function(e) {
    if (e.target.classList.contains('todo-checkbox')) {
        const row = e.target.closest('tr');
        const todoId = parseInt(row.getAttribute('data-id'));
        toggleTodo(todoId);
    }
});

// Event listener untuk modal delete
document.getElementById('cancelDelete').addEventListener('click', function() {
    closeDeleteModal();
});

document.getElementById('confirmDelete').addEventListener('click', function() {
    if (todoToDelete !== null) {
        confirmDeleteTodo();
    }
});

// Close modal ketika klik di luar modal
document.getElementById('deleteModal').addEventListener('click', function(e) {
    if (e.target.id === 'deleteModal') {
        closeDeleteModal();
    }
});

// Fungsi untuk menambah todo baru
function addTodo() {
    const todoInput = document.getElementById('todoInput');
    const dateInput = document.getElementById('dateInput');
    
    const todoText = todoInput.value.trim();
    const todoDate = dateInput.value;
    
    if (todoText === '' || todoDate === '') {
        alert('Please fill in both task name and date!');
        return;
    }
    
    // Buat object todo baru
    const newTodo = {
        id: Date.now(),
        text: todoText,
        date: todoDate,
        completed: false,
        createdAt: new Date().toISOString()
    };
    
    // Tambahkan ke array
    todos.push(newTodo);
    
    // Simpan ke localStorage
    saveTodos();
    
    // Display updated list
    displayTodos();
    
    // Clear form
    todoInput.value = '';
    dateInput.value = '';
    
    // Hide add task form
    document.getElementById('addTaskModal').classList.add('hidden');
}

// Fungsi untuk menampilkan todos dalam tabel
function displayTodos() {
    const todoTableBody = document.getElementById('todoTableBody');
    const emptyMessage = document.getElementById('emptyMessage');
    const selectAllCheckbox = document.getElementById('selectAll');
    
    // Clear current table
    todoTableBody.innerHTML = '';
    
    // Cek apakah ada todos
    if (todos.length === 0) {
        emptyMessage.classList.remove('hidden');
        document.querySelector('.todo-table').style.display = 'none';
        return;
    }
    
    emptyMessage.classList.add('hidden');
    document.querySelector('.todo-table').style.display = 'table';
    
    // Sort todos berdasarkan filter yang aktif
    let sortedTodos = [...todos];
    
    if (currentFilter === 'none') {
        // No Filter: Urutkan berdasarkan waktu created (yang pertama dibuat di atas)
        sortedTodos.sort((a, b) => {
            return new Date(a.createdAt) - new Date(b.createdAt);
        });
    } else if (currentFilter === 'pending-first') {
        // Filter 1: Pending dengan tanggal terdekat di atas, Completed dengan tanggal terdekat di bawah
        sortedTodos.sort((a, b) => {
            // Jika keduanya pending atau keduanya completed, sort by date
            if (a.completed === b.completed) {
                const dateA = new Date(a.date);
                const dateB = new Date(b.date);
                // Keduanya sort ascending (tanggal terdekat dulu)
                return dateA - dateB;
            }
            // Pending tasks selalu di atas
            return a.completed ? 1 : -1;
        });
    } else if (currentFilter === 'completed-first') {
        // Filter 2: Completed dengan tanggal terdekat di atas, Pending dengan tanggal terdekat di bawah
        sortedTodos.sort((a, b) => {
            // Jika keduanya completed atau keduanya pending, sort by date
            if (a.completed === b.completed) {
                const dateA = new Date(a.date);
                const dateB = new Date(b.date);
                // Keduanya sort ascending (tanggal terdekat dulu)
                return dateA - dateB;
            }
            // Completed tasks selalu di atas
            return a.completed ? -1 : 1;
        });
    }
    
    // Update select all checkbox
    const allCompleted = todos.every(todo => todo.completed);
    selectAllCheckbox.checked = allCompleted && todos.length > 0;
    
    // Buat row untuk setiap todo
    sortedTodos.forEach(todo => {
        const row = createTodoRow(todo);
        todoTableBody.appendChild(row);
    });
}

// Fungsi untuk membuat row tabel todo
function createTodoRow(todo) {
    const row = document.createElement('tr');
    row.className = todo.completed ? 'completed' : '';
    row.setAttribute('data-id', todo.id);
    
    // Format date
    const formattedDate = formatDate(todo.date);
    
    // Get day of week
    const dayOfWeek = getDayOfWeek(todo.date);
    
    row.innerHTML = `
        <td class="col-checkbox">
            <input 
                type="checkbox" 
                class="todo-checkbox" 
                ${todo.completed ? 'checked' : ''}
            >
        </td>
        <td class="col-task">
            <span class="task-text ${todo.completed ? 'completed' : ''}">
                <span class="material-icons task-icon">description</span>
                ${todo.text}
            </span>
        </td>
        <td class="col-date">
            <span class="task-date">${dayOfWeek}, ${formattedDate}</span>
        </td>
        <td class="col-status">
            <span class="status-badge ${todo.completed ? 'status-completed' : 'status-pending'}">
                ${todo.completed ? 'Completed' : 'Pending'}
            </span>
        </td>
        <td class="col-actions">
            <button class="btn-delete">Delete</button>
        </td>
    `;
    
    return row;
}

// Fungsi untuk toggle status completed
function toggleTodo(id) {
    const todo = todos.find(t => t.id === id);
    if (todo) {
        todo.completed = !todo.completed;
        saveTodos();
        displayTodos();
    }
}

// Fungsi untuk delete todo
function deleteTodo(id) {
    todoToDelete = id;
    openDeleteModal();
}

// Fungsi untuk membuka modal delete
function openDeleteModal() {
    const modal = document.getElementById('deleteModal');
    modal.classList.remove('hidden');
}

// Fungsi untuk menutup modal delete
function closeDeleteModal() {
    const modal = document.getElementById('deleteModal');
    modal.classList.add('hidden');
    todoToDelete = null;
}

// Fungsi untuk konfirmasi delete
function confirmDeleteTodo() {
    if (todoToDelete !== null) {
        todos = todos.filter(todo => todo.id !== todoToDelete);
        saveTodos();
        displayTodos();
        closeDeleteModal();
    }
}

// Fungsi untuk format date (MMM DD, YYYY)
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', options);
}

// Fungsi untuk get day of week
function getDayOfWeek(dateString) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const date = new Date(dateString);
    return days[date.getDay()];
}

// Fungsi untuk save todos ke localStorage
function saveTodos() {
    localStorage.setItem('todos', JSON.stringify(todos));
}

// Fungsi untuk load todos dari localStorage
function loadTodos() {
    const storedTodos = localStorage.getItem('todos');
    if (storedTodos) {
        todos = JSON.parse(storedTodos);
    }
}