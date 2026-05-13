const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const {
  createTask,
  getTasks,
  getTask,
  updateTask,
  deleteTask,
  createTaskValidation,
  updateTaskValidation,
} = require('../controllers/taskController');

// All routes are protected
router.use(protect);

router.get('/', getTasks);
router.post(
  '/',
  authorize('admin'),
  createTaskValidation,
  validate,
  createTask
);
router.get('/:id', getTask);
router.put('/:id', updateTaskValidation, validate, updateTask);
router.delete('/:id', authorize('admin'), deleteTask);

module.exports = router;
