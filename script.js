// DOM elements
const taskForm = document.querySelector('.task-form');
const emptyState = document.querySelector('.empty-state');
const progressBar = document.querySelector('.progress-bar');
const progressPercentage = document.querySelector('.progress-percentage');
const completedValueElement = document.querySelector('.completed-value');
const streakValueElement = document.querySelector('.streak-value');
const rateValueElement = document.querySelector('.rate-value');
const themeButtons = document.querySelectorAll('.theme-btn');
const soundToggle = document.querySelector('.toggle-track');
const filterButtons = document.querySelectorAll('.filter-btn');
const rewardPopup = document.querySelector('.reward-popup');
const rewardButton = document.querySelector('.reward-button');
const backgroundAnimation = document.querySelector('.background-animation');

// Modify the task form to include a due date input
taskForm.innerHTML = `
  <input type="text" id="task-input" placeholder="Add a new task..." autocomplete="off">
  <input type="date" id="due-date-input" min="${new Date().toISOString().split('T')[0]}">
  <button type="submit" id="add-btn">ADD</button>
`;

// Get references to form elements AFTER modifying the form
const taskInput = document.getElementById('task-input');
const dueDateInput = document.getElementById('due-date-input');
const taskList = document.querySelector('.task-list');

// Set default due date to today
dueDateInput.valueAsDate = new Date();

// Create a today's date display
const appHeader = document.querySelector('.app-header');
const todayDisplay = document.createElement('div');
todayDisplay.classList.add('today-date');
todayDisplay.style.fontSize = '1.1em';
todayDisplay.style.color = 'var(--secondary)';
todayDisplay.style.marginBottom = '15px';

const today = new Date();
const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
todayDisplay.textContent = `Today: ${today.toLocaleDateString('en-US', options)}`;
appHeader.appendChild(todayDisplay);

// Audio context setup
let audioContext;
let soundEnabled = true;

try {
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
} catch (e) {
  console.log("Web Audio API not supported");
}

// State
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let currentFilter = 'all';
let streak = parseInt(localStorage.getItem('streak')) || 0;
let lastCompletedDate = localStorage.getItem('lastCompletedDate');
let completedCount = parseInt(localStorage.getItem('completedCount')) || 0;
let totalTasksCreated = parseInt(localStorage.getItem('totalTasksCreated')) || 0;

// Functions

// Initialize background animation
function initBackgroundAnimation() {
  for (let i = 0; i < 5; i++) {
    const island = document.createElement('div');
    island.classList.add('floating-island');
    island.style.width = `${Math.random() * 200 + 50}px`;
    island.style.height = island.style.width;
    island.style.left = `${Math.random() * 100}%`;
    island.style.top = `${Math.random() * 100}%`;
    island.style.animationDuration = `${Math.random() * 10 + 5}s`;
    island.style.opacity = `${Math.random() * 0.3 + 0.1}`;
    island.style.animation = `float ${Math.random() * 5 + 8}s infinite ease-in-out`;
    backgroundAnimation.appendChild(island);
  }
}

// Save tasks to localStorage
function saveTasks() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
  updateTasksUI();
}
// Update streak
function updateStreak() {
  const today = new Date().toLocaleDateString();
  
  if (lastCompletedDate !== today) {
    if (lastCompletedDate) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayString = yesterday.toLocaleDateString();
      
      if (lastCompletedDate !== yesterdayString) {
        streak = 1;
      } else {
        streak++;
      }
    } else {
      streak = 1;
    }
    
    lastCompletedDate = today;
    localStorage.setItem('lastCompletedDate', lastCompletedDate);
    localStorage.setItem('streak', streak);
  }
  
  streakValueElement.textContent = streak;
}

// Update UI statistics
function updateStats() {
  const completedTasks = tasks.filter(task => task.completed).length;
  const totalTasks = tasks.length;
  
  completedValueElement.textContent = completedCount;
  
  const completionRate = totalTasksCreated > 0 ? Math.round((completedCount / totalTasksCreated) * 100) : 0;
  rateValueElement.textContent = `${completionRate}%`;
  
  if (totalTasks > 0) {
    const percentage = Math.round((completedTasks / totalTasks) * 100);
    progressBar.style.width = `${percentage}%`;
    progressPercentage.textContent = `${percentage}%`;
  } else {
    progressBar.style.width = '0%';
    progressPercentage.textContent = '0%';
  }
}

