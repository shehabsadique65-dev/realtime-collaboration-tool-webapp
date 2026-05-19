const express = require('express');
const router = express.Router();
const { createRoom, joinRoom, getActiveUsers } = require('../controllers/room.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

router.post('/create', createRoom);
router.post('/join', joinRoom);
router.get('/:id/users', getActiveUsers);

module.exports = router;
