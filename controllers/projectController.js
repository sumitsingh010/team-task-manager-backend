const { body } = require('express-validator');
const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');

// Validation rules
const createProjectValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Project title is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Title must be between 2 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
];

const updateProjectValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Title must be between 2 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('status')
    .optional()
    .isIn(['active', 'completed', 'archived'])
    .withMessage('Status must be active, completed, or archived'),
];

// @desc    Create project
// @route   POST /api/projects
// @access  Admin
const createProject = async (req, res) => {
  try {
    const { title, description } = req.body;

    const project = await Project.create({
      title,
      description,
      createdBy: req.user._id,
      members: [req.user._id], // Creator is first member
    });

    await project.populate('members', 'name email role');
    await project.populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: { project },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error creating project',
      error: error.message,
    });
  }
};

// @desc    Get all projects
// @route   GET /api/projects
// @access  Private
const getProjects = async (req, res) => {
  try {
    const { search, status } = req.query;
    let query = {};

    // Members can only see projects they belong to
    if (req.user.role === 'member') {
      query.members = req.user._id;
    }

    // Filter by status
    if (status && ['active', 'completed', 'archived'].includes(status)) {
      query.status = status;
    }

    // Search by title
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    const projects = await Project.find(query)
      .populate('members', 'name email role')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    // Get task counts for each project
    const projectsWithCounts = await Promise.all(
      projects.map(async (project) => {
        const taskCount = await Task.countDocuments({ projectId: project._id });
        const completedCount = await Task.countDocuments({
          projectId: project._id,
          status: 'completed',
        });
        return {
          ...project.toObject(),
          taskCount,
          completedCount,
        };
      })
    );

    res.json({
      success: true,
      data: { projects: projectsWithCounts },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error fetching projects',
      error: error.message,
    });
  }
};

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Private
const getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('members', 'name email role')
      .populate('createdBy', 'name email');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    // Members can only view projects they belong to
    if (
      req.user.role === 'member' &&
      !project.members.some((m) => m._id.toString() === req.user._id.toString())
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this project',
      });
    }

    // Get tasks for this project
    const tasks = await Task.find({ projectId: project._id })
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { project, tasks },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error fetching project',
      error: error.message,
    });
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Admin
const updateProject = async (req, res) => {
  try {
    const { title, description, status } = req.body;

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    if (title) project.title = title;
    if (description !== undefined) project.description = description;
    if (status) project.status = status;

    await project.save();
    await project.populate('members', 'name email role');
    await project.populate('createdBy', 'name email');

    res.json({
      success: true,
      message: 'Project updated successfully',
      data: { project },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error updating project',
      error: error.message,
    });
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Admin
const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    // Delete all tasks associated with this project
    await Task.deleteMany({ projectId: project._id });

    await Project.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Project and associated tasks deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error deleting project',
      error: error.message,
    });
  }
};

// @desc    Add member to project
// @route   POST /api/projects/:id/members
// @access  Admin
const addMember = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
      });
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if user is already a member
    if (project.members.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: 'User is already a member of this project',
      });
    }

    project.members.push(userId);
    await project.save();
    await project.populate('members', 'name email role');
    await project.populate('createdBy', 'name email');

    res.json({
      success: true,
      message: 'Member added successfully',
      data: { project },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error adding member',
      error: error.message,
    });
  }
};

// @desc    Remove member from project
// @route   DELETE /api/projects/:id/members/:userId
// @access  Admin
const removeMember = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    const memberIndex = project.members.indexOf(req.params.userId);
    if (memberIndex === -1) {
      return res.status(400).json({
        success: false,
        message: 'User is not a member of this project',
      });
    }

    // Don't allow removing the project creator
    if (project.createdBy.toString() === req.params.userId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove the project creator',
      });
    }

    project.members.splice(memberIndex, 1);
    await project.save();
    await project.populate('members', 'name email role');
    await project.populate('createdBy', 'name email');

    res.json({
      success: true,
      message: 'Member removed successfully',
      data: { project },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error removing member',
      error: error.message,
    });
  }
};

module.exports = {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
  createProjectValidation,
  updateProjectValidation,
};