// Determine if a task is overdue
function isOverdue(dueDate) {
  if (!dueDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const taskDueDate = new Date(dueDate);
  taskDueDate.setHours(0, 0, 0, 0);
  return taskDueDate < today;
}

// Format due date for display
function formatDueDate(dateString) {
  if (!dateString) return '';
  
  const dueDate = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (dueDate.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (dueDate.toDateString() === tomorrow.toDateString()) {
    return 'Tomorrow';
  } else if (dueDate.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  } else {
    return dueDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: dueDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    });
  }
}

// Create HTML for a task item
function createTaskElement(task) {
  const taskItem = document.createElement('li');
  taskItem.classList.add('task-item');
  if (task.completed) {
    taskItem.classList.add('completed');
  }
  
  taskItem.dataset.id = task.id;
  
  const dateFormatted = new Date(task.date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  
  const dueDateDisplay = task.dueDate ? formatDueDate(task.dueDate) : 'No due date';
  
  // Add overdue class if task is past due date and not completed
  if (isOverdue(task.dueDate) && !task.completed) {
    taskItem.classList.add('overdue');
    taskItem.style.borderLeft = '4px solid #FF5252';
  }
  
  taskItem.innerHTML = `
    <div class="task-checkbox-container">
      <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
      <div class="checkbox-ring"></div>
    </div>
    <div class="task-content">
      <div class="task-text">${task.text}</div>
      <div class="task-meta">
        <div class="task-date">Added: ${dateFormatted}</div>
        <div class="due-date" style="margin-left: 10px; ${isOverdue(task.dueDate) && !task.completed ? 'color: #FF5252; font-weight: bold;' : ''}">
          Due: ${dueDateDisplay}
        </div>
      </div>
    </div>
    <div class="task-actions">
      <button class="task-btn edit-btn">✏️</button>
      <button class="task-btn delete-btn">🗑️</button>
    </div>
  `;
  
  return taskItem;
}

// Update tasks UI
function updateTasksUI() {
  taskList.innerHTML = '';
  
  let filteredTasks = tasks;
  if (currentFilter === 'active') {
    filteredTasks = tasks.filter(task => !task.completed);
  } else if (currentFilter === 'completed') {
    filteredTasks = tasks.filter(task => task.completed);
  }
  
  if (filteredTasks.length === 0) {
    emptyState.style.display = 'block';
  } else {
    emptyState.style.display = 'none';
    
    filteredTasks.forEach(task => {
      const taskElement = createTaskElement(task);
      taskList.appendChild(taskElement);
    });
  }
  
  updateStats();
}

// Sound effects
function playSound(type) {
  if (!soundEnabled || !audioContext) return;
  
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  switch(type) {
    case 'complete':
      oscillator.type = 'sine';
      oscillator.frequency.value = 587.33; // D5
      gainNode.gain.value = 0.1;
      oscillator.start();
      
      // Fancy chord
      setTimeout(() => {
        const osc2 = audioContext.createOscillator();
        const gain2 = audioContext.createGain();
        osc2.connect(gain2);
        gain2.connect(audioContext.destination);
        osc2.type = 'sine';
        osc2.frequency.value = 659.25; // E5
        gain2.gain.value = 0.1;
        osc2.start();
        
        setTimeout(() => {
          const osc3 = audioContext.createOscillator();
          const gain3 = audioContext.createGain();
          osc3.connect(gain3);
          gain3.connect(audioContext.destination);
          osc3.type = 'sine';
          osc3.frequency.value = 783.99; // G5
          gain3.gain.value = 0.1;
          osc3.start();
          
          gain3.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 1);
          osc3.stop(audioContext.currentTime + 1);
        }, 100);
        
        gain2.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 1.2);
        osc2.stop(audioContext.currentTime + 1.2);
      }, 100);
      
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 1.5);
      oscillator.stop(audioContext.currentTime + 1.5);
      break;
      
    case 'add':
      oscillator.type = 'sine';
      oscillator.frequency.value = 440; // A4
      gainNode.gain.value = 0.1;
      oscillator.start();
      
      // Quick arpeggio
      setTimeout(() => {
        oscillator.frequency.value = 554.37; // C#5
      }, 100);
      
      setTimeout(() => {
        oscillator.frequency.value = 659.25; // E5
      }, 200);
      
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5);
      oscillator.stop(audioContext.currentTime + 0.5);
      break;
      
    case 'delete':
      oscillator.type = 'triangle';
      oscillator.frequency.value = 392; // G4
      gainNode.gain.value = 0.1;
      oscillator.start();
      
      setTimeout(() => {
        oscillator.frequency.value = 349.23; // F4
      }, 100);
      
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);
      oscillator.stop(audioContext.currentTime + 0.3);
      break;
  }
}

