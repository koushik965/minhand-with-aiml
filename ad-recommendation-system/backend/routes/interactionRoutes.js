const express = require('express');
const router = express.Router();
const { logInteraction, getUserInteractions } = require('../controllers/interactionController');
const { protect } = require('../middleware/auth');

router.post('/', protect, logInteraction);
router.get('/', protect, getUserInteractions);

module.exports = router;
