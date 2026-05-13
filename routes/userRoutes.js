const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getUsers } = require('../controllers/userController');

router.get('/', protect, authorize('admin'), getUsers);

module.exports = router;