// Show celebratory animation and reward
function showCelebration() {
  // Confetti animation
  for (let i = 0; i < 100; i++) {
    createConfetti();
  }
  
  // Show reward popup
  setTimeout(() => {
    rewardPopup.classList.add('show');
  }, 500);
}

// Create a confetti particle
function createConfetti() {
  const confetti = document.createElement('div');
  confetti.style.position = 'absolute';
  confetti.style.width = `${Math.random() * 10 + 5}px`;
  confetti.style.height = `${Math.random() * 10 + 5}px`;
  confetti.style.backgroundColor = getRandomColor();
  confetti.style.borderRadius = '50%';
  confetti.style.opacity = Math.random();
  
  const startPosX = 50;
  const startPosY = 50;
  
  confetti.style.left = `${startPosX}%`;
  confetti.style.top = `${startPosY}%`;
  
  document.querySelector('.confetti-container').appendChild(confetti);
  
  const angle = Math.random() * Math.PI * 2;
  const velocity = Math.random() * 15 + 5;
  const velocityX = Math.cos(angle) * velocity;
  const velocityY = Math.sin(angle) * velocity;
  
  let posX = startPosX;
  let posY = startPosY;
  
  const gravity = 0.1;
  let velocityYWithGravity = velocityY;
  
  const animateConfetti = () => {
    if (confetti.style.opacity <= 0) {
      confetti.remove();
      return;
    }
    
    velocityYWithGravity += gravity;
    posX += velocityX;
    posY += velocityYWithGravity;
    
    confetti.style.left = `${posX}%`;
    confetti.style.top = `${posY}%`;
    confetti.style.opacity = parseFloat(confetti.style.opacity) - 0.01;
    confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
    
    requestAnimationFrame(animateConfetti);
  };
  
  requestAnimationFrame(animateConfetti);
}

// Get random color for confetti
function getRandomColor() {
  const colors = ['#FF5757', '#5CE1E6', '#FFDE59', '#7C4DFF', '#4CAF50'];
  return colors[Math.floor(Math.random() * colors.length)];
}

// Change theme
function changeTheme(themeName) {
  const root = document.documentElement;
  
  switch(themeName) {
    case 'purple':
      root.style.setProperty('--primary', '#7C4DFF');
      root.style.setProperty('--secondary', '#00E5FF');
      root.style.setProperty('--tertiary', '#651FFF');
      root.style.setProperty('--quaternary', '#00B0FF');
      break;
    case 'orange':
      root.style.setProperty('--primary', '#FF9100');
      root.style.setProperty('--secondary', '#FFEA00');
      root.style.setProperty('--tertiary', '#FF6D00');
      root.style.setProperty('--quaternary', '#FFAB00');
      break;
    case 'green':
      root.style.setProperty('--primary', '#00C853');
      root.style.setProperty('--secondary', '#64FFDA');
      root.style.setProperty('--tertiary', '#00E676');
      root.style.setProperty('--quaternary', '#1DE9B6');
      break;
    case 'red':
      root.style.setProperty('--primary', '#FF1744');
      root.style.setProperty('--secondary', '#F50057');
      root.style.setProperty('--tertiary', '#D50000');
      root.style.setProperty('--quaternary', '#FF5252');
      break;
    default: // Default theme
      root.style.setProperty('--primary', '#FF5757');
      root.style.setProperty('--secondary', '#5CE1E6');
      root.style.setProperty('--tertiary', '#FFDE59');
      root.style.setProperty('--quaternary', '#7C4DFF');
      break;
  }
  
  localStorage.setItem('theme', themeName);
}

// Event Listeners

// Add task
taskForm.addEventListener('submit', function(e) {
  e.preventDefault();
  
  const taskText = taskInput.value.trim();
  if (!taskText) return;
  
  const dueDate = dueDateInput.value || null;
  
  const newTask = {
    id: Date.now().toString(),
    text: taskText,
    completed: false,
    date: new Date().toISOString(),
    dueDate: dueDate
  };
  
  tasks.push(newTask);
  totalTasksCreated++;
  localStorage.setItem('totalTasksCreated', totalTasksCreated);
  
  saveTasks();
  taskInput.value = '';
  // Reset due date to today
  dueDateInput.valueAsDate = new Date();
  
  playSound('add');
  
  // Temporarily flash the new task
  setTimeout(() => {
    const newTaskElement = document.querySelector(`[data-id="${newTask.id}"]`);
    if (newTaskElement) {
      newTaskElement.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
      setTimeout(() => {
        newTaskElement.style.backgroundColor = '';
      }, 300);
    }
  }, 10);
});

