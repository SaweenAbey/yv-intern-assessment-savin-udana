import jwt from 'jsonwebtoken';
import User from '../model/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'association-secret-key-987654321!';

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Register a new member
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res, next) => {
  const { fullName, email, password, applicantType } = req.body;

  if (!fullName || !email || !password || !applicantType) {
    return res.status(400).json({ message: 'Please enter all fields: fullName, email, password, applicantType' });
  }

  if (!['INDIVIDUAL', 'COMPANY'].includes(applicantType)) {
    return res.status(400).json({ message: 'Applicant type must be INDIVIDUAL or COMPANY' });
  }

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already registered' });
    }

    const user = await User.create({
      fullName,
      email,
      passwordHash: password, // Hashed in pre-save hook
      userType: 'MEMBER',
      applicantType,
      isActive: true
    });

    res.status(201).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      userType: user.userType,
      applicantType: user.applicantType,
      token: generateToken(user._id)
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Please enter all fields: email, password' });
  }

  try {
    const user = await User.findOne({ email });

    if (user && (await user.comparePassword(password))) {
      if (!user.isActive) {
        return res.status(403).json({ message: 'Account is deactivated. Please contact support.' });
      }

      res.json({
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        userType: user.userType,
        applicantType: user.applicantType,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get user profile and effective permissions
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res, next) => {
  try {
    let permissions = [];

    if (req.user.userType === 'CHAIRMAN') {
      permissions = [
        'member.view',
        'application.view',
        'application.approve',
        'application.reject',
        'role.manage',
        'audit.view'
      ];
    } else if (req.user.userType === 'OFFICER') {
      permissions = req.user.officerRoleId ? req.user.officerRoleId.permissions : [];
    }

    res.json({
      _id: req.user._id,
      fullName: req.user.fullName,
      email: req.user.email,
      userType: req.user.userType,
      applicantType: req.user.applicantType,
      officerRoleName: req.user.officerRoleId ? req.user.officerRoleId.name : null,
      permissions
    });
  } catch (error) {
    next(error);
  }
};
