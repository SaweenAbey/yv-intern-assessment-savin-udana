import jwt from 'jsonwebtoken';
import User from '../model/User.js';
import OfficerRole from '../model/OfficerRole.js';

const JWT_SECRET = process.env.JWT_SECRET || 'association-secret-key-987654321!';


export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    
    const user = await User.findById(decoded.id).select('-passwordHash');

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is deactivated. Please contact support.' });
    }

    if (user.userType === 'OFFICER' && user.officerRoleId) {
      await user.populate('officerRoleId');
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('JWT authentication error:', error.message);
    res.status(401).json({ message: 'Not authorized, token validation failed' });
  }
};


export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.userType)) {
      return res.status(403).json({ message: `Access denied: role '${req.user?.userType || 'Visitor'}' is not authorized` });
    }
    next();
  };
};


export const checkPermission = (permissionKey) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    
    if (req.user.userType === 'CHAIRMAN') {
      return next();
    }

    
    if (req.user.userType === 'OFFICER') {
      if (req.user.officerRoleId && req.user.officerRoleId.permissions.includes(permissionKey)) {
        return next();
      }
      return res.status(403).json({ message: `Access denied: missing required permission '${permissionKey}'` });
    }

    
    res.status(403).json({ message: `Access denied: missing required permission '${permissionKey}'` });
  };
};