// Task actions (using event delegation)
taskList.addEventListener('click', function(e) {
  // Check if the clicked element is a checkbox or another interactive element
  if (e.target.classList.contains('task-checkbox')) {
    const taskItem = e.target.closest('.task-item');
    if (!taskItem) return;
    
    const taskId = taskItem.dataset.id;
    const taskIndex = tasks.findIndex(task => task.id === taskId);
    
    if (taskIndex === -1) return;
    
    // Toggle completion status
    const isCompleted = e.target.checked;
    tasks[taskIndex].completed = isCompleted;
    
    if (isCompleted) {
      taskItem.classList.add('completed');
      playSound('complete');
      taskItem.classList.add('celebrating');
      
      setTimeout(() => {
        taskItem.classList.remove('celebrating');
      }, 800);
      
      // Update streak and completion count
      completedCount++;
      localStorage.setItem('completedCount', completedCount);
      updateStreak();
      
      // 30% chance to show celebration for dopamine boost
      if (Math.random() < 0.3) {
        showCelebration();
      }
    } else {
      taskItem.classList.remove('completed');
    }
    
    saveTasks();
    return;
  }
  
  // Handle other task actions
  const taskItem = e.target.closest('.task-item');
  if (!taskItem) return;
  
  const taskId = taskItem.dataset.id;
  const taskIndex = tasks.findIndex(task => task.id === taskId);
  
  if (taskIndex === -1) return;

  // Delete task
  if (e.target.classList.contains('delete-btn')) {
    tasks.splice(taskIndex, 1);
    saveTasks();
    playSound('delete');
  }
  
  // Edit task
  else if (e.target.classList.contains('edit-btn')) {
    const taskContentElement = taskItem.querySelector('.task-content');
    const currentText = tasks[taskIndex].text;
    const currentDueDate = tasks[taskIndex].dueDate || '';
    
    // Create edit form
    const editForm = document.createElement('div');
    editForm.classList.add('edit-form');
    editForm.style.width = '100%';
    
    editForm.innerHTML = `
      <input type="text" class="edit-text-input" value="${currentText}" style="width: 100%; padding: 8px; margin-bottom: 8px; border: none; border-radius: 8px; background-color: rgba(255, 255, 255, 0.2); color: var(--text);">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <input type="date" class="edit-date-input" value="${currentDueDate}" style="padding: 8px; border: none; border-radius: 8px; background-color: rgba(255, 255, 255, 0.2); color: var(--text);">
        <button class="save-btn" style="padding: 8px 15px; border: none; border-radius: 8px; background-color: var(--tertiary); color: black; cursor: pointer; margin-left: 8px;">Save</button>
      </div>
    `;
    
    taskContentElement.replaceWith(editForm);
    editForm.querySelector('.edit-text-input').focus();
    
    const saveEdit = () => {
      const newText = editForm.querySelector('.edit-text-input').value.trim();
      const newDueDate = editForm.querySelector('.edit-date-input').value || null;
      
      if (newText) {
        tasks[taskIndex].text = newText;
        tasks[taskIndex].dueDate = newDueDate;
        saveTasks();
      }
      
      // Restore the task content element
      const updatedTaskElement = createTaskElement(tasks[taskIndex]);
      taskItem.replaceWith(updatedTaskElement);
    };
    
    editForm.querySelector('.save-btn').addEventListener('click', saveEdit);
    editForm.querySelector('.edit-text-input').addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        saveEdit();
      }
    });
  }
});

// Filter tasks
filterButtons.forEach(button => {
  button.addEventListener('click', function() {
    const filter = this.dataset.filter;
    currentFilter = filter;
    
    // Update active button
    filterButtons.forEach(btn => btn.classList.remove('active'));
    this.classList.add('active');
    
    updateTasksUI();
  });
});

// Theme selection
themeButtons.forEach(button => {
  button.addEventListener('click', function() {
    const theme = this.dataset.theme;
    
    // Update active button
    themeButtons.forEach(btn => btn.classList.remove('active'));
    this.classList.add('active');
    
    changeTheme(theme);
  });
});

