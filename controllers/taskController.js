const { body } = require('express-validator');
const Task = require('../models/Task');
const Project = require('../models/Project');

// Validation rules
const createTaskValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Task title is required')
    .isLength({ min: 2, max: 200 })
    .withMessage('Title must be between 2 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  body('assignedTo')
    .notEmpty()
    .withMessage('Task must be assigned to a user')
    .isMongoId()
    .withMessage('Invalid user ID'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Priority must be low, medium, or high'),
  body('dueDate')
    .notEmpty()
    .withMessage('Due date is required')
    .isISO8601()
    .withMessage('Invalid date format'),
  body('projectId')
    .notEmpty()
    .withMessage('Project ID is required')
    .isMongoId()
    .withMessage('Invalid project ID'),
];

const updateTaskValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Title must be between 2 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  body('assignedTo').optional().isMongoId().withMessage('Invalid user ID'),
  body('status')
    .optional()
    .isIn(['todo', 'in-progress', 'completed'])
    .withMessage('Status must be todo, in-progress, or completed'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Priority must be low, medium, or high'),
  body('dueDate').optional().isISO8601().withMessage('Invalid date format'),
];

// @desc    Create task
// @route   POST /api/tasks
// @access  Admin
const createTask = async (req, res) => {
  try {
    const { title, description, assignedTo, priority, dueDate, projectId } =
      req.body;

    // Verify project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    // Verify assignee is a member of the project
    if (!project.members.some((m) => m.toString() === assignedTo)) {
      return res.status(400).json({
        success: false,
        message: 'Assigned user must be a member of the project',
      });
    }

    const task = await Task.create({
      title,
      description,
      assignedTo,
      priority,
      dueDate,
      projectId,
    });

    await task.populate('assignedTo', 'name email');
    await task.populate('projectId', 'title');

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: { task },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error creating task',
      error: error.message,
    });
  }
};

// @desc    Get tasks
// @route   GET /api/tasks
// @access  Private
const getTasks = async (req, res) => {
  try {
    const { projectId, status, priority, assignedTo, search, overdue } =
      req.query;
    let query = {};

    // Members can only see their own tasks
    if (req.user.role === 'member') {
      query.assignedTo = req.user._id;
    }

    // Filter by project
    if (projectId) {
      query.projectId = projectId;
    }

    // Filter by status
    if (status && ['todo', 'in-progress', 'completed'].includes(status)) {
      query.status = status;
    }

    // Filter by priority
    if (priority && ['low', 'medium', 'high'].includes(priority)) {
      query.priority = priority;
    }

    // Filter by assigned user (admin only)
    if (assignedTo && req.user.role === 'admin') {
      query.assignedTo = assignedTo;
    }

    // Search by title
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    // Filter overdue tasks
    if (overdue === 'true') {
      query.dueDate = { $lt: new Date() };
      query.status = { $ne: 'completed' };
    }

    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email')
      .populate('projectId', 'title')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { tasks, count: tasks.length },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error fetching tasks',
      error: error.message,
    });
  }
};

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
const getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('projectId', 'title');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    // Members can only view their own tasks
    if (
      req.user.role === 'member' &&
      task.assignedTo._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this task',
      });
    }

    res.json({
      success: true,
      data: { task },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error fetching task',
      error: error.message,
    });
  }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private (Admin: full update, Member: only own task status)
const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    // Role-based update logic
    if (req.user.role === 'member') {
      // Members can only update their own task's status
      if (task.assignedTo.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this task',
        });
      }

      // Members can only update status
      if (Object.keys(req.body).some((key) => key !== 'status')) {
        return res.status(403).json({
          success: false,
          message: 'Members can only update task status',
        });
      }

      if (req.body.status) {
        task.status = req.body.status;
      }
    } else {
      // Admin can update everything
      const { title, description, assignedTo, status, priority, dueDate } =
        req.body;

      if (title) task.title = title;
      if (description !== undefined) task.description = description;
      if (assignedTo) {
        // Verify new assignee is a member of the project
        const project = await Project.findById(task.projectId);
        if (!project.members.some((m) => m.toString() === assignedTo)) {
          return res.status(400).json({
            success: false,
            message: 'Assigned user must be a member of the project',
          });
        }
        task.assignedTo = assignedTo;
      }
      if (status) task.status = status;
      if (priority) task.priority = priority;
      if (dueDate) task.dueDate = dueDate;
    }

    await task.save();
    await task.populate('assignedTo', 'name email');
    await task.populate('projectId', 'title');

    res.json({
      success: true,
      message: 'Task updated successfully',
      data: { task },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error updating task',
      error: error.message,
    });
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Admin
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    await Task.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error deleting task',
      error: error.message,
    });
  }
};

module.exports = {
  createTask,
  getTasks,
  getTask,
  updateTask,
  deleteTask,
  createTaskValidation,
  updateTaskValidation,
};
