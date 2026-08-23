import OfficerRole from '../model/OfficerRole.js';
import User from '../model/User.js';
import AuditLog from '../model/AuditLog.js';
import { logger } from '../utils/logger.js';




export const createRole = async (req, res, next) => {
  const { name, description, permissions } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Role name is required' });
  }

  const VALID_PERMISSIONS = [
    'member.view',
    'application.view',
    'application.approve',
    'application.reject',
    'role.manage',
    'audit.view'
  ];

  const invalidPermissions = permissions?.filter(p => !VALID_PERMISSIONS.includes(p)) || [];
  if (invalidPermissions.length > 0) {
    return res.status(400).json({ message: `Invalid permission keys: ${invalidPermissions.join(', ')}` });
  }

  try {
    const roleExists = await OfficerRole.findOne({ name });
    if (roleExists) {
      return res.status(400).json({ message: 'Role name already exists' });
    }

    const role = await OfficerRole.create({
      name,
      description: description || '',
      permissions: permissions || [],
      createdBy: req.user._id
    });

    await AuditLog.create({
      actorUserId: req.user._id,
      action: 'ROLE_PERMISSIONS_CHANGED',
      entityType: 'OfficerRole',
      entityId: role._id,
      details: {
        roleName: role.name,
        newPermissions: role.permissions,
        description: `Created role '${role.name}' with permissions: ${role.permissions.join(', ')}`
      },
      ipAddress: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || ''
    });

    logger.success(`Created officer role '${role.name}' by ${req.user.email}`);
    res.status(201).json({ message: 'Officer role created successfully', role });
  } catch (error) {
    logger.error(`Failed to create officer role: ${name} by ${req.user.email}`, error);
    next(error);
  }
};




export const updateRole = async (req, res, next) => {
  const { permissions } = req.body;

  const VALID_PERMISSIONS = [
    'member.view',
    'application.view',
    'application.approve',
    'application.reject',
    'role.manage',
    'audit.view'
  ];

  const invalidPermissions = permissions?.filter(p => !VALID_PERMISSIONS.includes(p)) || [];
  if (invalidPermissions.length > 0) {
    return res.status(400).json({ message: `Invalid permission keys: ${invalidPermissions.join(', ')}` });
  }

  try {
    const role = await OfficerRole.findById(req.params.id);
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    const oldPermissions = [...role.permissions];
    role.permissions = permissions || [];
    await role.save();

    await AuditLog.create({
      actorUserId: req.user._id,
      action: 'ROLE_PERMISSIONS_CHANGED',
      entityType: 'OfficerRole',
      entityId: role._id,
      details: {
        roleName: role.name,
        oldPermissions,
        newPermissions: role.permissions,
        description: `Updated permissions for role '${role.name}'. Old: [${oldPermissions.join(', ')}], New: [${role.permissions.join(', ')}]`
      },
      ipAddress: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || ''
    });

    logger.success(`Updated officer role '${role.name}' permissions to [${role.permissions.join(', ')}] by ${req.user.email}`);
    res.json({ message: 'Role permissions updated successfully', role });
  } catch (error) {
    logger.error(`Failed to update permissions for role ID: ${req.params.id} by ${req.user.email}`, error);
    next(error);
  }
};




export const getRoles = async (req, res, next) => {
  try {
    const roles = await OfficerRole.find().sort({ name: 1 });
    res.json(roles);
  } catch (error) {
    next(error);
  }
};




export const assignRole = async (req, res, next) => {
  const { userId } = req.body;
  const roleId = req.params.id;

  if (!userId || !roleId) {
    return res.status(400).json({ message: 'User ID and Role ID (in parameter) are required' });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const oldRole = user.userType;
    let officerRoleName = null;

    if (roleId.toLowerCase() === 'member') {
      user.userType = 'MEMBER';
      user.officerRoleId = null;
    } else {
      const assignedRole = await OfficerRole.findById(roleId);
      if (!assignedRole) {
        return res.status(404).json({ message: 'Officer Role not found' });
      }
      user.userType = 'OFFICER';
      user.officerRoleId = roleId;
      officerRoleName = assignedRole.name;
    }

    await user.save();

    await AuditLog.create({
      actorUserId: req.user._id,
      action: 'ROLE_ASSIGNED',
      entityType: 'User',
      entityId: user._id,
      details: {
        userName: user.fullName,
        userEmail: user.email,
        oldRole,
        newRole: user.userType,
        officerRoleName,
        description: `Assigned role '${user.userType}${officerRoleName ? ` (${officerRoleName})` : ''}' to user: ${user.fullName}`
      },
      ipAddress: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || ''
    });

    logger.success(`Assigned role '${user.userType}' to user ${user.email} by ${req.user.email}`);
    res.json({ message: 'User role assigned successfully', user });
  } catch (error) {
    logger.error(`Failed to assign role to user ID: ${userId} by ${req.user.email}`, error);
    next(error);
  }
};




export const createOfficer = async (req, res, next) => {
  const { name, email, password, officerRoleId } = req.body;

  if (!name || !email || !password || !officerRoleId) {
    return res.status(400).json({ message: 'Please enter all fields: name, email, password, officerRoleId' });
  }

  try {
    const role = await OfficerRole.findById(officerRoleId);
    if (!role) {
      return res.status(404).json({ message: 'Officer role not found' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const officer = await User.create({
      fullName: name,
      email,
      passwordHash: password, 
      userType: 'OFFICER',
      officerRoleId: officerRoleId,
      isActive: true
    });

    await AuditLog.create({
      actorUserId: req.user._id,
      action: 'ROLE_ASSIGNED',
      entityType: 'User',
      entityId: officer._id,
      details: {
        userName: officer.fullName,
        userEmail: officer.email,
        oldRole: 'None',
        newRole: 'OFFICER',
        officerRoleName: role.name,
        description: `Created staff officer user '${officer.fullName}' with role '${role.name}'`
      },
      ipAddress: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || ''
    });

    logger.success(`Created new officer staff account: ${officer.email} (Role: ${role.name}) by ${req.user.email}`);
    res.status(201).json({
      message: 'Officer staff user registered successfully',
      officer: {
        _id: officer._id,
        fullName: officer.fullName,
        email: officer.email,
        userType: officer.userType,
        officerRole: role.name
      }
    });
  } catch (error) {
    logger.error(`Failed to create officer staff user: ${email} by ${req.user.email}`, error);
    next(error);
  }
};




export const getOfficers = async (req, res, next) => {
  try {
    const officers = await User.find({ userType: 'OFFICER' })
      .populate('officerRoleId', 'name permissions')
      .select('-passwordHash')
      .sort({ createdAt: -1 });

    res.json(officers);
  } catch (error) {
    next(error);
  }
};




export const getAuditLogs = async (req, res, next) => {
  const { page = 1, limit = 10 } = req.query;
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skipNum = (pageNum - 1) * limitNum;

  try {
    const total = await AuditLog.countDocuments();
    const logs = await AuditLog.find()
      .populate('actorUserId', 'fullName email userType')
      .sort({ createdAt: -1 })
      .skip(skipNum)
      .limit(limitNum);

    res.json({
      logs,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      total
    });
  } catch (error) {
    next(error);
  }
};
