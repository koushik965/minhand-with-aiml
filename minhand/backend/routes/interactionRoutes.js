const express = require('express');
const r = express.Router();
const { logInteraction } = require('../controllers/interactionController');
const { protect } = require('../middleware/auth');
r.post('/', protect, logInteraction);
module.exports = r;
