const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Atlas Connection
const MONGODB_URI = 'mongodb+srv://carekaro138_db_user:meFILuJz2UpECaaS@rentcreditdb.zlro9it.mongodb.net/RentCreditDB?retryWrites=true&w=majority&appName=RentCreditDB';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB Connected'))
.catch(err => console.log(err));

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, enum: ['manager', 'team'], required: true },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Task Schema
const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  deadline: Date,
  progress: { type: Number, default: 0 },
  status: { type: String, enum: ['pending', 'in-progress', 'completed'], default: 'pending' },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  createdAt: { type: Date, default: Date.now }
});

const Task = mongoose.model('Task', taskSchema);

// Routes

// Sign Up
app.post('/api/signup', async (req, res) => {
  try {
    const { name, email, role } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = new User({ name, email, role });
    await user.save();
    
    res.status(201).json({ message: 'User created successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Error creating user', error: error.message });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { email } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json({ message: 'Login successful', user });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
});

// Get all team members
app.get('/api/users/team', async (req, res) => {
  try {
    const teamMembers = await User.find({ role: 'team' });
    res.status(200).json(teamMembers);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching team members', error: error.message });
  }
});

// Create Task (Manager)
app.post('/api/tasks', async (req, res) => {
  try {
    const { title, description, assignedTo, assignedBy, deadline, priority } = req.body;
    
    const task = new Task({
      title,
      description,
      assignedTo,
      assignedBy,
      deadline,
      priority
    });
    
    await task.save();
    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email');
    
    res.status(201).json({ message: 'Task created successfully', task: populatedTask });
  } catch (error) {
    res.status(500).json({ message: 'Error creating task', error: error.message });
  }
});

// Get all tasks (Manager)
app.get('/api/tasks/manager/:managerId', async (req, res) => {
  try {
    const tasks = await Task.find({ assignedBy: req.params.managerId })
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email')
      .sort({ createdAt: -1 });
    
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tasks', error: error.message });
  }
});

// Get tasks for team member
app.get('/api/tasks/team/:teamMemberId', async (req, res) => {
  try {
    const tasks = await Task.find({ assignedTo: req.params.teamMemberId })
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email')
      .sort({ createdAt: -1 });
    
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tasks', error: error.message });
  }
});

// Update task progress (Team Member)
app.patch('/api/tasks/:taskId/progress', async (req, res) => {
  try {
    const { progress } = req.body;
    
    const updateData = { progress };
    if (progress > 0 && progress < 100) {
      updateData.status = 'in-progress';
    }
    
    const task = await Task.findByIdAndUpdate(
      req.params.taskId,
      updateData,
      { new: true }
    ).populate('assignedTo', 'name email').populate('assignedBy', 'name email');
    
    res.status(200).json({ message: 'Progress updated', task });
  } catch (error) {
    res.status(500).json({ message: 'Error updating progress', error: error.message });
  }
});

// Mark task as completed
app.patch('/api/tasks/:taskId/complete', async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.taskId,
      { status: 'completed', progress: 100 },
      { new: true }
    ).populate('assignedTo', 'name email').populate('assignedBy', 'name email');
    
    res.status(200).json({ message: 'Task marked as completed', task });
  } catch (error) {
    res.status(500).json({ message: 'Error completing task', error: error.message });
  }
});

// Get task statistics (Manager)
app.get('/api/tasks/stats/:managerId', async (req, res) => {
  try {
    const total = await Task.countDocuments({ assignedBy: req.params.managerId });
    const completed = await Task.countDocuments({ assignedBy: req.params.managerId, status: 'completed' });
    const inProgress = await Task.countDocuments({ assignedBy: req.params.managerId, status: 'in-progress' });
    const pending = await Task.countDocuments({ assignedBy: req.params.managerId, status: 'pending' });
    
    res.status(200).json({ total, completed, inProgress, pending });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching stats', error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});