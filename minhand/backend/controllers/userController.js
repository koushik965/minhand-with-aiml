const User = require('../models/User');
const { generateToken } = require('../middleware/auth');

const register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    const exists = await User.findOne({ $or: [{ email }, { username }] });
    if (exists) return res.status(400).json({ success: false, message: 'User already exists.' });
    const user = await User.create({ username, email, password });
    const token = generateToken(user._id, user.role);
    res.status(201).json({ success: true, token, user: { id: user._id, username: user.username, email: user.email, role: user.role } });
  } catch (error) { next(error); }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required.' });
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    const token = generateToken(user._id, user.role);
    res.json({ success: true, token, user: { id: user._id, username: user.username, email: user.email, role: user.role } });
  } catch (error) { next(error); }
};

const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, user: { id: user._id, username: user.username, email: user.email, role: user.role, totalInteractions: user.totalInteractions, lastActive: user.lastActive, createdAt: user.createdAt } });
  } catch (error) { next(error); }
};

module.exports = { register, login, getProfile };
