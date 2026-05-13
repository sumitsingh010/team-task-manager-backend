const Task = require('../models/Task');
const Project = require('../models/Project');

// @desc    Get dashboard analytics
// @route   GET /api/dashboard
// @access  Private
const getDashboard = async (req, res) => {
  try {
    let projectQuery = {};
    let taskQuery = {};

    // Members only see their data
    if (req.user.role === 'member') {
      projectQuery.members = req.user._id;
      taskQuery.assignedTo = req.user._id;
    }

    // Get project stats
    const totalProjects = await Project.countDocuments(projectQuery);
    const activeProjects = await Project.countDocuments({
      ...projectQuery,
      status: 'active',
    });
    const completedProjects = await Project.countDocuments({
      ...projectQuery,
      status: 'completed',
    });

    // Get task stats
    const totalTasks = await Task.countDocuments(taskQuery);
    const todoTasks = await Task.countDocuments({
      ...taskQuery,
      status: 'todo',
    });
    const inProgressTasks = await Task.countDocuments({
      ...taskQuery,
      status: 'in-progress',
    });
    const completedTasks = await Task.countDocuments({
      ...taskQuery,
      status: 'completed',
    });

    // Overdue tasks
    const overdueTasks = await Task.find({
      ...taskQuery,
      dueDate: { $lt: new Date() },
      status: { $ne: 'completed' },
    })
      .populate('assignedTo', 'name email')
      .populate('projectId', 'title')
      .sort({ dueDate: 1 })
      .limit(10);

    // Recent tasks
    const recentTasks = await Task.find(taskQuery)
      .populate('assignedTo', 'name email')
      .populate('projectId', 'title')
      .sort({ createdAt: -1 })
      .limit(5);

    // Tasks by priority
    const highPriorityTasks = await Task.countDocuments({
      ...taskQuery,
      priority: 'high',
      status: { $ne: 'completed' },
    });

    res.json({
      success: true,
      data: {
        projects: {
          total: totalProjects,
          active: activeProjects,
          completed: completedProjects,
        },
        tasks: {
          total: totalTasks,
          todo: todoTasks,
          inProgress: inProgressTasks,
          completed: completedTasks,
          overdue: overdueTasks.length,
          highPriority: highPriorityTasks,
        },
        overdueTasks,
        recentTasks,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error fetching dashboard data',
      error: error.message,
    });
  }
};

module.exports = { getDashboard };
