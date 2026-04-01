const express = require('express');
const r = express.Router();
const { register, login, getProfile } = require('../controllers/userController');
const { protect } = require('../middleware/auth');
r.post('/register', register);
r.post('/login', login);
r.get('/profile', protect, getProfile);
module.exports = r;
