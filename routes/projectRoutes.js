const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
  createProjectValidation,
  updateProjectValidation,
} = require('../controllers/projectController');

// All routes are protected
router.use(protect);

router.get('/', getProjects);
router.post(
  '/',
  authorize('admin'),
  createProjectValidation,
  validate,
  createProject
);
router.get('/:id', getProject);
router.put(
  '/:id',
  authorize('admin'),
  updateProjectValidation,
  validate,
  updateProject
);
router.delete('/:id', authorize('admin'), deleteProject);

// Member management
router.post('/:id/members', authorize('admin'), addMember);
router.delete('/:id/members/:userId', authorize('admin'), removeMember);

module.exports = router;
