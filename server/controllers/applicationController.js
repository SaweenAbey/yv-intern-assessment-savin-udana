import MemberApplication from '../model/MemberApplication.js';
import User from '../model/User.js';
import Membership from '../model/Membership.js';
import MembershipType from '../model/MembershipType.js';
import AuditLog from '../model/AuditLog.js';
import { logger } from '../utils/logger.js';

// @desc    Get all active membership types
// @route   GET /api/applications/membership-types
// @access  Private (Logged-in users)
export const getMembershipTypes = async (req, res, next) => {
  try {
    const types = await MembershipType.find({ isActive: true }).sort({ annualFee: 1 });
    res.json(types);
  } catch (error) {
    next(error);
  }
};

// @desc    Submit a membership application
// @route   POST /api/applications
// @access  Private (Member only)
export const submitApplication = async (req, res, next) => {
  if (req.user.userType !== 'MEMBER') {
    return res.status(403).json({ message: 'Only registered members can submit a membership application' });
  }

  const { 
    membershipTypeId, 
    applicantType, 
    fullName, 
    companyName, 
    nic, 
    registrationNo, 
    email, 
    phone, 
    address 
  } = req.body;

  const errors = {};

  // 1. Applicant Type Validation (BR-01)
  if (!applicantType || !['INDIVIDUAL', 'COMPANY'].includes(applicantType)) {
    errors.applicantType = 'Applicant type must be INDIVIDUAL or COMPANY';
  } else if (applicantType !== req.user.applicantType) {
    errors.applicantType = `You registered as ${req.user.applicantType} and must submit matching application type`;
  }

  // 2. Name validation (3 to 100 chars)
  if (applicantType === 'INDIVIDUAL') {
    if (!fullName || fullName.length < 3 || fullName.length > 100) {
      errors.fullName = 'Full name is required and must be between 3 and 100 characters';
    }
    if (!nic || nic.trim() === '') {
      errors.nic = 'NIC number is required for individual applicants';
    }
  } else if (applicantType === 'COMPANY') {
    if (!companyName || companyName.length < 3 || companyName.length > 100) {
      errors.companyName = 'Company name is required and must be between 3 and 100 characters';
    }
    if (!registrationNo || registrationNo.trim() === '') {
      errors.registrationNo = 'Business registration no. is required for company applicants';
    }
  }

  // 3. Email Validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    errors.email = 'Please enter a valid email address';
  }

  // 4. Phone Validation (Sri Lankan Format: 0771234567 or +94771234567)
  const slPhoneRegex = /^(?:\+94|0)?7[0-9]{8}$/;
  if (!phone || !slPhoneRegex.test(phone)) {
    errors.phone = 'Please provide a valid Sri Lankan phone number (e.g. 0771234567 or +94771234567)';
  }

  // 5. Address Validation (Max 250 characters)
  if (!address || address.trim() === '') {
    errors.address = 'Address is required';
  } else if (address.length > 250) {
    errors.address = 'Address must not exceed 250 characters';
  }

  // 6. Membership Type Validation
  if (!membershipTypeId) {
    errors.membershipTypeId = 'Membership type is required';
  }

  try {
    // Check if user has active or pending applications (BR-03 & BR-04)
    const userApplications = await MemberApplication.find({ userId: req.user._id });
    const hasPending = userApplications.some(app => app.status === 'PENDING');
    const hasApproved = userApplications.some(app => app.status === 'APPROVED');

    if (hasPending) {
      return res.status(400).json({ message: 'A user can hold only one PENDING application at a time (BR-03)' });
    }
    if (hasApproved) {
      return res.status(400).json({ message: 'You already have an active approved membership application' });
    }

    // Check email uniqueness per application (across active or pending applications)
    if (email && !errors.email) {
      const emailExists = await MemberApplication.findOne({ 
        email: email.toLowerCase(),
        status: { $in: ['PENDING', 'APPROVED'] }
      });
      if (emailExists) {
        errors.email = 'This email is already in use by an active or pending applicant';
      }
    }

    // Verify membership type matches applicant type
    if (membershipTypeId && applicantType && !errors.membershipTypeId) {
      const mType = await MembershipType.findById(membershipTypeId);
      if (!mType) {
        errors.membershipTypeId = 'Selected membership type does not exist';
      } else if (mType.applicableTo !== applicantType) {
        errors.membershipTypeId = `The selected plan is only applicable to ${mType.applicableTo} applicants`;
      }
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ message: 'Validation failed', errors });
    }

    // Create a new application record (BR-04: keeps the old rejected records intact)
    const application = await MemberApplication.create({
      userId: req.user._id,
      membershipTypeId,
      applicantType,
      fullName: applicantType === 'INDIVIDUAL' ? fullName : '',
      companyName: applicantType === 'COMPANY' ? companyName : '',
      nic: applicantType === 'INDIVIDUAL' ? nic : '',
      registrationNo: applicantType === 'COMPANY' ? registrationNo : '',
      email: email.toLowerCase(),
      phone,
      address,
      status: 'PENDING'
    });

    logger.success(`New application submitted by user: ${req.user.email} (App ID: ${application._id})`);
    res.status(201).json({ message: 'Membership application submitted successfully', application });
  } catch (error) {
    logger.error(`Failed application submission by user: ${req.user.email}`, error);
    next(error);
  }
};

