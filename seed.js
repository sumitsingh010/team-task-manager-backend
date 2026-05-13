const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');
const Project = require('./models/Project');
const Task = require('./models/Task');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // Clear existing data
  await User.deleteMany({});
  await Project.deleteMany({});
  await Task.deleteMany({});

  // Create users
  const admin = await User.create({
    name: 'Sumit Singh',
    email: 'admin@taskmanager.com',
    password: 'admin123',
    role: 'admin',
  });

  const member1 = await User.create({
    name: 'Rahul Kumar',
    email: 'rahul@taskmanager.com',
    password: 'member123',
    role: 'member',
  });

  const member2 = await User.create({
    name: 'Priya Sharma',
    email: 'priya@taskmanager.com',
    password: 'member123',
    role: 'member',
  });

  console.log('Users created: Admin + 2 Members');

  // Create projects
  const project1 = await Project.create({
    title: 'E-Commerce Website',
    description: 'Build a full-stack e-commerce platform with React and Node.js',
    createdBy: admin._id,
    members: [admin._id, member1._id, member2._id],
    status: 'active',
  });

  const project2 = await Project.create({
    title: 'Mobile App Redesign',
    description: 'Redesign the mobile app UI/UX for better user experience',
    createdBy: admin._id,
    members: [admin._id, member1._id],
    status: 'active',
  });

  console.log('Projects created: 2');

  // Create tasks with various statuses and priorities
  const now = new Date();

  // Overdue tasks (due date in the past)
  await Task.create({
    title: 'Setup CI/CD Pipeline',
    description: 'Configure GitHub Actions for automated testing and deployment',
    assignedTo: member1._id,
    status: 'todo',
    priority: 'high',
    dueDate: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    projectId: project1._id,
  });

  await Task.create({
    title: 'Fix Payment Gateway Bug',
    description: 'Users unable to complete payment on checkout page',
    assignedTo: member2._id,
    status: 'in-progress',
    priority: 'high',
    dueDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    projectId: project1._id,
  });

  // In progress tasks
  await Task.create({
    title: 'Design Product Catalog Page',
    description: 'Create responsive product listing with filters and search',
    assignedTo: member2._id,
    status: 'in-progress',
    priority: 'medium',
    dueDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    projectId: project1._id,
  });

  await Task.create({
    title: 'Implement User Authentication',
    description: 'JWT-based login and signup with password hashing',
    assignedTo: member1._id,
    status: 'in-progress',
    priority: 'high',
    dueDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    projectId: project1._id,
  });

  // Completed tasks
  await Task.create({
    title: 'Setup Project Repository',
    description: 'Initialize Git repo, add README, and configure ESLint',
    assignedTo: admin._id,
    status: 'completed',
    priority: 'low',
    dueDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    projectId: project1._id,
  });

  await Task.create({
    title: 'Database Schema Design',
    description: 'Design MongoDB schemas for users, products, orders, and reviews',
    assignedTo: admin._id,
    status: 'completed',
    priority: 'medium',
    dueDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    projectId: project1._id,
  });

  // Project 2 tasks
  await Task.create({
    title: 'Create Wireframes',
    description: 'Design wireframes for all major screens in Figma',
    assignedTo: member1._id,
    status: 'completed',
    priority: 'medium',
    dueDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
    projectId: project2._id,
  });

  await Task.create({
    title: 'Implement New Navigation',
    description: 'Build the new bottom tab navigation with animations',
    assignedTo: member1._id,
    status: 'in-progress',
    priority: 'high',
    dueDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
    projectId: project2._id,
  });

  await Task.create({
    title: 'Update Color Scheme',
    description: 'Apply the new brand colors across all app screens',
    assignedTo: admin._id,
    status: 'todo',
    priority: 'low',
    dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
    projectId: project2._id,
  });

  console.log('Tasks created: 9 (2 overdue, 3 in-progress, 3 completed, 1 todo)');
  console.log('\n=== LOGIN CREDENTIALS ===');
  console.log('Admin:   admin@taskmanager.com / admin123');
  console.log('Member1: rahul@taskmanager.com / member123');
  console.log('Member2: priya@taskmanager.com / member123');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