// Sound toggle
soundToggle.addEventListener('click', function() {
  soundEnabled = !soundEnabled;
  this.classList.toggle('active', soundEnabled);
  
  localStorage.setItem('soundEnabled', soundEnabled);
  
  // Resume audio context if it was suspended
  if (soundEnabled && audioContext && audioContext.state === 'suspended') {
    audioContext.resume();
  }
});

// Close reward popup
rewardButton.addEventListener('click', function() {
  rewardPopup.classList.remove('show');
});

// Initialize app
function initApp() {
  // Set saved theme
  const savedTheme = localStorage.getItem('theme') || 'default';
  changeTheme(savedTheme);
  
  // Set saved sound preference
  soundEnabled = localStorage.getItem('soundEnabled') !== 'false';
  soundToggle.classList.toggle('active', soundEnabled);
  
  // Initialize background animation
  initBackgroundAnimation();
  
  // Display tasks
  updateTasksUI();
  
  // Update streak display
  streakValueElement.textContent = streak;
  
  // Set active theme button
  themeButtons.forEach(btn => {
    if (btn.dataset.theme === savedTheme) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Add CSS for due date styling
  const style = document.createElement('style');
  style.textContent = `
    .task-form {
      display: grid;
      grid-template-columns: 1fr auto auto;
      gap: 15px;
      margin-bottom: 30px;
    }
    
    #due-date-input {
      padding: 18px;
      border: none;
      border-radius: 12px;
      font-size: 1.1em;
      background-color: rgba(255, 255, 255, 0.1);
      color: var(--text);
      border: 2px solid transparent;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
      transition: all 0.3s;
    }
    
    #due-date-input:focus {
      outline: none;
      border-color: var(--tertiary);
      box-shadow: var(--success-glow);
    }
    
    .overdue {
      animation: pulse-warning 2s infinite;
    }
    
    @keyframes pulse-warning {
      0% { box-shadow: 0 0 0 0 rgba(255, 82, 82, 0.5); }
      70% { box-shadow: 0 0 0 10px rgba(255, 82, 82, 0); }
      100% { box-shadow: 0 0 0 0 rgba(255, 82, 82, 0); }
    }
    
    @media (max-width: 768px) {
      .task-form {
        grid-template-columns: 1fr;
      }
    }
  `;
  document.head.appendChild(style);
}

// Update today's date display daily
function updateTodayDisplay() {
  const today = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  todayDisplay.textContent = `Today: ${today.toLocaleDateString('en-US', options)}`;
  
  // Check for overdue tasks
  tasks.forEach(task => {
    if (isOverdue(task.dueDate) && !task.completed) {
      const taskElement = document.querySelector(`[data-id="${task.id}"]`);
      if (taskElement) {
        taskElement.classList.add('overdue');
      }
    }
  });
}

// Start the app
initApp();
updateTodayDisplay();

// Set up daily refresh for the date display
setInterval(updateTodayDisplay, 1000 * 60 * 60); // Update every hour

// Resume audio context on first interaction
document.addEventListener('click', function resumeAudio() {
  if (audioContext && audioContext.state === 'suspended') {
    audioContext.resume();
  }
  document.removeEventListener('click', resumeAudio);
}, { once: true });

//To Clear 
function clearTasks() {
    const confirmed = confirm("Are you sure you want to clear all tasks? This action cannot be undone.");
    if (confirmed) {
      // Clear localStorage
      localStorage.removeItem('tasks');
  
      // Clear in-memory tasks array
      tasks = [];
  
      // Clear tasks from UI
      const tasksContainer = document.getElementById('tasks');
      if (tasksContainer) {
        tasksContainer.innerHTML = '';
      }
  
      // Reset related counters if needed
      completedCount = 0;
      totalTasksCreated = 0;
      streak = 0;
      lastCompletedDate = null;
  
      // Also update localStorage for other keys if you want to reset everything:
      localStorage.setItem('completedCount', completedCount);
      localStorage.setItem('totalTasksCreated', totalTasksCreated);
      localStorage.setItem('streak', streak);
      localStorage.removeItem('lastCompletedDate');
  
      // Optionally update UI counters if you have elements showing them
      updateTasksUI();
      updateStats();

    }
  }
  
  function updateCountersUI() {
    // Example: update streak and counts display elements
    document.getElementById('streak').textContent = streak;
    document.getElementById('completedCount').textContent = completedCount;
    document.getElementById('totalTasksCreated').textContent = totalTasksCreated;
  }