// @desc    Get current member's application status
// @route   GET /api/applications/my
// @access  Private (Member only)
export const getMyApplication = async (req, res, next) => {
  if (req.user.userType !== 'MEMBER') {
    return res.status(403).json({ message: 'Only members can view their application status' });
  }

  try {
    // Find the latest application of the user (BR-04: since there may be old rejected ones)
    const application = await MemberApplication.findOne({ userId: req.user._id })
      .populate('membershipTypeId', 'name description annualFee')
      .sort({ createdAt: -1 });
    
    if (!application) {
      return res.status(404).json({ message: 'No application found for this member' });
    }

    // Get active membership if approved
    let membership = null;
    if (application.status === 'APPROVED') {
      membership = await Membership.findOne({ userId: req.user._id });
    }

    res.json({
      application,
      membership
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all applications (with status filter and pagination)
// @route   GET /api/applications
// @access  Private (Staff only - requires application.view permission)
export const getApplications = async (req, res, next) => {
  const { status, page = 1, limit = 10 } = req.query;
  
  const query = {};
  if (status) {
    query.status = status;
  }

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skipNum = (pageNum - 1) * limitNum;

  try {
    const total = await MemberApplication.countDocuments(query);
    
    const applications = await MemberApplication.find(query)
      .populate('userId', 'fullName email')
      .populate('membershipTypeId', 'name description annualFee')
      .populate('reviewedBy', 'fullName email userType')
      .sort({ createdAt: -1 })
      .skip(skipNum)
      .limit(limitNum);

    res.json({
      applications,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      total
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve application
// @route   POST /api/applications/:id/approve
// @access  Private (Staff only - requires application.approve permission)
export const approveApplication = async (req, res, next) => {
  try {
    const application = await MemberApplication.findById(req.params.id);

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (application.status !== 'PENDING') {
      return res.status(400).json({ message: `Application status is already ${application.status}` });
    }

    // Generate unique membership number: YV-2026-000123 (BR-10 format)
    const year = new Date().getFullYear();
    const count = await Membership.countDocuments();
    
    let isUnique = false;
    let finalMembershipNumber = '';
    let offset = 1;

    while (!isUnique) {
      const generatedNum = `YV-${year}-${String(count + offset).padStart(6, '0')}`;
      const existingMembership = await Membership.findOne({ membershipNumber: generatedNum });
      if (!existingMembership) {
        finalMembershipNumber = generatedNum;
        isUnique = true;
      } else {
        offset++;
      }
    }

    // Create Membership record (BR-02: membership active only after approval)
    const startDate = new Date();
    const endDate = new Date();
    endDate.setFullYear(startDate.getFullYear() + 1); // 1-year annual duration

    const membership = await Membership.create({
      userId: application.userId,
      applicationId: application._id,
      membershipNumber: finalMembershipNumber,
      membershipTypeId: application.membershipTypeId,
      status: 'ACTIVE',
      startDate,
      endDate
    });

    // Update application record
    application.status = 'APPROVED';
    application.reviewedBy = req.user._id;
    application.reviewedAt = new Date();
    await application.save();

    // Record Audit Log (BR-09, F-13)
    await AuditLog.create({
      actorUserId: req.user._id,
      action: 'APPLICATION_APPROVED',
      entityType: 'MemberApplication',
      entityId: application._id,
      details: {
        membershipId: membership._id,
        membershipNumber: finalMembershipNumber,
        memberId: application.userId,
        description: `Approved membership application for ${application.fullName || application.companyName}. Assigned ID: ${finalMembershipNumber}`
      },
      ipAddress: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || ''
    });

    logger.success(`Application ${application._id} approved by ${req.user.email}. Assigned membership: ${finalMembershipNumber}`);
    res.json({
      message: 'Application approved successfully',
      membershipNumber: finalMembershipNumber,
      application,
      membership
    });
  } catch (error) {
    logger.error(`Failed application approval for ID: ${req.params.id} by ${req.user.email}`, error);
    next(error);
  }
};

// @desc    Reject application
// @route   POST /api/applications/:id/reject
// @access  Private (Staff only - requires application.reject permission)
export const rejectApplication = async (req, res, next) => {
  const { rejectionReason } = req.body;

  if (!rejectionReason || rejectionReason.trim() === '') {
    return res.status(400).json({ message: 'Rejection reason is required' });
  }

  try {
    const application = await MemberApplication.findById(req.params.id);

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (application.status !== 'PENDING') {
      return res.status(400).json({ message: `Application status is already ${application.status}` });
    }

    // Update application record
    application.status = 'REJECTED';
    application.rejectionReason = rejectionReason;
    application.reviewedBy = req.user._id;
    application.reviewedAt = new Date();
    await application.save();

    // Record Audit Log (BR-09, F-13)
    await AuditLog.create({
      actorUserId: req.user._id,
      action: 'APPLICATION_REJECTED',
      entityType: 'MemberApplication',
      entityId: application._id,
      details: {
        rejectionReason,
        memberId: application.userId,
        description: `Rejected application for ${application.fullName || application.companyName}. Reason: ${rejectionReason}`
      },
      ipAddress: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || ''
    });

    logger.warn(`Application ${application._id} rejected by ${req.user.email}. Reason: ${rejectionReason}`);
    res.json({
      message: 'Application rejected successfully',
      application
    });
  } catch (error) {
    logger.error(`Failed application rejection for ID: ${req.params.id} by ${req.user.email}`, error);
    next(error);
  }
};

// @desc    Get dashboard metrics (total members, pending applications, approved this month)
// @route   GET /api/applications/dashboard-counts
// @access  Private (Staff only)
export const getDashboardCounts = async (req, res, next) => {
  try {
    const totalMembers = await User.countDocuments({ userType: 'MEMBER' });
    const pendingApplications = await MemberApplication.countDocuments({ status: 'PENDING' });

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const approvedThisMonth = await MemberApplication.countDocuments({
      status: 'APPROVED',
      reviewedAt: { $gte: startOfMonth }
    });

    res.json({
      totalMembers,
      pendingApplications,
      approvedThisMonth
    });
  } catch (error) {
    logger.error('Error fetching dashboard counts', error);
    next(error);
  }
};
